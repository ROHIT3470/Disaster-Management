import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Flood", "Landslide", "Weather", "System"],
      required: true,
    },

    level: {
      type: String,
      enum: ["Low", "Moderate", "High", "Critical"],
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Alert", alertSchema);
