const Room = require('../models/Room');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.createRoom = async (req, res) => {
  try {
    const { name, description, roomType, password, maxSeats, background, category } = req.body;
    const { v4: uuidv4 } = require('uuid');

    const room = await Room.create({
      name,
      description,
      roomType: roomType || 'public',
      password: roomType === 'private' ? password : undefined,
      maxSeats: Math.min(maxSeats || 12, 20),
      owner: req.user._id,
      category,
      background,
      agoraChannel: `room_${uuidv4()}`,
      seats: Array.from({ length: Math.min(maxSeats || 12, 20) }, (_, i) => ({
        seatNumber: i + 1,
      })),
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    logger.error(`Create room error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { type, category, page, limit, sort } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const query = { isActive: true };
    if (type) query.roomType = type;
    if (category) query.category = category;

    let sortObj = { peakUsers: -1, createdAt: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { peakUsers: -1 };

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .populate('owner', 'displayName uid avatar level isVerified')
        .sort(sortObj)
        .skip(skip)
        .limit(lim),
      Room.countDocuments(query),
    ]);

    res.json({ success: true, data: rooms, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get rooms' });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'displayName uid avatar level isVerified')
      .populate('coOwners', 'displayName uid avatar')
      .populate('moderators', 'displayName uid avatar')
      .populate('seats.user', 'displayName uid avatar level isVerified')
      .populate('listeners', 'displayName uid avatar level isVerified');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get room' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['name', 'description', 'password', 'maxSeats', 'background', 'category', 'tags'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'maxSeats') room[field] = Math.min(req.body[field], 20);
        else room[field] = req.body[field];
      }
    });

    if (req.body.password !== undefined && room.roomType === 'private') {
      room.password = req.body.password;
    }

    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    room.isActive = false;
    await room.save();
    res.json({ success: true, message: 'Room closed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
};

exports.addModerator = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!room.moderators.includes(req.body.userId)) {
      room.moderators.push(req.body.userId);
    }
    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add moderator' });
  }
};

exports.removeModerator = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    room.moderators.pull(req.params.userId);
    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove moderator' });
  }
};

exports.addCoOwner = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!room.coOwners.includes(req.body.userId)) {
      room.coOwners.push(req.body.userId);
    }
    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add co-owner' });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room.adminLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get logs' });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const isOwner = room.owner.toString() === req.user._id.toString();
    const isCo = room.coOwners.some(c => c.toString() === req.user._id.toString());
    if (!isOwner && !isCo) return res.status(403).json({ success: false, message: 'Not authorized' });

    room.announcements.push({
      message: req.body.message,
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add announcement' });
  }
};
