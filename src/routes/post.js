const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const postController = require('../controllers/postController');

router.get('/', protect, postController.getPosts);
router.get('/trending', protect, postController.getTrendingPosts);
router.post('/', protect, postController.createPost);
router.get('/:id', protect, postController.getPost);
router.delete('/:id', protect, postController.deletePost);
router.post('/:id/like', protect, postController.toggleLike);
router.post('/:id/comments', protect, postController.addComment);
router.get('/:id/comments', protect, postController.getComments);

module.exports = router;
