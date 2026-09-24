import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Alert from "../models/Alert.js";
import Location from "../models/Location.js";
import Prediction from "../models/Prediction.js";
import Sensor from "../models/Sensor.js";

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(BACKEND_DIR, "..", "..", "my_project");

const DATASETS = [
  "india_flash_flood_5000.csv",
  "Assam river water level Forecast_2026_2030.csv",
  "GPM_3IMERGDF_07_regional.csv",
  "Forecast Rainfall Data.csv",
];

const PYTHON_TOOLS = [
  {
    name: "Emergency terminal assistant",
    file: "chat_terminal.py",
    purpose: "Offline Gemini emergency conversation with image safety analysis.",
  },
  {
    name: "NASA GPM downloader",
    file: "download_files_GPM_3IMERGDF_07.py",
    purpose: "Authenticated NASA Earthdata granule discovery and download.",
  },
];

function describeFile(fileName) {
  const filePath = path.join(PROJECT_DIR, fileName);

  try {
    const stats = fs.statSync(filePath);
    return {
      name: fileName,
      available: true,
      sizeBytes: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      name: fileName,
      available: false,
      sizeBytes: 0,
      modifiedAt: null,
    };
  }
}

export function getProjectContext() {
  const datasets = DATASETS.map(describeFile);
  const model = describeFile("flash_flood_model.pkl");
  const tools = PYTHON_TOOLS.map((tool) => ({
    ...tool,
    ...describeFile(tool.file),
  }));

  return {
    source: "my_project",
    projectDirectory: "my_project",
    model: {
      ...model,
      name: "flash_flood_model.pkl",
    },
    datasets,
    availableDatasetCount: datasets.filter((item) => item.available).length,
    totalDatasetCount: datasets.length,
    pythonTools: tools,
    availablePythonToolCount: tools.filter((item) => item.available).length,
    totalPythonToolCount: tools.length,
    environment: {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      mongoConfigured: Boolean(process.env.MONGO_URI),
      nasaEarthdataConfigured: Boolean(
        process.env.EARTHDATA_USERNAME && process.env.EARTHDATA_PASSWORD,
      ),
    },
    assistantArchitecture: "Planner -> Safety Auditor -> Writer -> Reviewer",
    note: "Files and environment flags describe integration readiness only; live conditions come from connected telemetry.",
  };
}

export function getProjectContextPrompt() {
  const context = getProjectContext();
  const available = context.datasets
    .filter((dataset) => dataset.available)
    .map((dataset) => dataset.name)
    .join(", ");

  return `PROJECT AI CONTEXT:
- Source folder: my_project
- Flash-flood model available: ${context.model.available ? "yes" : "no"}
- Available project datasets: ${available || "none detected"}
- Python tools available: ${context.availablePythonToolCount}/${context.totalPythonToolCount}
- Use these files as grounded project sources, but never claim their historical or forecast values are live telemetry.
- The emergency assistant follows a Planner -> Safety Auditor -> Writer -> Reviewer safety pipeline.`;
}

export async function getLiveProjectContext() {
  const [alerts, predictions, sensors, locations] = await Promise.all([
    Alert.find({ active: true })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("type level location message active expiresAt updatedAt")
      .lean(),
    Prediction.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select(
        "location rainfall soilMoisture slopeStability historicalRisk floodRisk landslideRisk overallRisk riskLevel leadTime modelVersion updatedAt",
      )
      .lean(),
    Sensor.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("location type value unit status lastSeen updatedAt")
      .lean(),
    Location.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("name district state riskLevel updatedAt")
      .lean(),
  ]);

  return {
    ...getProjectContext(),
    liveData: {
      alerts,
      predictions,
      sensors,
      locations,
    },
  };
}

export function formatLiveContextPrompt(context) {
  const liveData = context?.liveData;
  if (!liveData) {
    return "\n\nCURRENT GEONEXUS CONTEXT:\nNo live GeoNexus context is available. Do not infer current conditions.";
  }

  return `\n\nCURRENT GEONEXUS CONTEXT (authoritative project records; may be empty):
${JSON.stringify(liveData)}

Use current records only when they directly answer the user's question. Do not infer missing values, turn historical records into live conditions, or expose internal identifiers. If the required record is absent, say that it is unavailable in the current GeoNexus context.`;
}
