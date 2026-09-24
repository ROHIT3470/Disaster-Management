import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },

    rainfall: Number,

    soilMoisture: Number,

    slopeStability: Number,

    historicalRisk: Number,

    floodRisk: Number,

    landslideRisk: Number,

    overallRisk: Number,

    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High", "Critical"],
    },

    leadTime: String,

    modelVersion: {
      type: String,
      default: "rule-engine-v1",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Prediction", predictionSchema);
