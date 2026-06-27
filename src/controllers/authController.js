const User = require('../models/User');
const { generateToken, generateRefreshToken, generateUniqueId } = require('../utils/helpers');
const logger = require('../utils/logger');
const https = require('https');

function verifyAccessToken(accessToken) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('Failed to parse token info')); }
        } else {
          reject(new Error('Invalid access token'));
        }
      });
    }).on('error', reject);
  });
}

exports.socialLogin = async (req, res) => {
  try {
    const { provider, token: socialToken, deviceInfo } = req.body;

    if (provider !== 'google') {
      return res.status(400).json({ success: false, message: 'Only Google sign-in is supported' });
    }

    let googleUser;

    try {
      const { admin } = require('../config/firebase');
      googleUser = await admin.auth().verifyIdToken(socialToken);
    } catch {
      try {
        const tokenInfo = await verifyAccessToken(socialToken);
        googleUser = {
          uid: tokenInfo.user_id,
          email: tokenInfo.email,
          name: tokenInfo.name || '',
          picture: tokenInfo.picture || '',
        };
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid Google token' });
      }
    }

    let user = await User.findOne({ googleId: googleUser.uid });
    if (!user && googleUser.email) {
      user = await User.findOne({ email: googleUser.email });
    }

    if (!user) {
      const newUid = await generateUniqueId();
      user = await User.create({
        googleId: googleUser.uid,
        email: googleUser.email,
        displayName: googleUser.name || `User${newUid}`,
        avatar: googleUser.picture || '',
        uid: newUid,
        joinMethod: 'google',
        devices: deviceInfo ? [{
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType || 'android',
          fcmToken: deviceInfo.fcmToken,
          lastLogin: new Date(),
        }] : [],
      });
    } else {
      if (!user.uid || !/^\d+$/.test(user.uid)) {
        user.uid = await generateUniqueId();
      }
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
