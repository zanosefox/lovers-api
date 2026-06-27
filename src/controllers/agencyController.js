const Agency = require('../models/Agency');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { paginate } = require('../utils/helpers');

exports.createAgency = async (req, res) => {
  try {
    if (req.user.userType !== 'agent_host') {
      return res.status(403).json({ success: false, message: 'Only Agent Host can create an agency' });
    }
    const existing = await Agency.findOne({ owner: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already have an agency' });

    const { name, description } = req.body;
    const agency = await Agency.create({
      name: name || `${req.user.displayName}'s Agency`,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    res.status(201).json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create agency' });
  }
};

exports.getMyAgency = async (req, res) => {
  try {
    const agency = await Agency.findOne({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'displayName uid avatar level isVerified')
      .populate('admins', 'displayName uid avatar')
      .populate('members.user', 'displayName uid avatar level isVerified');
    res.json({ success: true, agency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get agency' });
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

exports.inviteHost = async (req, res) => {
  try {
    if (req.user.userType !== 'agent_host') {
      return res.status(403).json({ success: false, message: 'Only Agent Host can invite' });
    }
    const agency = await Agency.findById(req.params.id);
    if (!agency || agency.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your agency' });
    }

    const host = await User.findById(req.body.userId);
    if (!host || host.userType !== 'host') {
      return res.status(400).json({ success: false, message: 'User must be a Host' });
    }
    if (agency.members.some(m => m.user.toString() === host._id.toString())) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    const existing = await Invitation.findOne({ agency: agency._id, to: host._id, status: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'Invitation already sent' });

    const invitation = await Invitation.create({
      agency: agency._id,
      from: req.user._id,
      to: host._id,
    });

    res.json({ success: true, invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
};

exports.getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ to: req.user._id, status: 'pending' })
      .populate('agency', 'name')
      .populate('from', 'displayName uid avatar');
    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get invitations' });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation || invitation.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your invitation' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invitation already responded' });
    }

    const { response } = req.body;
    if (response === 'accepted') {
      const agency = await Agency.findById(invitation.agency);
      if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
      agency.members.push({ user: req.user._id, role: 'member' });
      agency.memberCount = agency.members.length;
      await agency.save();
      invitation.status = 'accepted';
    } else if (response === 'rejected') {
      invitation.status = 'rejected';
    } else {
      return res.status(400).json({ success: false, message: 'Response must be accepted or rejected' });
    }

    await invitation.save();
    res.json({ success: true, invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to respond to invitation' });
  }
};

exports.leaveAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    if (agency.owner.toString() === req.user._id.toString()) {
      agency.members = agency.members.filter(m => m.user.toString() !== req.user._id.toString());
      agency.memberCount = agency.members.length;
      agency.isActive = false;
      await agency.save();
      return res.json({ success: true, message: 'Agency closed' });
    }

    return res.status(403).json({ success: false, message: 'Only the Agent Host can remove you from the agency' });
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
