const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));

export function calculateRisk({
  rainfall = 0,
  soilMoisture = 0,
  slopeStability = 100,
  historicalRisk = 0,
}) {
  const rain = clamp(rainfall, 0, 150);

  const moisture = clamp(soilMoisture);

  const stability = clamp(slopeStability);

  const history = clamp(historicalRisk);

  const rainRisk = clamp((rain / 150) * 100);

  const floodRisk = Math.round(
    0.55 * rainRisk + 0.25 * moisture + 0.2 * history,
  );

  const instability = 100 - stability;

  const landslideRisk = Math.round(
    0.4 * rainRisk + 0.35 * instability + 0.15 * moisture + 0.1 * history,
  );

  const overallRisk = Math.round(0.5 * floodRisk + 0.5 * landslideRisk);

  let riskLevel = "Low";

  if (overallRisk >= 75) {
    riskLevel = "Critical";
  } else if (overallRisk >= 55) {
    riskLevel = "High";
  } else if (overallRisk >= 30) {
    riskLevel = "Moderate";
  }

  let leadTime = "24+ hours";

  if (overallRisk >= 75) {
    leadTime = "0–2 hours";
  } else if (overallRisk >= 55) {
    leadTime = "2–6 hours";
  } else if (overallRisk >= 30) {
    leadTime = "6–24 hours";
  }

  return {
    rainfall: rain,
    soilMoisture: moisture,
    slopeStability: stability,
    historicalRisk: history,
    floodRisk,
    landslideRisk,
    overallRisk,
    riskLevel,
    leadTime,
  };
}
