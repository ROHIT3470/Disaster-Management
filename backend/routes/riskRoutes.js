import { Router } from "express";

import { getPredictions, predictRisk } from "../controllers/riskController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getPredictions);

router.post("/predict", protect, predictRisk);

export default router;
