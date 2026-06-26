const Task = require('../models/Task');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true }).sort({ order: 1 });
    const progressMap = {};

    tasks.forEach(task => {
      const userProgress = task.userProgress.find(
        up => up.user.toString() === req.user._id.toString()
      );
      progressMap[task._id.toString()] = userProgress
        ? { progress: userProgress.progress, isCompleted: userProgress.isCompleted }
        : { progress: 0, isCompleted: false };
    });

    const tasksData = tasks.map(t => {
      const tObj = t.toObject();
      delete tObj.userProgress;
      return { ...tObj, progress: progressMap[t._id.toString()] };
    });

    res.json({ success: true, data: tasksData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get tasks' });
  }
};

exports.updateTaskProgress = async (req, res) => {
  try {
    const { taskId, increment = 1 } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    let userProgress = task.userProgress.find(
      up => up.user.toString() === req.user._id.toString()
    );

    if (!userProgress) {
      task.userProgress.push({ user: req.user._id, progress: 0, isCompleted: false, lastReset: new Date() });
      userProgress = task.userProgress[task.userProgress.length - 1];
    }

    if (userProgress.isCompleted) {
      return res.json({ success: true, message: 'Task already completed', completed: true });
    }

    userProgress.progress = Math.min(task.target, userProgress.progress + increment);

    if (userProgress.progress >= task.target) {
      userProgress.isCompleted = true;
      userProgress.completedAt = new Date();

      const user = await User.findById(req.user._id);
      if (task.rewardType === 'xp') {
        user.xp += task.reward;
        user.level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
      } else if (task.rewardType === 'diamond') {
        user.diamonds += task.reward;
      } else if (task.rewardType === 'coin') {
        user.coins += task.reward;
      }
      await user.save();
    }

    await task.save();
    res.json({
      success: true,
      progress: userProgress.progress,
      target: task.target,
      isCompleted: userProgress.isCompleted,
      reward: userProgress.isCompleted ? { type: task.rewardType, amount: task.reward } : null,
    });
  } catch (error) {
    logger.error(`Task progress error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update task progress' });
  }
};

exports.claimDailyReward = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    const lastLogin = user.lastDailyLogin;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (lastLogin) {
      const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      const diff = Math.floor((today - lastLoginDay) / (1000 * 60 * 60 * 24));

      if (diff === 0) {
        return res.status(400).json({ success: false, message: 'Daily reward already claimed today' });
      } else if (diff === 1) {
        user.dailyLoginStreak += 1;
      } else {
        user.dailyLoginStreak = 1;
      }
    } else {
      user.dailyLoginStreak = 1;
    }

    user.lastDailyLogin = now;
    user.totalLoginDays += 1;

    const streakBonus = Math.min(user.dailyLoginStreak, 30);
    const reward = 10 + streakBonus * 5;
    user.diamonds += reward;
    user.xp += 50;
    user.level = Math.floor(Math.sqrt(user.xp / 100)) + 1;

    await user.save();

    res.json({
      success: true,
      reward,
      streak: user.dailyLoginStreak,
      totalLoginDays: user.totalLoginDays,
      diamonds: user.diamonds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to claim daily reward' });
  }
};
