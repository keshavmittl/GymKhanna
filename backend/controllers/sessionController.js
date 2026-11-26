import Session from '../models/Session.js';
import { findPRsForSession ,getAllTimePRs} from '../services/prEngine.js';
import User from '../models/User.js';
import { updateStreak } from '../services/streakEngine.js';
import Exercise from '../models/Exercise.js';
import { sessionCache } from '../services/sessionCache.js';

const calculateTotalVolume = (exercises) => {
  let total = 0;
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (set.completed !== false) total += set.reps * set.weight;
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

    const session = new Session({
      userId: req.user._id,
      name,
      date: date || Date.now(),
      exercises,
    });
    await session.validate();

    const pastSessions = await Session.find({ userId: req.user._id });
    session.totalVolume = calculateTotalVolume(session.exercises);
    session.prs = findPRsForSession(session.exercises, pastSessions);
    await session.save();

    await sessionCache.invalidate(req.user._id);

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
    const sessions = await Session.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1, _id: -1 });

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

    await sessionCache.invalidate(req.user._id);
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
    const data = await sessionCache.read(req.user._id, 'prs', async () => {
      const [sessions, bodyweightExercises] = await Promise.all([
        Session.find({ userId: req.user._id }).select('exercises date'),
        Exercise.find({ equipment: 'Bodyweight' }).select('_id').lean(),
      ]);
      const bodyweightIds = new Set(bodyweightExercises.map((ex) => ex._id.toString()));
      const prs = getAllTimePRs(sessions).filter((pr) => !bodyweightIds.has(pr.exerciseId.toString()));
      return { prs };
    });

    res.status(200).json({
      success: true,
      data,
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
    const data = await sessionCache.read(req.user._id, 'stats', async () => {
      const sessions = await Session.find({ userId: req.user._id })
        .sort({ date: -1, createdAt: -1, _id: -1 });

      return {
        totalSessions: sessions.length,
        totalVolume: sessions.reduce((sum, session) => sum + session.totalVolume, 0),
        totalPRs: sessions.reduce((sum, session) => sum + session.prs.length, 0),
        recentSessions: sessions.slice(0, 5),
      };
    });

    res.status(200).json({
      success: true,
      data,
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

export const getLastSets = async (req, res) => {
  try {
    const exercises = await Session.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { date: -1, createdAt: -1, _id: -1 } },
      { $unwind: '$exercises' },
      {
        $project: {
          exerciseId: '$exercises.exerciseId',
          sets: {
            $filter: {
              input: { $ifNull: ['$exercises.sets', []] },
              as: 'set',
              cond: {
                $and: [
                  { $ne: ['$$set.completed', false] },
                  { $isNumber: '$$set.weight' },
                  { $gte: ['$$set.weight', 0] },
                  { $isNumber: '$$set.reps' },
                  { $gt: ['$$set.reps', 0] },
                ],
              },
            },
          },
        },
      },
      { $match: { exerciseId: { $type: 'objectId' }, 'sets.0': { $exists: true } } },
      { $group: { _id: '$exerciseId', sets: { $first: '$sets' } } },
    ]);

    const lastSets = Object.fromEntries(exercises.map(({ _id, sets }) => [
      _id.toString(),
      sets.map(({ weight, reps }) => ({ weight, reps })),
    ]));

    res.status(200).json({ success: true, data: { lastSets }, message: '' });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Could not load previous sets' });
  }
};
