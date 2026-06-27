const Config = require('../models/Config');

exports.getConfig = async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, key: config.key, value: config.value });
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