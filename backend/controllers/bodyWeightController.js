import BodyWeight from '../models/BodyWeight.js';
import User from '../models/User.js';

const calculateGoalProgress = (startWeight, currentWeight, goalWeight) => {
  if (goalWeight === null || goalWeight === undefined) return null;
  if (startWeight === goalWeight) return 100;

  const totalChangeNeeded = startWeight - goalWeight;
  const changeSoFar = startWeight - currentWeight;

  let percentage = (changeSoFar / totalChangeNeeded) * 100;
  percentage = Math.max(0, Math.min(100, percentage));

  return Math.round(percentage);
};

export const logWeight = async (req, res) => {
  try {
    const { weight, date } = req.body;

    if (!weight) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Weight is required',
      });
    }

    const entry = await BodyWeight.create({
      userId: req.user._id,
      weight,
      date: date || Date.now(),
    });

    res.status(201).json({
      success: true,
      data: { entry },
      message: 'Weight logged successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const getWeightHistory = async (req, res) => {
  try {
    const entries = await BodyWeight.find({ userId: req.user._id }).sort({ date: 1 });

    let progress = null;
    if (entries.length > 0 && req.user.goalWeight) {
      const startWeight = entries[0].weight;
      const currentWeight = entries[entries.length - 1].weight;
      progress = calculateGoalProgress(startWeight, currentWeight, req.user.goalWeight);
    }

    res.status(200).json({
      success: true,
      data: {
        entries,
        goalWeight: req.user.goalWeight,
        progress,
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

export const setGoalWeight = async (req, res) => {
  try {
    const { goalWeight } = req.body;

    if (goalWeight === undefined || goalWeight === null) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Goal weight is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { goalWeight },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user },
      message: 'Goal weight updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};