const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Counter = require('../models/Counter');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateRefreshToken = () => {
  return uuidv4();
};

const generateUniqueId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'userId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString();
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateUniqueId,
  generateOTP,
  paginate,
  calculateLevel,
};
