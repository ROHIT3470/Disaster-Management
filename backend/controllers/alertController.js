import Alert from "../models/Alert.js";
import { getActiveAlerts } from "../services/alertService.js";

export async function getAlerts(req, res) {
  const alerts = await getActiveAlerts();
  res.json(alerts);
}

export async function createAlert(req, res) {
  const alert = await Alert.create(req.body);
  res.status(201).json(alert);
}

export async function updateAlert(req, res) {
  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!alert) {
    return res.status(404).json({
      message: "Alert not found",
    });
  }

  res.json(alert);
}

export async function deleteAlert(req, res) {
  const alert = await Alert.findByIdAndDelete(req.params.id);

  if (!alert) {
    return res.status(404).json({
      message: "Alert not found",
    });
  }

  res.json({
    success: true,
    message: "Alert deleted successfully",
  });
}
