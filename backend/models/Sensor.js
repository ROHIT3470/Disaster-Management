import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Rainfall",
        "Soil Moisture",
        "Slope",
        "Temperature",
        "Water Level",
      ],
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Online", "Offline", "Warning"],
      default: "Online",
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Sensor", sensorSchema);
