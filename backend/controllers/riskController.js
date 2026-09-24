import Prediction from "../models/Prediction.js";
import { createPrediction } from "../services/riskPrediction.js";

export async function predictRisk(req, res) {
  const prediction = await createPrediction(req.body);

  res.status(201).json(prediction);
}

export async function getPredictions(req, res) {
  const predictions = await Prediction.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json(predictions);
}
