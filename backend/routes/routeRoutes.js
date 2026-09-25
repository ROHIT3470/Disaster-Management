import { Router } from "express";
import { calculateRoute } from "../controllers/routeController.js";

const router = Router();

// POST /api/route/calculate
router.post("/calculate", calculateRoute);

export default router;
