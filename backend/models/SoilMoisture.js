import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    location: String,

    value: Number,

    unit: {
      type: String,
      default: "%",
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

export default mongoose.model("SoilMoisture", schema);
