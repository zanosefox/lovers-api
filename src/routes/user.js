const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');

router.get('/search', protect, userController.searchUsers);
router.get('/devices', protect, userController.getDevices);
router.delete('/devices/:deviceId', protect, userController.removeDevice);
router.get('/:id/followers', protect, userController.getFollowers);
router.get('/:id/following', protect, userController.getFollowing);
router.post('/:id/follow', protect, userController.followUser);
router.post('/:id/block', protect, userController.blockUser);
router.get('/profile', protect, userController.getProfile);
router.get('/:id', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/user-type', protect, userController.setUserType);
router.put('/avatar', protect, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
