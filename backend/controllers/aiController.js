// backend/controllers/aiController.js

import LearningSession from "../models/LearningSession.js";
import {
  generateLearningResponse,
  runEmergencyPipeline,
  getStudyModules,
} from "../services/aiService.js";
import {
  getLiveProjectContext,
} from "../services/projectContext.js";

const LEARNING_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const SESSION_TYPES = new Set(["chat", "study", "emergency"]);

function extractVisuals(content) {
  if (typeof content !== "string") return [];

  const visuals = [];
  const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    visuals.push({
      url: match[2],
      alt: match[1] || "AI visual reference",
      source: "AI response",
      type: "image",
      live: false,
    });
  }

  return visuals;
}

// ============================================================
// HELPER — GET OR CREATE SESSION
// ============================================================

async function getOrCreateSession(userId) {
  let session = await LearningSession.findOne({ userId });

  if (!session) {
    session = await LearningSession.create({ userId });
  } else if (!SESSION_TYPES.has(session.sessionType)) {
    session.sessionType = "chat";
    await session.save();
  }

  return session;
}

// ============================================================
// POST /api/ai/chat
// Send a user message and get an AI response
// ============================================================

export async function chat(req, res) {
  try {
    const {
      message,
      learningLevel,
      topic,
      sessionType,
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const trimmedMessage = message.trim().slice(0, 2000);

    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    if (learningLevel && !LEARNING_LEVELS.has(learningLevel)) {
      return res.status(400).json({ success: false, message: "Invalid learning level." });
    }
    if (sessionType && !SESSION_TYPES.has(sessionType)) {
      return res.status(400).json({ success: false, message: "Invalid session type." });
    }

    const session = await getOrCreateSession(req.user._id);

    // Update session metadata if provided
    if (learningLevel) session.learningLevel = learningLevel;
    if (topic !== undefined) session.topic = topic || null;
    if (sessionType) session.sessionType = sessionType;

    // Append user message
    session.messages.push({
      role: "user",
      content: trimmedMessage,
      timestamp: new Date(),
    });

    // Build history excluding the latest message (it's the prompt)
    const history = session.messages.slice(0, -1);

    // Call AI service
    let aiText;
    try {
      let liveContext = null;
      try {
        liveContext = await getLiveProjectContext();
      } catch (contextError) {
        console.error("[AI Context Error] Continuing without live context:", contextError.message);
      }

      aiText = await generateLearningResponse({
        message: trimmedMessage,
        history,
        learningLevel: session.learningLevel,
        topic: session.topic,
        sessionType: session.sessionType,
        context: liveContext,
      });
    } catch (aiError) {
      // Remove the user message we just added since we failed
      session.messages.pop();
      await session.save();

      console.error("[AI Service Error]", aiError.message);

      return res.status(503).json({
        success: false,
        message:
          "The AI learning service is temporarily unavailable. Please try again in a moment.",
      });
    }

    // Append AI response
    session.messages.push({
      role: "assistant",
      content: aiText,
      visuals: extractVisuals(aiText),
      timestamp: new Date(),
    });

    await session.save();

    return res.json({
      success: true,
      message: aiText,
      visuals: extractVisuals(aiText),
      sessionId: session._id,
      topic: session.topic,
      learningLevel: session.learningLevel,
      messageCount: session.messages.length,
    });
  } catch (error) {
    console.error("[AI Chat Controller Error]", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
}

// ============================================================
// GET /api/ai/session
// Retrieve current session history
// ============================================================

export async function getSession(req, res) {
  try {
    const session = await LearningSession.findOne({
      userId: req.user._id,
    }).select("-__v");

    if (!session) {
      return res.json({
        success: true,
        session: null,
        messages: [],
        topic: null,
        learningLevel: "beginner",
        sessionType: "chat",
      });
    }

    return res.json({
      success: true,
      sessionId: session._id,
      messages: session.messages,
      topic: session.topic,
      learningLevel: LEARNING_LEVELS.has(session.learningLevel)
        ? session.learningLevel
        : "advanced",
      sessionType: SESSION_TYPES.has(session.sessionType)
        ? session.sessionType
        : "chat",
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error("[AI Session Controller Error]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve session.",
    });
  }
}

// ============================================================
// DELETE /api/ai/session
// Clear conversation history
// ============================================================

export async function clearSession(req, res) {
  try {
    const session = await LearningSession.findOne({
      userId: req.user._id,
    });

    if (session) {
      session.messages = [];
      session.topic = null;
      await session.save();
    }

    return res.json({
      success: true,
      message: "Learning session cleared.",
    });
  } catch (error) {
    console.error("[AI Clear Session Error]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear session.",
    });
  }
}

// ============================================================
// PATCH /api/ai/session
// Update session metadata (level, topic, type) without sending a message
// ============================================================

export async function updateSession(req, res) {
  try {
    const { learningLevel, topic, sessionType } = req.body;

    const session = await getOrCreateSession(req.user._id);

    if (learningLevel && !LEARNING_LEVELS.has(learningLevel)) {
      return res.status(400).json({ success: false, message: "Invalid learning level." });
    }
    if (sessionType && !SESSION_TYPES.has(sessionType)) {
      return res.status(400).json({ success: false, message: "Invalid session type." });
    }
    if (learningLevel) session.learningLevel = learningLevel;
    if (topic !== undefined) session.topic = topic || null;
    if (sessionType) session.sessionType = sessionType;

    await session.save();

    return res.json({
      success: true,
      topic: session.topic,
      learningLevel: session.learningLevel,
      sessionType: session.sessionType,
    });
  } catch (error) {
    console.error("[AI Update Session Error]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update session.",
    });
  }
}

// ============================================================
// POST /api/ai/emergency
// 4-Agent Emergency Safety Pipeline (Planner, Auditor, Writer, Reviewer)
// ============================================================

export async function emergencyChat(req, res) {
  try {
    const { situation, location = "India", topic } = req.body;

    if (!situation || typeof situation !== "string" || !situation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Situation description is required for emergency guidance.",
      });
    }

    const session = await getOrCreateSession(req.user._id);
    session.sessionType = "emergency";
    if (topic) session.topic = topic;

    // Previous conversation context for memory
    const memory = session.messages
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // Execute the 4-agent safety pipeline
    const pipelineResult = await runEmergencyPipeline({
      situation: situation.trim(),
      location: location.trim() || "India",
      memory,
    });

    // Save user emergency message
    session.messages.push({
      role: "user",
      content: `[URGENT INCIDENT REPORT - Location: ${location || "India"}]\n${situation.trim()}`,
      timestamp: new Date(),
    });

    // Save final reviewed assistant guidance
    session.messages.push({
      role: "assistant",
      content: pipelineResult.finalResponse,
      timestamp: new Date(),
    });

    await session.save();

    return res.json({
      success: true,
      plan: pipelineResult.plan,
      audit: pipelineResult.audit,
      draft: pipelineResult.draft,
      finalResponse: pipelineResult.finalResponse,
      agents: pipelineResult.agents,
      sessionId: session._id,
      messageCount: session.messages.length,
    });
  } catch (error) {
    console.error("[AI Emergency Controller Error]", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during emergency agent evaluation.",
    });
  }
}

// ============================================================
// GET /api/ai/study-modules
// Retrieve structured study curriculum modules
// ============================================================

export function listStudyModules(req, res) {
  try {
    const modules = getStudyModules();

    return res.json({
      success: true,
      modules,
    });
  } catch (error) {
    console.error("[AI Study Modules Error]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve study modules.",
    });
  }

}

// ============================================================
// GET /api/ai/project-context
// Report the connected my_project model and dataset inventory
// ============================================================

export function projectContext(req, res) {
  getLiveProjectContext()
    .then((context) => res.json({
      success: true,
      context,
    }))
    .catch((error) => {
      console.error("[AI Project Context Error]", error);
      res.status(500).json({
        success: false,
        message: "Failed to inspect the connected project AI sources.",
      });
    });
}
