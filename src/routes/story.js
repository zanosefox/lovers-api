const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const storyController = require('../controllers/storyController');

router.get('/', protect, storyController.getStories);
router.post('/', protect, storyController.createStory);
router.post('/:id/view', protect, storyController.viewStory);
router.delete('/:id', protect, storyController.deleteStory);

module.exports = router;
