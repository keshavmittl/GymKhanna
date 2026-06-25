import WaterLog from '../models/WaterLog.js';

const getStartOfDay = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

export const logWater = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Amount is required',
      });
    }

    const entry = await WaterLog.create({
      userId: req.user._id,
      amount,
    });

    res.status(201).json({
      success: true,
      data: { entry },
      message: 'Water logged successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const getTodayWater = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();

    const entries = await WaterLog.find({
      userId: req.user._id,
      date: { $gte: startOfDay },
    }).sort({ date: 1 });

    const totalToday = entries.reduce((sum, entry) => sum + entry.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        entries,
        totalToday,
        goal: req.user.waterGoal,
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