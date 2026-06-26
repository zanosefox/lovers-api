const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const agencyController = require('../controllers/agencyController');

router.get('/', protect, agencyController.getAgencies);
router.post('/', protect, agencyController.createAgency);
router.get('/:id', protect, agencyController.getAgency);
router.post('/:id/join', protect, agencyController.joinAgency);
router.post('/:id/leave', protect, agencyController.leaveAgency);
router.post('/:id/admins', protect, agencyController.addAdmin);
router.delete('/:id/members/:userId', protect, agencyController.removeMember);

module.exports = router;
