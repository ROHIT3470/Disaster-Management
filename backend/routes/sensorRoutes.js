import { Router } from "express";

import {
  createSensor,
  deleteSensor,
  getSensors,
  updateSensor,
} from "../controllers/sensorController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getSensors);

router.post("/", protect, adminOnly, createSensor);

router.patch("/:id", protect, adminOnly, updateSensor);

router.delete("/:id", protect, adminOnly, deleteSensor);

export default router;
