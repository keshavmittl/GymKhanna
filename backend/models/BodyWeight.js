import mongoose from "mongoose";

const bodyWeightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const BodyWeight = mongoose.model("BodyWeight", bodyWeightSchema);

export default BodyWeight;
