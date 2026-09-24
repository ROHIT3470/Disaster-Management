import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Sensor from "../models/Sensor.js";
import Alert from "../models/Alert.js";
import Disaster from "../models/Disaster.js";
import Location from "../models/Location.js";
import Prediction from "../models/Prediction.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/disaster_management";

export async function seedDatabase() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Sensor.deleteMany({}),
    Alert.deleteMany({}),
    Disaster.deleteMany({}),
    Location.deleteMany({}),
    Prediction.deleteMany({}),
  ]);
  console.log("Cleared old records.");

  // 1. Seed Users
  const users = await User.create([
    {
      name: "Admin Officer",
      email: "admin@disaster.org",
      password: "admin123",
      role: "admin",
      active: true,
    },
    {
      name: "Emergency Operator",
      email: "user@disaster.org",
      password: "user123",
      role: "user",
      active: true,
    },
  ]);
  console.log(`Seeded ${users.length} users (Admin: admin@disaster.org / admin123 | User: user@disaster.org / user123)`);

  // 2. Seed Sensors
  const sensors = await Sensor.create([
    {
      sensorId: "SN-RF-101",
      location: "Dehradun Valley Station",
      type: "Rainfall",
      value: 85,
      unit: "mm",
      status: "Warning",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-SM-102",
      location: "Chamoli Hill Slope",
      type: "Soil Moisture",
      value: 78,
      unit: "%",
      status: "Warning",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-SS-103",
      location: "Joshimath Sector 4",
      type: "Slope",
      value: 35,
      unit: "%",
      status: "Warning",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-WL-104",
      location: "Alaknanda River Gauge",
      type: "Water Level",
      value: 4.2,
      unit: "m",
      status: "Warning",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-RF-105",
      location: "Shimla Ridge Station",
      type: "Rainfall",
      value: 45,
      unit: "mm",
      status: "Online",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-SM-106",
      location: "Dharamshala Pass",
      type: "Soil Moisture",
      value: 62,
      unit: "%",
      status: "Online",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-SS-107",
      location: "Nainital Lake Basin",
      type: "Slope",
      value: 72,
      unit: "%",
      status: "Online",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-TP-108",
      location: "Uttarkashi High Station",
      type: "Temperature",
      value: 18,
      unit: "°C",
      status: "Online",
      lastSeen: new Date(),
    },
    {
      sensorId: "SN-WL-109",
      location: "Mandi Beas River Point",
      type: "Water Level",
      value: 2.8,
      unit: "m",
      status: "Online",
      lastSeen: new Date(),
    },
  ]);
  console.log(`Seeded ${sensors.length} IoT sensors`);

  // 3. Seed Alerts
  const alerts = await Alert.create([
    {
      type: "Landslide",
      level: "Critical",
      location: "Joshimath Sector 4",
      message: "Imminent slope instability detected. Soil saturation > 78%. Immediate evacuation advised for vulnerable zones.",
      active: true,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    },
    {
      type: "Flood",
      level: "High",
      location: "Alaknanda River Basin",
      message: "Water levels approaching critical threshold (4.2m). Flash flood warning issued for downstream villages.",
      active: true,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
    {
      type: "Weather",
      level: "Moderate",
      location: "Dehradun Valley",
      message: "Continuous heavy precipitation forecasted for next 12 hours (expected rainfall > 85mm).",
      active: true,
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
    },
    {
      type: "System",
      level: "Low",
      location: "Central Monitoring Grid",
      message: "All 9 telemetry IoT sensor stations operational and transmitting live readings.",
      active: true,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    },
  ]);
  console.log(`Seeded ${alerts.length} alerts`);

  // 4. Seed Predictions
  const predictions = await Prediction.create([
    {
      location: "Chamoli & Joshimath Region",
      rainfall: 85,
      soilMoisture: 78,
      slopeStability: 35,
      historicalRisk: 70,
      floodRisk: 68,
      landslideRisk: 76,
      overallRisk: 72,
      riskLevel: "High",
      leadTime: "2–6 hours",
      modelVersion: "rule-engine-v1",
    },
    {
      location: "Dehradun Valley",
      rainfall: 60,
      soilMoisture: 55,
      slopeStability: 80,
      historicalRisk: 30,
      floodRisk: 42,
      landslideRisk: 38,
      overallRisk: 40,
      riskLevel: "Moderate",
      leadTime: "6–24 hours",
      modelVersion: "rule-engine-v1",
    },
    {
      location: "Shimla Ridge",
      rainfall: 45,
      soilMoisture: 50,
      slopeStability: 85,
      historicalRisk: 25,
      floodRisk: 28,
      landslideRisk: 22,
      overallRisk: 25,
      riskLevel: "Low",
      leadTime: "24+ hours",
      modelVersion: "rule-engine-v1",
    },
  ]);
  console.log(`Seeded ${predictions.length} predictions`);

  // 5. Seed Locations
  const locations = await Location.create([
    {
      name: "Dehradun",
      district: "Dehradun",
      state: "Uttarakhand",
      latitude: 30.3165,
      longitude: 78.0322,
      riskLevel: "Moderate",
      population: 578000,
    },
    {
      name: "Joshimath",
      district: "Chamoli",
      state: "Uttarakhand",
      latitude: 30.5564,
      longitude: 79.5658,
      riskLevel: "Critical",
      population: 16700,
    },
    {
      name: "Chamoli",
      district: "Chamoli",
      state: "Uttarakhand",
      latitude: 30.2937,
      longitude: 79.3199,
      riskLevel: "High",
      population: 391600,
    },
    {
      name: "Nainital",
      district: "Nainital",
      state: "Uttarakhand",
      latitude: 29.3919,
      longitude: 79.4542,
      riskLevel: "Moderate",
      population: 41377,
    },
    {
      name: "Shimla",
      district: "Shimla",
      state: "Himachal Pradesh",
      latitude: 31.1048,
      longitude: 77.1734,
      riskLevel: "Moderate",
      population: 169578,
    },
    {
      name: "Mandi",
      district: "Mandi",
      state: "Himachal Pradesh",
      latitude: 31.5892,
      longitude: 76.9182,
      riskLevel: "High",
      population: 26400,
    },
  ]);
  console.log(`Seeded ${locations.length} locations`);

  // 6. Seed Historical Disasters
  const disasters = await Disaster.create([
    {
      location: "Chamoli",
      type: "Flash Flood",
      severity: "Critical",
      description: "Glacial lake outburst flood along the Rishiganga and Dhauliganga rivers damaging hydro stations and downstream habitats.",
      date: new Date("2021-02-07"),
    },
    {
      location: "Kedarnath Valley",
      type: "Cloudburst",
      severity: "Critical",
      description: "Massive cloudburst and breach of Chorabari Lake causing catastrophic flooding across the Mandakini valley.",
      date: new Date("2013-06-16"),
    },
    {
      location: "Malpa",
      type: "Landslide",
      severity: "High",
      description: "Massive rockfall and slope collapse following intense continuous precipitation in the Kali river valley.",
      date: new Date("2018-08-14"),
    },
    {
      location: "Kullu-Manali",
      type: "Flash Flood",
      severity: "High",
      description: "Beas river surged beyond danger levels due to unprecedented monsoon rainfall, impacting roads and settlements.",
      date: new Date("2023-07-09"),
    },
    {
      location: "Joshimath",
      type: "Landslide",
      severity: "Moderate",
      description: "Land subsidence and structural fissures triggered emergency relocation of residents across multiple sectors.",
      date: new Date("2023-01-02"),
    },
  ]);
  console.log(`Seeded ${disasters.length} historical disasters`);

  console.log("Database seeded successfully!");
}

if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
