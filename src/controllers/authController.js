const User = require('../models/User');
const { generateToken, generateRefreshToken, generateUniqueId } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.socialLogin = async (req, res) => {
  try {
    const { provider, token: socialToken, deviceInfo } = req.body;

    if (provider !== 'google') {
      return res.status(400).json({ success: false, message: 'Only Google sign-in is supported' });
    }

    const { admin } = require('../config/firebase');
    let firebaseUser;

    try {
      firebaseUser = await admin.auth().verifyIdToken(socialToken);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    let user = await User.findOne({ googleId: firebaseUser.uid });
    if (!user && firebaseUser.email) {
      user = await User.findOne({ email: firebaseUser.email });
    }

    if (!user) {
      user = await User.create({
        googleId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.name || `User${generateUniqueId()}`,
        avatar: firebaseUser.picture || '',
        uid: generateUniqueId(),
        joinMethod: 'google',
        devices: deviceInfo ? [{
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType || 'android',
          fcmToken: deviceInfo.fcmToken,
          lastLogin: new Date(),
        }] : [],
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    if (deviceInfo) {
      const deviceIndex = user.devices.findIndex(d => d.deviceId === deviceInfo.deviceId);
      if (deviceIndex >= 0) {
        user.devices[deviceIndex].lastLogin = new Date();
        user.devices[deviceIndex].isActive = true;
      } else if (deviceInfo.deviceId) {
        user.devices.push({ ...deviceInfo, lastLogin: new Date() });
      }
    }
    await user.save();

    res.json({ success: true, token, refreshToken, user });
  } catch (error) {
    logger.error(`Google login error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Google login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const token = generateToken(user._id);
    const newRefreshToken = generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ success: true, token, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { deviceId } = req.body;
    req.user.refreshToken = null;
    if (deviceId) {
      const device = req.user.devices.find(d => d.deviceId === deviceId);
      if (device) device.isActive = false;
    }
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
