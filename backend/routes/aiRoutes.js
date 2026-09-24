// backend/routes/aiRoutes.js

import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  chat,
  clearSession,
  emergencyChat,
  getSession,
  listStudyModules,
  projectContext,
  updateSession,
} from "../controllers/aiController.js";

const router = Router();

// All AI routes require authentication
router.use(protect);

// ============================================================
// CONVERSATION
// ============================================================

// Send a message and receive an AI response
router.post("/chat", chat);

// 4-Agent Emergency Safety Pipeline (Planner, Auditor, Writer, Reviewer)
router.post("/emergency", emergencyChat);

// Retrieve structured study curriculum modules
router.get("/study-modules", listStudyModules);
router.get("/project-context", projectContext);

// ============================================================
// SESSION MANAGEMENT
// ============================================================

// Retrieve current session (history, metadata)
router.get("/session", getSession);

// Update session metadata (level, topic, mode)
router.patch("/session", updateSession);

// Clear conversation history
router.delete("/session", clearSession);

export default router;
