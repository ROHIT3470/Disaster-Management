import mongoose from "mongoose";
import { logError, logSuccess, logWarning } from "../utils/terminal.js";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not configured in environment variables.");
  }

  try {
    const db = await mongoose.connect(uri, {
      bufferCommands: false, // Disable Mongoose command buffering for better handling in async/serverless environments
    });

    isConnected = db.connections[0].readyState === 1;
    logSuccess(`MongoDB      connected at ${db.connection.host}`);
  } catch (error) {
    logError(`MongoDB      connection failed: ${error.message}`);
    throw error;
  }
}

// Register global event listeners outside the function to prevent duplicate listener memory leaks
mongoose.connection.on("disconnected", () => {
  logWarning("MongoDB      disconnected");
  isConnected = false;
});

mongoose.connection.on("error", (error) => {
  logError(`MongoDB      runtime error: ${error.message}`);
});
