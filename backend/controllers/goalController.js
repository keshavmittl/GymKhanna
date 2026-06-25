import User from '../models/User.js';
import Session from '../models/Session.js';
import { getWeekIdentifier, getSessionsCountThisWeek } from '../services/streakEngine.js';

export const getGoalStatus = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id });
    const currentWeek = getWeekIdentifier(new Date());
    const sessionsThisWeek = getSessionsCountThisWeek(sessions, currentWeek);

    res.status(200).json({
      success: true,
      data: {
        weeklyGoal: req.user.weeklyGoal,
        sessionsThisWeek,
        currentStreak: req.user.currentStreak,
      },
      message: '',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const setWeeklyGoal = async (req, res) => {
  try {
    const { weeklyGoal } = req.body;

    if (!weeklyGoal || weeklyGoal < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Weekly goal must be at least 1',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { weeklyGoal },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user },
      message: 'Weekly goal updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};