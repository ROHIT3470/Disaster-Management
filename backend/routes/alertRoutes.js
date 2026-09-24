import { Router } from "express";

import {
  createAlert,
  deleteAlert,
  getAlerts,
  updateAlert,
} from "../controllers/alertController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getAlerts);

router.post("/", protect, adminOnly, createAlert);

router.patch("/:id", protect, adminOnly, updateAlert);

router.delete("/:id", protect, adminOnly, deleteAlert);

export default router;
