const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const logger = require('../utils/logger');

const onlineUsers = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (!user || user.isBanned) return next(new Error('User not found or banned'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    logger.info(`User connected: ${user.displayName} (${user.uid})`);

    onlineUsers.set(user._id.toString(), { socketId: socket.id, userId: user._id });
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    socket.join(`user:${user._id}`);
    io.emit('user:online', { userId: user._id, uid: user.uid });

    socket.on('room:join', async (data) => {
      try {
        const { roomId, password } = data;
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.password && room.password !== password) {
          return socket.emit('error', { message: 'Invalid password' });
        }

        const availableSeat = room.seats.find(s => !s.user && !s.isLocked);
        const isListener = !availableSeat;

        if (!isListener) {
          availableSeat.user = user._id;
          availableSeat.joinedAt = new Date();
        } else {
          room.listeners.push(user._id);
        }

        room.eventLogs.push({ event: 'user_joined', user: user._id });
        if (room.listeners.length + room.seats.filter(s => s.user).length > room.peakUsers) {
          room.peakUsers = room.listeners.length + room.seats.filter(s => s.user).length;
        }

        await room.save();

        socket.join(`room:${roomId}`);
        socket.currentRoom = roomId;
        io.to(`room:${roomId}`).emit('room:user_joined', {
          userId: user._id,
          uid: user.uid,
          displayName: user.displayName,
          avatar: user.avatar,
          seat: availableSeat?.seatNumber || -1,
          isListener,
        });
      } catch (err) {
        logger.error(`Room join error: ${err.message}`);
      }
    });

    socket.on('room:leave', async () => {
      try {
        const roomId = socket.currentRoom;
        if (!roomId) return;

        const room = await Room.findById(roomId);
        if (!room) return;

        const seatIndex = room.seats.findIndex(s => s.user?.toString() === user._id.toString());
        if (seatIndex !== -1) {
          room.seats[seatIndex].user = undefined;
          room.seats[seatIndex].isMuted = false;
          room.seats[seatIndex].isSpeaking = false;
          room.seats[seatIndex].joinedAt = undefined;
        }
        room.listeners = room.listeners.filter(l => l.toString() !== user._id.toString());

        if (room.owner.toString() === user._id.toString()) {
          if (room.coOwners.length > 0) {
            room.owner = room.coOwners[0];
            room.coOwners.shift();
          } else if (room.moderators.length > 0) {
            room.owner = room.moderators[0];
            room.moderators.shift();
          } else {
            room.isActive = false;
          }
        }

        room.eventLogs.push({ event: 'user_left', user: user._id });
        await room.save();

        socket.leave(`room:${roomId}`);
        socket.currentRoom = null;

        io.to(`room:${roomId}`).emit('room:user_left', {
          userId: user._id,
          uid: user.uid,
          displayName: user.displayName,
        });

        if (!room.isActive) {
          io.to(`room:${roomId}`).emit('room:closed', { roomId });
        }
      } catch (err) {
        logger.error(`Room leave error: ${err.message}`);
      }
    });

    socket.on('room:message', async (data) => {
      try {
        const roomId = socket.currentRoom;
        if (!roomId) return;

        const message = await Message.create({
          sender: user._id,
          room: roomId,
          type: data.type || 'text',
          content: data.content,
          media: data.media,
        });

        await Room.findByIdAndUpdate(roomId, { $inc: { totalMessages: 1 } });

        io.to(`room:${roomId}`).emit('room:new_message', {
          _id: message._id,
          sender: { _id: user._id, uid: user.uid, displayName: user.displayName, avatar: user.avatar },
          type: message.type,
          content: message.content,
          media: message.media,
          createdAt: message.createdAt,
        });
      } catch (err) {
        logger.error(`Room message error: ${err.message}`);
      }
    });

    socket.on('private:message', async (data) => {
      try {
        const { receiverId, content, type } = data;
        const message = await Message.create({
          sender: user._id,
          receiver: receiverId,
          type: type || 'text',
          content,
        });

        const messageData = {
          _id: message._id,
          sender: { _id: user._id, uid: user.uid, displayName: user.displayName, avatar: user.avatar },
          receiver: receiverId,
          type: message.type,
          content: message.content,
          createdAt: message.createdAt,
        };

        socket.emit('private:message_sent', messageData);
        io.to(`user:${receiverId}`).emit('private:new_message', messageData);
      } catch (err) {
        logger.error(`Private message error: ${err.message}`);
      }
    });

    socket.on('private:typing', (data) => {
      const { receiverId, isTyping } = data;
      io.to(`user:${receiverId}`).emit('private:typing', {
        userId: user._id,
        isTyping,
      });
    });

    socket.on('private:read', async (data) => {
      try {
        const { messageIds } = data;
        await Message.updateMany(
          { _id: { $in: messageIds }, receiver: user._id },
          { isRead: true, readAt: new Date() }
        );
        socket.emit('private:read_ack', { messageIds });
      } catch (err) {
        logger.error(`Read receipt error: ${err.message}`);
      }
    });

    socket.on('room:mute', async (data) => {
      try {
        const { roomId, targetUserId, mute } = data;
        const room = await Room.findById(roomId);
        if (!room) return;

        const isOwner = room.owner.toString() === user._id.toString();
        const isCoOwner = room.coOwners.some(c => c.toString() === user._id.toString());
        const isMod = room.moderators.some(m => m.toString() === user._id.toString());

        if (!isOwner && !isCoOwner && !isMod) return;

        const seat = room.seats.find(s => s.user?.toString() === targetUserId);
        if (seat) {
          seat.isMuted = mute;
          await room.save();
          io.to(`room:${roomId}`).emit('room:seat_muted', { userId: targetUserId, muted: mute });
        }
      } catch (err) {
        logger.error(`Mute error: ${err.message}`);
      }
    });

    socket.on('room:kick', async (data) => {
      try {
        const { roomId, targetUserId } = data;
        const room = await Room.findById(roomId);
        if (!room) return;

        const isOwner = room.owner.toString() === user._id.toString();
        const isCoOwner = room.coOwners.some(c => c.toString() === user._id.toString());

        if (!isOwner && !isCoOwner) return;

        const seatIndex = room.seats.findIndex(s => s.user?.toString() === targetUserId);
        if (seatIndex !== -1) {
          room.seats[seatIndex].user = undefined;
          room.seats[seatIndex].isMuted = false;
          room.seats[seatIndex].isSpeaking = false;
          await room.save();

          const kickedSocket = [...io.sockets.sockets.values()].find(
            s => s.user?._id.toString() === targetUserId && s.currentRoom === roomId
          );
          if (kickedSocket) {
            kickedSocket.leave(`room:${roomId}`);
            kickedSocket.currentRoom = null;
            kickedSocket.emit('room:kicked', { roomId });
          }

          io.to(`room:${roomId}`).emit('room:user_kicked', { userId: targetUserId });
        }
      } catch (err) {
        logger.error(`Kick error: ${err.message}`);
      }
    });

    socket.on('room:transfer_ownership', async (data) => {
      try {
        const { roomId, targetUserId } = data;
        const room = await Room.findById(roomId);
        if (!room || room.owner.toString() !== user._id.toString()) return;

        room.coOwners.push(room.owner);
        room.owner = targetUserId;
        room.coOwners = room.coOwners.filter(c => c.toString() !== targetUserId);
        await room.save();

        io.to(`room:${roomId}`).emit('room:ownership_transferred', { newOwner: targetUserId });
      } catch (err) {
        logger.error(`Transfer ownership error: ${err.message}`);
      }
    });

    socket.on('room:send_gift', async (data) => {
      try {
        const { roomId, giftId, targetUserId, quantity = 1 } = data;
        const Gift = require('../models/Gift');
        const Transaction = require('../models/Transaction');

        const gift = await Gift.findById(giftId);
        if (!gift) return;

        const totalCost = gift.diamonds * quantity;
        const sender = await User.findById(user._id);
        if (sender.diamonds < totalCost) {
          return socket.emit('error', { message: 'Insufficient diamonds' });
        }

        sender.diamonds -= totalCost;
        sender.giftsSent += quantity;
        sender.totalGiftsValue += totalCost;
        await sender.save();

        if (targetUserId) {
          const receiver = await User.findById(targetUserId);
          if (receiver) {
            receiver.diamonds += Math.floor(totalCost * 0.9);
            receiver.giftsReceived += quantity;
            await receiver.save();
          }
        }

        await Transaction.create({
          user: user._id,
          type: 'gift_sent',
          amount: totalCost,
          currency: 'diamond',
          targetUser: targetUserId,
          gift: giftId,
          description: `Sent ${gift.name} x${quantity}`,
        });

        io.to(`room:${roomId}`).emit('room:gift_sent', {
          sender: { _id: user._id, uid: user.uid, displayName: user.displayName, avatar: user.avatar },
          receiver: targetUserId,
          gift: { _id: gift._id, name: gift.name, image: gift.image, type: gift.type },
          quantity,
          effects: gift.effects,
        });
      } catch (err) {
        logger.error(`Gift send error: ${err.message}`);
      }
    });

    socket.on('room:agora_token', async (data) => {
      try {
        const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
        const { roomId } = data;
        const room = await Room.findById(roomId);
        if (!room) return;

        const channelName = room.agoraChannel || room._id.toString();
        const uid = parseInt(user.uid.replace('LV', ''), 36) % 100000;
        const role = RtcRole.PUBLISHER;

        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
          process.env.AGORA_APP_ID,
          process.env.AGORA_APP_CERTIFICATE,
          channelName,
          uid,
          role,
          privilegeExpiredTs
        );

        socket.emit('room:agora_token', {
          token,
          channelName,
          uid,
          appId: process.env.AGORA_APP_ID,
        });
      } catch (err) {
        logger.error(`Agora token error: ${err.message}`);
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${user.displayName}`);
      onlineUsers.delete(user._id.toString());

      if (socket.currentRoom) {
        socket.emit('room:leave');
      }

      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();

      io.emit('user:offline', { userId: user._id, uid: user.uid });
    });
  });
};
