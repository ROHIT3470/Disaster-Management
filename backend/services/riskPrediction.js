import Prediction from "../models/Prediction.js";
import { calculateRisk } from "../utils/riskCalculator.js";

export async function createPrediction(input) {
  if (!input.location) {
    throw new Error("Location is required");
  }

  const result = calculateRisk(input);

  return Prediction.create({
    ...result,
    location: input.location,
    modelVersion: "rule-engine-v1",
  });
}
