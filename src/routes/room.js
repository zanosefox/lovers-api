const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roomController = require('../controllers/roomController');

router.get('/', protect, roomController.getRooms);
router.post('/', protect, roomController.createRoom);
router.get('/:id', protect, roomController.getRoom);
router.put('/:id', protect, roomController.updateRoom);
router.delete('/:id', protect, roomController.deleteRoom);
router.post('/:id/moderators', protect, roomController.addModerator);
router.delete('/:id/moderators/:userId', protect, roomController.removeModerator);
router.post('/:id/co-owners', protect, roomController.addCoOwner);
router.get('/:id/logs', protect, roomController.getAdminLogs);
router.post('/:id/announcements', protect, roomController.addAnnouncement);

module.exports = router;
