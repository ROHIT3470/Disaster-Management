export function normalizeSensorValue(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error("Sensor value must be numeric");
  }

  return numeric;
}

export function buildDashboardStats(sensors, alerts, predictions) {
  const onlineSensors = sensors.filter(
    (sensor) => sensor.status === "Online",
  ).length;

  const latest = predictions[0] || null;

  return {
    totalSensors: sensors.length,

    onlineSensors,

    activeAlerts: alerts.length,

    latestPrediction: latest,
  };
}
