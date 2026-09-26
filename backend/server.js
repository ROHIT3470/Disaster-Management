// backend/server.js

import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import disasterRoutes from "./routes/disasterRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
<<<<<<< HEAD
import { isEmailConfigured, verifyEmailConnection } from "./services/emailService.js";
=======
import {
  isEmailConfigured,
  verifyEmailConnection,
} from "./services/emailService.js";
>>>>>>> a45c3824009c000b36cf2381145f183fd3dd0d42
import {
  logError,
  logInfo,
  logSuccess,
  logWarning,
  printShutdownMessage,
  printStartupBanner,
  printStartupSummary,
} from "./utils/terminal.js";

import User from "./models/User.js";
import { seedDatabase } from "./scripts/seed.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// ============================================================
// SECURITY & CORE MIDDLEWARE
// ============================================================

app.set("trust proxy", 1);

app.use(helmet());

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) or common tunnels in dev
  if (
    process.env.NODE_ENV !== "production" ||
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
      origin,
    ) ||
    origin.endsWith(".devtunnels.ms") ||
    origin.endsWith(".loca.lt") ||
    origin.endsWith(".ngrok-free.app")
  ) {
    return true;
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ============================================================
// RATE LIMITER
// ============================================================

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: process.env.NODE_ENV === "production" ? 1000 : 10000,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  skip: (req) => {
    // Do not rate-limit development requests.
    if (process.env.NODE_ENV !== "production") {
      return true;
    }

    // Health checks should never
    // consume API quota.
    if (req.path === "/api/health") {
      return true;
    }

    return false;
  },

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(apiRateLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "disaster-management-api",
    time: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);

app.use("/api/alerts", alertRoutes);

app.use("/api/disasters", disasterRoutes);

app.use("/api/locations", locationRoutes);

app.use("/api/risk", riskRoutes);

app.use("/api/predictions", riskRoutes);

app.use("/api/sensors", sensorRoutes);

app.use("/api/users", userRoutes);

app.use("/api/weather", weatherRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/route", routeRoutes);
<<<<<<< HEAD

=======
>>>>>>> a45c3824009c000b36cf2381145f183fd3dd0d42

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);

app.use(errorHandler);

// ============================================================
// SERVER & DATABASE BOOTSTRAP
// ============================================================

async function startServer() {
  try {
    printStartupBanner();
    logInfo(`Environment  ${process.env.NODE_ENV || "development"}`);
    logInfo(`Port         ${PORT}`);

    await connectDB();

    try {
      const existingEmails = await User.distinct("email");
      const demoAccounts = [
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
      ];

      const missingUsers = demoAccounts.filter(
        ({ email }) =>
          !existingEmails.some(
            (existingEmail) =>
              existingEmail.toLowerCase() === email.toLowerCase(),
          ),
      );

      if (missingUsers.length > 0) {
        logInfo("Accounts     creating missing demo command accounts...");

        await User.create(missingUsers);
        logSuccess(
          `Accounts     created ${missingUsers.length} demo account(s)`,
        );
      }
    } catch (seedErr) {
      logWarning(`Accounts     auto-seed check skipped: ${seedErr.message}`);
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      printStartupSummary({ port: PORT, emailConfigured: isEmailConfigured() });

      if (isEmailConfigured()) {
        verifyEmailConnection()
          .then(() => logSuccess("SMTP          connection verified"))
          .catch((error) => logWarning(`SMTP          ${error.message}`));
      }
    });

    // ========================================================
    // GRACEFUL SHUTDOWN
    // ========================================================

    const handleShutdown = async (signal) => {
      printShutdownMessage(signal);

      server.close(async () => {
        logSuccess("HTTP server  closed");

        try {
          await mongoose.connection.close();

          logSuccess("MongoDB      connection closed");

          process.exit(0);
        } catch (err) {
          logError(`Shutdown     database close failed: ${err.message}`);

          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    logError(`Startup      failed: ${error.message}`);

    process.exit(1);
  }
}

startServer();
