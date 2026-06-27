const User = require('../models/User');
const Room = require('../models/Room');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const Gift = require('../models/Gift');
const Vehicle = require('../models/Vehicle');
const Post = require('../models/Post');
const Agency = require('../models/Agency');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, bannedUsers, totalRooms,
      activeRooms, totalTransactions, totalRevenue, pendingReports,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isOnline: true, isDeleted: false, isBanned: false }),
      User.countDocuments({ isBanned: true }),
      Room.countDocuments(),
      Room.countDocuments({ isActive: true }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.aggregate([{ $match: { type: 'recharge', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Report.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, activeUsers, bannedUsers, totalRooms,
        activeRooms, totalTransactions, totalRevenue: totalRevenue[0]?.total || 0,
        pendingReports,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, search, sort, isBanned, isVerified } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    let sortObj = { createdAt: -1 };
    if (sort === 'diamonds') sortObj = { diamonds: -1 };
    if (sort === 'level') sortObj = { level: -1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sortObj).skip(skip).limit(lim).select('-password -refreshToken'),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBanned = !user.isBanned;
    user.banReason = user.isBanned ? (req.body.reason || 'Violation of terms') : undefined;
    await user.save();

    res.json({ success: true, isBanned: user.isBanned, message: user.isBanned ? 'User banned' : 'User unbanned' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user ban status' });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.verified !== false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update verification' });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { page, limit, type, isActive } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = {};
    if (type) query.roomType = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [rooms, total] = await Promise.all([
      Room.find(query).populate('owner', 'displayName uid').sort({ createdAt: -1 }).skip(skip).limit(lim),
      Room.countDocuments(query),
    ]);

    res.json({ success: true, data: rooms, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get rooms' });
  }
};

exports.closeRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room closed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to close room' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      Report.find(query).populate('reporter', 'displayName uid').sort({ createdAt: -1 }).skip(skip).limit(lim),
      Report.countDocuments(query),
    ]);

    res.json({ success: true, data: reports, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || 'resolved', handledBy: req.user._id, action: req.body.action, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page, limit, type, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).populate('user', 'displayName uid').sort({ createdAt: -1 }).skip(skip).limit(lim),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, data: transactions, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get transactions' });
  }
};

exports.manageGift = async (req, res) => {
  try {
    const { action } = req.query;
    const giftData = req.body;

    if (action === 'create') {
      const gift = await Gift.create(giftData);
      return res.status(201).json({ success: true, gift });
    }
    if (action === 'update') {
      const gift = await Gift.findByIdAndUpdate(req.params.id, giftData, { new: true });
      if (!gift) return res.status(404).json({ success: false, message: 'Gift not found' });
      return res.json({ success: true, gift });
    }
    if (action === 'delete') {
      await Gift.findByIdAndUpdate(req.params.id, { isActive: false });
      return res.json({ success: true, message: 'Gift deactivated' });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to manage gift' });
  }
};

exports.manageVehicle = async (req, res) => {
  try {
    const { action } = req.query;
    const vehicleData = req.body;

    if (action === 'create') {
      const vehicle = await Vehicle.create(vehicleData);
      return res.status(201).json({ success: true, vehicle });
    }
    if (action === 'update') {
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, vehicleData, { new: true });
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      return res.json({ success: true, vehicle });
    }
    if (action === 'delete') {
      await Vehicle.findByIdAndUpdate(req.params.id, { isActive: false });
      return res.json({ success: true, message: 'Vehicle deactivated' });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to manage vehicle' });
  }
};

exports.getAgencies = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const [agencies, total] = await Promise.all([
      Agency.find().populate('owner', 'displayName uid').sort({ totalEarnings: -1 }).skip(skip).limit(lim),
      Agency.countDocuments(),
    ]);

    res.json({ success: true, data: agencies, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get agencies' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const [posts, total] = await Promise.all([
      Post.find({ isDeleted: false }).populate('user', 'displayName uid').sort({ createdAt: -1 }).skip(skip).limit(lim),
      Post.countDocuments({ isDeleted: false }),
    ]);

    res.json({ success: true, data: posts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get posts' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'moderator', 'admin', 'super_admin', 'server_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (role === 'server_owner' && req.user.role !== 'server_owner') {
      const existingOwner = await User.findOne({ role: 'server_owner' });
      if (existingOwner) {
        return res.status(403).json({ success: false, message: 'Server owner already exists' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

exports.addCoins = async (req, res) => {
  try {
    const { coins, diamonds } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (coins) user.coins += coins;
    if (diamonds) user.diamonds += diamonds;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'recharge',
      amount: diamonds || coins || 0,
      currency: diamonds ? 'diamond' : 'coin',
      status: 'completed',
      description: `Manual add by admin (${req.user?.username || 'admin'})`,
    });

    res.json({ success: true, coins: user.coins, diamonds: user.diamonds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add coins' });
  }
};
