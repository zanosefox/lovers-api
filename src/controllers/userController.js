const User = require('../models/User');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id)
      .select('-password -refreshToken -devices -blockedUsers');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['displayName', 'username', 'bio', 'gender', 'age', 'country', 'language', 'avatar', 'coverImage'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.username) {
      const existing = await User.findOne({ username: req.body.username.toLowerCase().trim(), _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
      }
      updates.username = req.body.username.toLowerCase().trim();
      updates.displayName = req.body.displayName || req.body.username.trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -refreshToken -devices');

    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const query = {
      isDeleted: false,
      isBanned: false,
      $or: [
        { displayName: { $regex: q || '', $options: 'i' } },
        { username: { $regex: q || '', $options: 'i' } },
        { uid: { $regex: q || '', $options: 'i' } },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(lim).select('displayName username uid avatar level isVerified isOnline'),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

exports.followUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.isDeleted) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = req.user.following.includes(target._id);
    if (isFollowing) {
      req.user.following.pull(target._id);
      target.followers.pull(req.user._id);
      req.user.followingCount = Math.max(0, req.user.followingCount - 1);
      target.followersCount = Math.max(0, target.followersCount - 1);
    } else {
      req.user.following.push(target._id);
      target.followers.push(req.user._id);
      req.user.followingCount += 1;
      target.followersCount += 1;
    }

    await Promise.all([req.user.save(), target.save()]);
    res.json({ success: true, isFollowing: !isFollowing, followersCount: target.followersCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to follow/unfollow' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const isBlocked = req.user.blockedUsers.includes(target._id);
    if (isBlocked) {
      req.user.blockedUsers.pull(target._id);
    } else {
      req.user.blockedUsers.push(target._id);
      req.user.following.pull(target._id);
      target.followers.pull(req.user._id);
    }

    await Promise.all([req.user.save(), target.save()]);
    res.json({ success: true, isBlocked: !isBlocked });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block/unblock' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const user = await User.findById(req.params.id)
      .populate({ path: 'followers', options: { skip, limit: lim }, select: 'displayName username uid avatar level isVerified isOnline' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user.followers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get followers' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const user = await User.findById(req.params.id)
      .populate({ path: 'following', options: { skip, limit: lim }, select: 'displayName username uid avatar level isVerified isOnline' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user.following });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get following' });
  }
};

exports.getDevices = async (req, res) => {
  try {
    res.json({ success: true, data: req.user.devices.filter(d => d.isActive) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get devices' });
  }
};

exports.removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    req.user.devices = req.user.devices.filter(d => d.deviceId !== deviceId);
    await req.user.save();
    res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove device' });
  }
};

exports.setUserType = async (req, res) => {
  try {
    const { userType } = req.body;
    if (!['host', 'supporter', 'agent_host'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'userType must be host, supporter, or agent_host' });
    }
    if (req.user.userType) {
      return res.status(400).json({ success: false, message: 'User type already set' });
    }
    if (req.body.username) {
      const existing = await User.findOne({ username: req.body.username.toLowerCase().trim(), _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
      }
      req.user.username = req.body.username.toLowerCase().trim();
      req.user.displayName = req.body.username.trim();
    }
    if (req.body.age) req.user.age = Number(req.body.age);
    if (req.body.gender) req.user.gender = req.body.gender;
    req.user.userType = userType;
    req.user.markModified('userType');
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
    }
    res.status(500).json({ success: false, message: error.message || 'فشل في إعداد الحساب' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const baseUrl = `https://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
    console.log('Avatar uploaded:', avatarUrl, 'file:', req.file.path);
    req.user.avatar = avatarUrl;
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};
