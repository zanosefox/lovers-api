const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('diamonds coins');
    res.json({ success: true, diamonds: user.diamonds, coins: user.coins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = { user: req.user._id };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('targetUser', 'displayName uid avatar').populate('gift', 'name image'),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, data: transactions, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get transactions' });
  }
};

exports.recharge = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const diamonds = amount;
    const user = await User.findById(req.user._id);

    user.diamonds += diamonds;
    user.totalRecharged += amount;
    user.rechargeLevel = Math.floor(user.totalRecharged / 1000) + 1;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'recharge',
      amount,
      currency: 'diamond',
      paymentMethod,
      status: 'completed',
      balanceBefore: user.diamonds - diamonds,
      balanceAfter: user.diamonds,
    });

    res.json({ success: true, diamonds: user.diamonds, coins: user.coins });
  } catch (error) {
    logger.error(`Recharge error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Recharge failed' });
  }
};

exports.transferDiamonds = async (req, res) => {
  try {
    const { targetUserId, amount } = req.body;
    if (amount < 1) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const sender = await User.findById(req.user._id);
    if (sender.diamonds < amount) return res.status(400).json({ success: false, message: 'Insufficient diamonds' });

    const receiver = await User.findById(targetUserId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    sender.diamonds -= amount;
    receiver.diamonds += Math.floor(amount * 0.95);

    await Promise.all([sender.save(), receiver.save()]);

    await Transaction.create({ user: sender._id, type: 'transfer', amount, currency: 'diamond', targetUser: targetUserId, description: 'Diamond transfer' });

    res.json({ success: true, diamonds: sender.diamonds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Transfer failed' });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount, paymentDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (user.diamonds < amount) return res.status(400).json({ success: false, message: 'Insufficient diamonds' });

    user.diamonds -= amount;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount,
      currency: 'diamond',
      status: 'pending',
      description: `Withdrawal request - ${paymentDetails}`,
    });

    res.json({ success: true, message: 'Withdrawal request submitted', diamonds: user.diamonds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Withdrawal failed' });
  }
};
