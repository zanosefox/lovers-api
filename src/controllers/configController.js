const Config = require('../models/Config');
const User = require('../models/User');

exports.getConfig = async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });
    if (config) {
      return res.json({ success: true, key: config.key, value: config.value });
    }
    if (req.params.key === 'agentId') {
      const superAdmin = await User.findOne({ role: 'super_admin' }).select('_id displayName username avatar coins diamonds');
      if (superAdmin) {
        return res.json({ success: true, key: 'agentId', value: superAdmin._id.toString() });
      }
    }
    res.status(404).json({ success: false, message: 'Config not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get config' });
  }
};

exports.setConfig = async (req, res) => {
  try {
    const config = await Config.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { upsert: true, new: true }
    );
    res.json({ success: true, key: config.key, value: config.value });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set config' });
  }
};