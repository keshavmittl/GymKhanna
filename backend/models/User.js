import mongoose from "mongoose";
const userschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    goalWeight: {
      type: Number,
      default: null,
    },
    waterGoal: {
      type: Number,
      default: 4000,
    },
    weeklyGoal: {
      type: Number,
      default: 4,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastStreakWeek: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);
const User = mongoose.model("User", userschema);
export default User;
