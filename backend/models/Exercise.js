import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: [
        'Chest',
        'Back',
        'Legs',
        'Shoulders',
        'Arms',
        'Core',
      ],
    },
    equipment: {
      type: String,
      required: true,
      enum: [
        'Barbell',
        'Dumbbell',
        'Machine',
        'Bodyweight',
        'Cable',
      ],
    },
    youtubeUrl: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;