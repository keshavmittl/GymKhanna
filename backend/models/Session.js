import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
    min: 0,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: true,
  },
});

const sessionExerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sets: [setSchema],
});

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exercises: [sessionExerciseSchema],
    totalVolume: {
      type: Number,
      default: 0,
    },
    prs: [
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    name: String,
    newWeight: Number,
    previousBest: Number,
  },
],
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;