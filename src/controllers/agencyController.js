const Agency = require('../models/Agency');
const User = require('../models/User');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.createAgency = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await Agency.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Agency name already exists' });

    const agency = await Agency.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    res.status(201).json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create agency' });
  }
};

exports.getAgencies = async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    let sortObj = { rank: 1 };
    if (sort === 'earnings') sortObj = { totalEarnings: -1 };
    if (sort === 'members') sortObj = { memberCount: -1 };

    const [agencies, total] = await Promise.all([
      Agency.find({ isActive: true })
        .populate('owner', 'displayName uid avatar')
        .sort(sortObj).skip(skip).limit(lim),
      Agency.countDocuments({ isActive: true }),
    ]);

    res.json({ success: true, data: agencies, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get agencies' });
  }
};

exports.getAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id)
      .populate('owner', 'displayName uid avatar level isVerified')
      .populate('admins', 'displayName uid avatar')
      .populate('members.user', 'displayName uid avatar level isVerified');
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    res.json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get agency' });
  }
};

exports.joinAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    if (agency.members.some(m => m.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    agency.members.push({ user: req.user._id, role: 'member' });
    agency.memberCount = agency.members.length;
    await agency.save();

    res.json({ success: true, message: 'Joined agency', agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to join agency' });
  }
};

exports.leaveAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    if (agency.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership first.' });
    }

    agency.members = agency.members.filter(m => m.user.toString() !== req.user._id.toString());
    agency.memberCount = agency.members.length;
    await agency.save();

    res.json({ success: true, message: 'Left agency' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to leave agency' });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency || agency.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = agency.members.find(m => m.user.toString() === req.body.userId);
    if (member) member.role = 'admin';
    if (!agency.admins.includes(req.body.userId)) {
      agency.admins.push(req.body.userId);
    }
    await agency.save();
    res.json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add admin' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency || (agency.owner.toString() !== req.user._id.toString() && !agency.admins.includes(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    agency.members = agency.members.filter(m => m.user.toString() !== req.params.userId);
    agency.admins = agency.admins.filter(a => a.toString() !== req.params.userId);
    agency.memberCount = agency.members.length;
    await agency.save();
    res.json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};
