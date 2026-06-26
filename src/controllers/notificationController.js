const Notification = require('../models/Notification');
const { paginate } = require('../utils/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { page, limit, type } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = { user: req.user._id };
    if (type) query.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, data: notifications, total, unreadCount, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds, all } = req.body;
    const query = { user: req.user._id };
    if (all) {
      await Notification.updateMany(query, { isRead: true, readAt: new Date() });
    } else if (notificationIds?.length) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, user: req.user._id },
        { isRead: true, readAt: new Date() }
      );
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};
