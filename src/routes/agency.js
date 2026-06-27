const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const agencyController = require('../controllers/agencyController');

router.get('/', protect, agencyController.getAgencies);
router.post('/', protect, agencyController.createAgency);
router.get('/my', protect, agencyController.getMyAgency);
router.get('/invitations', protect, agencyController.getInvitations);
router.get('/pending', protect, agencyController.getPendingAgencies);
router.post('/activate/:id', protect, agencyController.activateAgency);
router.post('/set-manage-permission', protect, agencyController.setManageAgenciesPermission);
router.get('/:id', protect, agencyController.getAgency);
router.post('/:id/invite', protect, agencyController.inviteHost);
router.post('/:id/leave', protect, agencyController.leaveAgency);
router.post('/:id/admins', protect, agencyController.addAdmin);
router.delete('/:id/members/:userId', protect, agencyController.removeMember);
router.post('/invitations/:id/respond', protect, agencyController.respondToInvitation);

module.exports = router;
