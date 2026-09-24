import Sensor from "../models/Sensor.js";
import { normalizeSensorValue } from "../services/dataProcessing.js";

export async function getSensors(req, res) {
  const sensors = await Sensor.find().sort({ updatedAt: -1 }).lean();

  res.json(sensors);
}

export async function createSensor(req, res) {
  const sensor = await Sensor.create({
    ...req.body,
    value: normalizeSensorValue(req.body.value),
    lastSeen: new Date(),
  });

  res.status(201).json(sensor);
}

export async function updateSensor(req, res) {
  const updates = {
    ...req.body,
  };

  if (req.body.value !== undefined) {
    updates.value = normalizeSensorValue(req.body.value);
    updates.lastSeen = new Date();
  }

  const sensor = await Sensor.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!sensor) {
    return res.status(404).json({
      message: "Sensor not found",
    });
  }

  res.json(sensor);
}

export async function deleteSensor(req, res) {
  const sensor = await Sensor.findByIdAndDelete(req.params.id);

  if (!sensor) {
    return res.status(404).json({
      message: "Sensor not found",
    });
  }

  res.json({
    success: true,
    message: "Sensor deleted successfully",
  });
}
