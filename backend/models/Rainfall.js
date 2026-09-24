import mongoose from "mongoose";

const rainfallSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: "mm",
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Rainfall", rainfallSchema);
