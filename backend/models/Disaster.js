import mongoose from "mongoose";

const disasterSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Flood",
        "Flash Flood",
        "Landslide",
        "Cloudburst",
        "Rockfall",
        "Other",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["Low", "Moderate", "High", "Critical"],
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Disaster", disasterSchema);
