const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.createPost = async (req, res) => {
  try {
    const { content, media, hashtags, visibility } = req.body;
    const tags = hashtags ? hashtags.match(/#\w+/g)?.map(t => t.toLowerCase()) : [];

    const post = await Post.create({
      user: req.user._id,
      content,
      media: media || [],
      hashtags: tags || [],
      visibility: visibility || 'public',
    });

    await post.populate('user', 'displayName uid avatar level isVerified');
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page, limit, hashtag } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const query = { isDeleted: false };

    if (hashtag) query.hashtags = hashtag.toLowerCase();
    if (req.query.userId) query.user = req.query.userId;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('user', 'displayName uid avatar level isVerified')
        .sort({ createdAt: -1 }).skip(skip).limit(lim),
      Post.countDocuments(query),
    ]);

    res.json({ success: true, data: posts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get posts' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'displayName uid avatar level isVerified');
    if (!post || post.isDeleted) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    post.isDeleted = true;
    await post.save();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes.pull(req.user._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(req.user._id);
      post.likesCount += 1;
    }

    await post.save();
    res.json({ success: true, isLiked: !isLiked, likesCount: post.likesCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      content: req.body.content,
      replyTo: req.body.replyTo,
    });

    post.commentsCount += 1;
    await post.save();

    await comment.populate('user', 'displayName uid avatar level isVerified');
    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const [comments, total] = await Promise.all([
      Comment.find({ post: req.params.id, isDeleted: false })
        .populate('user', 'displayName uid avatar level isVerified')
        .sort({ createdAt: -1 }).skip(skip).limit(lim),
      Comment.countDocuments({ post: req.params.id, isDeleted: false }),
    ]);

    res.json({ success: true, data: comments, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get comments' });
  }
};

exports.getTrendingPosts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const posts = await Post.find({ isDeleted: false, visibility: 'public' })
      .populate('user', 'displayName uid avatar level isVerified')
      .sort({ likesCount: -1, commentsCount: -1 })
      .skip(skip).limit(lim);

    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get trending posts' });
  }
};
