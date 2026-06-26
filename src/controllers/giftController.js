const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getGifts = async (req, res) => {
  try {
    const { type, category, page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = { isActive: true };
    if (type) query.type = type;
    if (category) query.category = category;

    const [gifts, total] = await Promise.all([
      Gift.find(query).sort({ order: 1 }).skip(skip).limit(lim),
      Gift.countDocuments(query),
    ]);

    res.json({ success: true, data: gifts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get gifts' });
  }
};

exports.sendGift = async (req, res) => {
  try {
    const { giftId, targetUserId, quantity = 1 } = req.body;
    const gift = await Gift.findById(giftId);
    if (!gift) return res.status(404).json({ success: false, message: 'Gift not found' });

    const totalCost = gift.diamonds * quantity;
    const sender = await User.findById(req.user._id);
    if (sender.diamonds < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient diamonds' });
    }

    sender.diamonds -= totalCost;
    sender.giftsSent += quantity;
    sender.totalGiftsValue += totalCost;

    if (targetUserId) {
      const receiver = await User.findById(targetUserId);
      if (receiver) {
        receiver.diamonds += Math.floor(totalCost * 0.9);
        receiver.giftsReceived += quantity;
        await receiver.save();
      }
    }

    await sender.save();

    await Transaction.create({
      user: req.user._id,
      type: 'gift_sent',
      amount: totalCost,
      currency: 'diamond',
      targetUser: targetUserId,
      gift: giftId,
      description: `Sent ${gift.name} x${quantity}`,
    });

    res.json({
      success: true,
      message: 'Gift sent successfully',
      gift: { _id: gift._id, name: gift.name, image: gift.image, type: gift.type },
      effects: gift.effects,
    });
  } catch (error) {
    logger.error(`Send gift error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to send gift' });
  }
};
