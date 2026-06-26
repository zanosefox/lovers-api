const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.get('/', protect, taskController.getTasks);
router.post('/progress', protect, taskController.updateTaskProgress);
router.post('/daily-reward', protect, taskController.claimDailyReward);

module.exports = router;
