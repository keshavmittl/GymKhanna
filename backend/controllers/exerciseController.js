import Exercise from '../models/Exercise.js';

export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({
      $or: [{ isDefault: true }, { userId: req.user._id }],
    }).sort({ muscleGroup: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: { exercises },
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

export const createExercise = async (req, res) => {
  try {
    const { name, muscleGroup, equipment, youtubeUrl } = req.body;

    if (!name || !muscleGroup || !equipment) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Name, muscle group and equipment are required',
      });
    }

    const exercise = await Exercise.create({
      name,
      muscleGroup,
      equipment,
      youtubeUrl: youtubeUrl || '',
      isDefault: false,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: { exercise },
      message: 'Exercise added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};