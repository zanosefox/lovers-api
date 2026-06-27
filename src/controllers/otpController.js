const Otp = require('../models/Otp');
const User = require('../models/User');
const { generateOTP } = require('../utils/helpers');

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const code = generateOTP();
    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[OTP] ${phone}: ${code}`);

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone and code are required' });
    }

    const otp = await Otp.findOne({ phone, code, verified: false, expiresAt: { $gt: new Date() } });
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    otp.verified = true;
    await otp.save();

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

exports.registerWithPhone = async (req, res) => {
  try {
    const { phone, code, username, userType, deviceInfo } = req.body;

    if (!phone || !code || !userType) {
      return res.status(400).json({ success: false, message: 'Phone, code, and userType are required' });
    }
    if (!['host', 'supporter'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'userType must be host or supporter' });
    }

    const otp = await Otp.findOne({ phone, code, verified: true });
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please verify OTP first' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const { generateUniqueId, generateToken, generateRefreshToken } = require('../utils/helpers');
    const user = await User.create({
      phone,
      username: username || `User${generateUniqueId()}`,
      displayName: username || `User${generateUniqueId()}`,
      uid: generateUniqueId(),
      joinMethod: 'phone',
      userType,
      devices: deviceInfo ? [{
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType || 'android',
        fcmToken: deviceInfo.fcmToken,
        lastLogin: new Date(),
      }] : [],
    });

    await Otp.deleteMany({ phone });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ success: true, token, refreshToken, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};
