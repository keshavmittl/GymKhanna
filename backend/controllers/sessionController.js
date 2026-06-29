import Session from '../models/Session.js';
import { findPRsForSession ,getAllTimePRs} from '../services/prEngine.js';
import User from '../models/User.js';
import { updateStreak } from '../services/streakEngine.js';
import Exercise from '../models/Exercise.js';
const calculateTotalVolume = (exercises) => {
  let total = 0;
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      total += set.reps * set.weight;
    }
  }
  return total;
};

export const createSession = async (req, res) => {
  try {
    const { name, date, exercises } = req.body;

    if (!name || !exercises || exercises.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Session name and at least one exercise are required',
      });
    }

    const totalVolume = calculateTotalVolume(exercises);

    const pastSessions = await Session.find({ userId: req.user._id });
    const prs = findPRsForSession(exercises, pastSessions);

    const session = await Session.create({
      userId: req.user._id,
      name,
      date: date || Date.now(),
      exercises,
      totalVolume,
      prs,
    });

    const allSessionsIncludingNew = [...pastSessions, session];
    const streakUpdate = updateStreak(req.user, allSessionsIncludingNew);

    await User.findByIdAndUpdate(req.user._id, {
      currentStreak: streakUpdate.currentStreak,
      lastStreakWeek: streakUpdate.lastStreakWeek,
    });

    res.status(201).json({
      success: true,
      data: { session, streak: streakUpdate.currentStreak },
      message: 'Session created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: { sessions },
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

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: null,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const getPRs = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id });
    const bodyweightExercises = await Exercise.find({ equipment: 'Bodyweight' }).select('_id');
    const bodyweightIds = bodyweightExercises.map((ex) => ex._id.toString());

    const allPRs = getAllTimePRs(sessions);
    const prs = allPRs.filter((pr) => !bodyweightIds.includes(pr.exerciseId.toString()));

    res.status(200).json({
      success: true,
      data: { prs },
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

export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { session },
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

export const getDashboardStats = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ date: -1 });

    const totalSessions = sessions.length;
    const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
    const totalPRs = sessions.reduce((sum, s) => sum + s.prs.length, 0);
    const recentSessions = sessions.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalVolume,
        totalPRs,
        recentSessions,
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