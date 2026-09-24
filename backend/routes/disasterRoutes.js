import { Router } from "express";

import {
  createDisaster,
  getDisasters,
} from "../controllers/disasterController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getDisasters);

router.post("/", protect, adminOnly, createDisaster);

export default router;
