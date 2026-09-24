import { Router } from "express";

import {
  createLocation,
  getLocations,
} from "../controllers/locationController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getLocations);

router.post("/", protect, adminOnly, createLocation);

export default router;
