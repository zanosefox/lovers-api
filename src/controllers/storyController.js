const Story = require('../models/Story');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.createStory = async (req, res) => {
  try {
    const { media, mediaType, duration } = req.body;
    const story = await Story.create({
      user: req.user._id,
      media,
      mediaType,
      duration: duration || 24,
      expiresAt: new Date(Date.now() + (duration || 24) * 60 * 60 * 1000),
    });

    await story.populate('user', 'displayName uid avatar level isVerified');
    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create story' });
  }
};

exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'displayName uid avatar level isVerified')
      .sort({ createdAt: -1 });

    const grouped = stories.reduce((acc, story) => {
      const uid = story.user._id.toString();
      if (!acc[uid]) acc[uid] = { user: story.user, stories: [] };
      acc[uid].stories.push(story);
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stories' });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user._id.toString());
    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id });
      story.viewerCount = story.viewers.length;
      await story.save();
    }

    res.json({ success: true, viewed: !alreadyViewed });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to view story' });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    story.isDeleted = true;
    await story.save();
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete story' });
  }
};
