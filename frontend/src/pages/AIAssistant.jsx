import {
  AlertOctagon,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Database,
  Layers,
  Lightbulb,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Zap
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearAISession,
  getAISession,
  getAIProjectContext,
  getAIStudyModules,
  runAIEmergencyAgent,
  sendAIMessage,
  updateAISession,
} from "../services/api.js";

import AIMessage from "../components/ai/AIMessage.jsx";
import ChatInput from "../components/ai/ChatInput.jsx";
import TypingIndicator from "../components/ai/TypingIndicator.jsx";
import { useToast } from "../context/ToastContext.jsx";
import "../styles/ai-assistant.css";

/* ============================================================
   CONSTANTS & CONFIG
   ============================================================ */

const MODES = [
  {
    id: "chat",
    label: "Interactive Learning",
    shortLabel: "Chat & Learn",
    icon: MessageSquare,
    desc: "Domain Q&A, early warning rules, and operational guidance",
  },
  {
    id: "emergency",
    label: "Emergency Multi-Agent",
    shortLabel: "Emergency 4-Agent",
    icon: ShieldAlert,
    desc: "4-stage safety pipeline from chat.py (Planner -> Auditor -> Writer -> Reviewer)",
    badge: "AGENTIC",
  },
  {
    id: "study",
    label: "Disaster Study Lab",
    shortLabel: "Study Lab",
    icon: BookOpen,
    desc: "Structured curriculum grounded in regional hydrological datasets",
  },
];

const LEARNING_LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Core concepts & plain analogies" },
  { id: "intermediate", label: "Intermediate", desc: "Hydrological & sensor metrics" },
  { id: "advanced", label: "Advanced", desc: "Geotechnical FoS & Sendai frameworks" },
];

const QUICK_PROMPTS = [
  "What is flash flooding and what hourly rainfall triggers it?",
  "How does soil moisture above 80% trigger slope failure?",
  "Explain the river surge threshold (>= 0.25 m/h) in flood warning",
  "What is the Sendai Framework Target G for early warning systems?",
  "Explain how IoT tipping bucket rain gauges transmit telemetry",
  "What are standard NDMA India protocols for flash flood evacuation?",
  "Why is 15 cm of moving water dangerous to human safety?",
];

/* ============================================================
   MAIN AI ASSISTANT PAGE
   ============================================================ */

export default function AIAssistant() {
  const { addToast } = useToast();

  // State: Mode & Session Configuration
  const [activeMode, setActiveMode] = useState("chat");
  const [learningLevel, setLearningLevel] = useState("beginner");
  const [activeTopic, setActiveTopic] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [lastFailedPrompt, setLastFailedPrompt] = useState("");

  // Emergency Multi-Agent State (chat.py 4-agent pipeline)
  const [emergencySituation, setEmergencySituation] = useState("");
  const [emergencyLocation, setEmergencyLocation] = useState("Guwahati, Assam, India");
  const [emergencyRunning, setEmergencyRunning] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState(null);
  const [openAgentTrace, setOpenAgentTrace] = useState({
    planner: true,
    auditor: true,
    writer: true,
    reviewer: true,
  });

  // Study Lab State
  const [studyModules, setStudyModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [projectContext, setProjectContext] = useState(null);

  // Audio Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);

  const suggestedPrompts = useMemo(() => {
    const liveData = projectContext?.liveData;
    const prompts = [];

    if (liveData?.alerts?.length) {
      prompts.push("Summarize the active GeoNexus alerts.");
    }
    if (liveData?.predictions?.length) {
      prompts.push("Explain the latest GeoNexus prediction and its contributing factors.");
    }
    if (liveData?.sensors?.length) {
      prompts.push("Explain the latest available sensor readings.");
    }

    return [...prompts, ...QUICK_PROMPTS].slice(0, 7);
  }, [projectContext]);

  // Message list reference for auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (activeMode === "chat") {
      scrollToBottom();
    }
  }, [messages, loading, activeMode, scrollToBottom]);

  // Load Session from backend on mount
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        setSessionLoading(true);
        const res = await getAISession();
        if (mounted && res.data?.success) {
          if (Array.isArray(res.data.messages)) {
            setMessages(res.data.messages);
          }
          if (res.data.learningLevel) {
            setLearningLevel(
              ["beginner", "intermediate", "advanced"].includes(res.data.learningLevel)
                ? res.data.learningLevel
                : "advanced",
            );
          }
          if (res.data.topic) {
            setActiveTopic(res.data.topic);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve AI session history:", err.message);
      } finally {
        if (mounted) setSessionLoading(false);
      }
    }

    loadSession();

    return () => {
      mounted = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProjectContext() {
      try {
        const res = await getAIProjectContext();
        if (mounted && res.data?.success) {
          setProjectContext(res.data.context);
        }
      } catch (err) {
        console.warn("Failed to inspect project AI sources:", err.message);
      }
    }

    loadProjectContext();

    return () => {
      mounted = false;
    };
  }, []);

  // Load Study Modules
  useEffect(() => {
    let mounted = true;
    async function loadModules() {
      try {
        setStudyLoading(true);
        const res = await getAIStudyModules();
        if (mounted && res.data?.success && Array.isArray(res.data.modules)) {
          setStudyModules(res.data.modules);
          if (res.data.modules.length > 0) {
            setSelectedModule(res.data.modules[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load study modules:", err.message);
      } finally {
        if (mounted) setStudyLoading(false);
      }
    }

    loadModules();
    return () => {
      mounted = false;
    };
  }, []);

  // Level change handler
  const handleLevelChange = async (level) => {
    setLearningLevel(level);
    try {
      await updateAISession({ learningLevel: level });
      addToast({
        title: "Learning Level Updated",
        message: `AI instruction calibrated to ${level.toUpperCase()} tier.`,
        type: "info",
      });
    } catch (err) {
      console.warn("Session level update failed:", err.message);
    }
  };

  // Mode change handler
  const handleModeChange = (modeId) => {
    setActiveMode(modeId);
    setSidebarOpen(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    updateAISession({ sessionType: modeId }).catch((error) => {
      console.warn("AI mode persistence failed:", error.message);
    });
  };

  // Send message in Chat Mode
  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || loading) return;

    const trimmedText = text.trim();
    const userMessage = {
      role: "user",
      content: trimmedText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setChatError("");
    setLastFailedPrompt("");

    try {
      const res = await sendAIMessage({
        message: trimmedText,
        learningLevel,
        topic: activeTopic,
        sessionType: "chat",
      });

      if (res.data?.success && res.data.message) {
        const assistantMessage = {
          role: "assistant",
          content: res.data.message,
          visuals: Array.isArray(res.data.visuals) ? res.data.visuals : [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(res.data?.message || "Invalid response structure");
      }
    } catch (error) {
      console.error("Chat send failed:", error);
      setChatError(
        error.response?.status === 401
          ? "Your session has expired. Sign in again to continue using GeoNexus AI."
          : "GeoNexus AI could not complete that request. Check the connection and try again.",
      );
      setLastFailedPrompt(trimmedText);
      addToast({
        title: "AI service unavailable",
        message: "Your question was not answered. Use Retry to send it again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryMessage = () => {
    if (!lastFailedPrompt || loading) return;

    const prompt = lastFailedPrompt;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "user" && last.content === prompt
        ? prev.slice(0, -1)
        : prev;
    });
    handleSendMessage(prompt);
  };

  // Clear session handler
  const handleClearSession = async () => {
    if (!window.confirm("Are you sure you want to clear your current conversation history?")) {
      return;
    }

    try {
      await clearAISession();
      setMessages([]);
      setActiveTopic(null);
      setEmergencyResult(null);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      addToast({
        title: "Session Reset",
        message: "AI conversation memory cleared successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Clear session failed:", err);
      addToast({
        title: "Session Error",
        message: "Failed to reset session on server.",
        type: "error",
      });
    }
  };

  // Text-to-Speech (Read Aloud)
  const handleToggleSpeech = (text) => {
    if (!window.speechSynthesis) {
      addToast({
        title: "Speech Unavailable",
        message: "Text-to-Speech is not supported by your browser.",
        type: "warning",
      });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/[#*_`>\[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Execute Emergency Multi-Agent Pipeline (chat.py)
  const handleRunEmergencyPipeline = async (e) => {
    e?.preventDefault();
    if (!emergencySituation.trim() || emergencyRunning) return;

    setEmergencyRunning(true);
    setEmergencyResult(null);

    try {
      const res = await runAIEmergencyAgent({
        situation: emergencySituation.trim(),
        location: emergencyLocation.trim(),
        topic: "Emergency Flash Flood & Life Safety",
      });

      if (res.data?.success) {
        setEmergencyResult(res.data);
        addToast({
          title: "Multi-Agent Protocol Complete",
          message: "All 4 safety agents verified response without hazard exposure.",
          type: "success",
        });
      } else {
        throw new Error(res.data?.message || "Execution failed");
      }
    } catch (err) {
      console.error("Emergency pipeline execution failed:", err);
      addToast({
        title: "Emergency AI unavailable",
        message: "The emergency service could not complete this request. Please retry or contact emergency services directly.",
        type: "error",
      });
      setEmergencyResult(null);
    } finally {
      setEmergencyRunning(false);
    }
  };

  // Get the latest assistant response for reading aloud
  const latestAssistantMessage = useMemo(() => {
    const list = messages.filter((m) => m.role === "assistant");
    return list.length > 0 ? list[list.length - 1].content : null;
  }, [messages]);

  return (
    <div className="ai-page" role="main" aria-label="GeoNexus AI Learning & Emergency Studio">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="ai-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================
          LEFT / DESKTOP SIDEBAR
          ============================================================ */}
      <aside className={`ai-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="AI Navigation">
        {/* Brand Header */}
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-brand">
            <div className="ai-sidebar-brand-icon" aria-hidden="true">
              <BrainCircuit size={18} />
            </div>
            <div className="ai-sidebar-brand-text">
              <strong>GeoNexus AI</strong>
              <span>Learning & Emergency Lab</span>
            </div>
          </div>

          <button
            type="button"
            className="ai-new-session-btn"
            onClick={handleClearSession}
            title="Reset active conversation"
            aria-label="New learning session"
          >
            <Plus size={14} />
            New Session
          </button>
        </div>

        {/* Learning Level Selector */}
        <div className="ai-sidebar-section">
          <span className="ai-sidebar-section-title">Instruction Tier</span>
          <div className="ai-level-selector" role="group" aria-label="Select instruction tier">
            {LEARNING_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                className={`ai-level-btn ${learningLevel === lvl.id ? "active" : ""}`}
                onClick={() => handleLevelChange(lvl.id)}
                aria-pressed={learningLevel === lvl.id}
                title={lvl.desc}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Operating Modes */}
        <div className="ai-sidebar-section" style={{ marginTop: 12 }}>
          <span className="ai-sidebar-section-title">Operating Modules</span>
          <div className="ai-mode-selector" role="group" aria-label="Select AI mode">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`ai-mode-btn ${activeMode === m.id ? "active" : ""}`}
                  onClick={() => handleModeChange(m.id)}
                  aria-pressed={activeMode === m.id}
                >
                  <Icon size={16} aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{m.shortLabel}</span>
                      {m.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: "rgba(225, 29, 72, 0.15)",
                            color: "var(--danger, #e11d48)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="ai-suggested-prompts-sidebar">
          <span className="ai-sidebar-section-title">
            <Zap size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
            Quick Prompts
          </span>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ai-prompt-chip"
              onClick={() => {
                handleModeChange("chat");
                handleSendMessage(prompt);
              }}
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Grounded Datasets Badge */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Database size={13} style={{ color: "var(--primary)" }} />
            <strong style={{ fontSize: 11, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
              Grounded In Project Data
            </strong>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Uses only connected GeoNexus records and project AI sources. Missing values are reported as unavailable.
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA
          ============================================================ */}
      <div className="ai-main">
        {/* Chat / Module Header */}
        <header className="ai-chat-header">
          <div className="ai-chat-header-left">
            <button
              type="button"
              className="ai-sidebar-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation drawer"
            >
              <Layers size={16} />
            </button>

            <div className="ai-header-icon" aria-hidden="true">
              {activeMode === "emergency" ? (
                <ShieldAlert size={18} />
              ) : activeMode === "study" ? (
                <BookOpen size={18} />
              ) : (
                <Bot size={18} />
              )}
            </div>

            <div className="ai-header-text">
              <h2>
                {activeMode === "emergency"
                  ? "Emergency Multi-Agent Protocol"
                  : activeMode === "study"
                  ? "Disaster Management Study Lab"
                  : "Interactive Learning & Operational Advisor"}
              </h2>
              <span>
                {activeMode === "emergency"
                  ? "4-Stage Safety Architecture: Planner → Safety Auditor → Writer → Reviewer"
                  : activeMode === "study"
                  ? "Hydrological & Geotechnical Curriculum Modules"
                  : `Calibrated for ${learningLevel.toUpperCase()} tier · Grounded in connected project records`}
              </span>
            </div>
          </div>

          <div className="ai-header-actions">
            {projectContext && (
              <div
                className="ai-header-badge"
                title={`Connected to ${projectContext.availableDatasetCount}/${projectContext.totalDatasetCount} datasets and ${projectContext.availablePythonToolCount || 0}/${projectContext.totalPythonToolCount || 0} Python tools in my_project`}
              >
                <span className="ai-header-status-dot" />
                Project AI {projectContext.availableDatasetCount}/{projectContext.totalDatasetCount}
                {projectContext.availablePythonToolCount !== undefined && (
                  <span style={{ marginLeft: 4 }}>
                    · Tools {projectContext.availablePythonToolCount}/{projectContext.totalPythonToolCount}
                  </span>
                )}
              </div>
            )}

            {/* Status Pill */}
            <div className="ai-header-badge" title="Connected to Google Gemini 3.6 Flash">
              <span className="ai-header-status-dot" />
              Gemini 3.6 Flash
            </div>

            {/* Read Aloud Button */}
            {activeMode === "chat" && latestAssistantMessage && (
              <button
                type="button"
                className="ai-icon-btn"
                onClick={() => handleToggleSpeech(latestAssistantMessage)}
                title={isSpeaking ? "Stop reading" : "Read latest response aloud"}
                aria-label={isSpeaking ? "Stop speech" : "Read aloud"}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            )}

            {/* Clear Session */}
            <button
              type="button"
              className="ai-icon-btn danger"
              onClick={handleClearSession}
              title="Clear session history"
              aria-label="Clear session history"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {activeMode === "chat" && projectContext?.liveData && (
          <section className="ai-context-strip" aria-label="Current GeoNexus context">
            <div>
              <span className="ai-context-label">LIVE PROJECT CONTEXT</span>
              <strong>
                {projectContext.liveData.alerts.length} active alert
                {projectContext.liveData.alerts.length === 1 ? "" : "s"}
              </strong>
            </div>
            <div>
              <span className="ai-context-label">LATEST PREDICTION</span>
              <strong>
                {projectContext.liveData.predictions[0]
                  ? `${projectContext.liveData.predictions[0].riskLevel || "Recorded"}${projectContext.liveData.predictions[0].location ? ` · ${projectContext.liveData.predictions[0].location}` : ""}`
                  : "Unavailable"}
              </strong>
            </div>
            <div>
              <span className="ai-context-label">SENSOR RECORDS</span>
              <strong>{projectContext.liveData.sensors.length} available</strong>
            </div>
            <span className="ai-context-note">
              Answers are grounded in these records when relevant.
            </span>
          </section>
        )}

        {/* ==========================================================
            MODE 1: INTERACTIVE CHAT
            ========================================================== */}
        {activeMode === "chat" && (
          <>
            {chatError && (
              <div className="ai-error-banner" role="alert">
                <span>{chatError}</span>
                {lastFailedPrompt && (
                  <button
                    type="button"
                    className="ai-error-retry"
                    onClick={handleRetryMessage}
                    disabled={loading}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div className="ai-message-list">
              {sessionLoading ? (
                <div className="ai-empty-state">
                  <div className="ai-loading-spinner" />
                  <p>Loading conversation memory...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="ai-empty-state">
                  <div className="ai-empty-icon" aria-hidden="true">
                    <Sparkles size={28} />
                  </div>
                  <h3>Welcome to the GeoNexus AI Learning Lab</h3>
                  <p>
                    Ask questions about flood hydrology, geotechnical slope stability, early warning
                    thresholds, or command operations. Responses adapt to your chosen tier.
                  </p>

                  <div className="ai-suggested-grid">
                    {suggestedPrompts.slice(0, 4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="ai-suggested-card"
                        onClick={() => handleSendMessage(p)}
                      >
                        <Zap size={14} aria-hidden="true" />
                        <span>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, idx) => (
                    <AIMessage key={idx} message={m} />
                  ))}
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={loading || sessionLoading}
              placeholder="Ask about flash flood dynamics, slope stability, sensor readings, or Sendai framework…"
            />
          </>
        )}

        {/* ==========================================================
            MODE 2: 4-STAGE AGENTIC EMERGENCY SAFETY PIPELINE (chat.py)
            ========================================================== */}
        {activeMode === "emergency" && (
          <div className="ai-study-panel" style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
            {/* Header Banner */}
            <div
              style={{
                background: "rgba(225, 29, 72, 0.08)",
                border: "1px solid rgba(225, 29, 72, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <AlertOctagon size={24} style={{ color: "var(--danger, #e11d48)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                  Multi-Agent Emergency Response Engine
                </strong>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Directly ported from the root <code>chat.py</code> architecture. This system executes four
                  specialized autonomous agents in sequence to guarantee zero risky guidance and prioritize immediate
                  life preservation.
                </p>
              </div>
            </div>

            {/* Situation Input Form */}
            <form onSubmit={handleRunEmergencyPipeline} className="ai-study-card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={16} style={{ color: "var(--danger)" }} />
                Describe the Emergency Incident
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    LOCATION / GEOGRAPHY
                  </label>
                  <input
                    type="text"
                    value={emergencyLocation}
                    onChange={(e) => setEmergencyLocation(e.target.value)}
                    placeholder="e.g., Guwahati, Assam (near Brahmaputra basin)"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    VERIFIED HELPLINE
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "rgba(5, 150, 105, 0.08)",
                      color: "var(--success, #059669)",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Dial 112 (National Emergency Support System)
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  INCIDENT & THREAT CONDITIONS
                </label>
                <textarea
                  rows={3}
                  value={emergencySituation}
                  onChange={(e) => setEmergencySituation(e.target.value)}
                  placeholder="e.g., Water rising rapidly around residential home, ground floor flooded up to 1 meter, family trapped on first floor, heavy rain continuing..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={emergencyRunning || !emergencySituation.trim()}
                className="ai-new-session-btn"
                style={{
                  background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                  width: "auto",
                  padding: "10px 20px",
                }}
              >
                {emergencyRunning ? (
                  <>
                    <div className="ai-loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Running 4-Agent Pipeline...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Run 4-Agent Safety Protocol
                  </>
                )}
              </button>
            </form>

            {/* Multi-Agent Execution Progress & Results */}
            {emergencyResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Visual Pipeline Trace */}
                <div className="ai-study-card">
                  <div className="ai-study-card-header">
                    <BrainCircuit size={15} style={{ color: "var(--primary)" }} />
                    <span className="ai-study-card-label">Autonomous Agent Reasoning Trace</span>
                  </div>

                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Stage 1: Planner */}
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "var(--background)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAgentTrace((prev) => ({ ...prev, planner: !prev.planner }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle2 size={14} style={{ color: "var(--success, #059669)" }} />
                          Stage 1: Primary Planning Agent (Initial Action Sequence)
                        </span>
                        {openAgentTrace.planner ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {openAgentTrace.planner && (
                        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                          <div className="ai-markdown">
                            <pre style={{ background: "transparent", border: "none", padding: 0, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                              {emergencyResult.plan}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stage 2: Auditor */}
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "var(--background)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAgentTrace((prev) => ({ ...prev, auditor: !prev.auditor }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle2 size={14} style={{ color: "var(--success, #059669)" }} />
                          Stage 2: Safety Auditor Agent (Hazard Audit & Elimination)
                        </span>
                        {openAgentTrace.auditor ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {openAgentTrace.auditor && (
                        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                          <pre style={{ background: "transparent", border: "none", padding: 0, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                            {emergencyResult.audit}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Stage 3: Writer */}
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "var(--background)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAgentTrace((prev) => ({ ...prev, writer: !prev.writer }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle2 size={14} style={{ color: "var(--success, #059669)" }} />
                          Stage 3: Response Writer Agent (Action Synthesis)
                        </span>
                        {openAgentTrace.writer ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {openAgentTrace.writer && (
                        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                          <pre style={{ background: "transparent", border: "none", padding: 0, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                            {emergencyResult.draft}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Stage 4: Reviewer */}
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "var(--background)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAgentTrace((prev) => ({ ...prev, reviewer: !prev.reviewer }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ShieldCheck size={14} style={{ color: "var(--primary)" }} />
                          Stage 4: Safety Reviewer Agent (Certified Final Advisory)
                        </span>
                        {openAgentTrace.reviewer ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {openAgentTrace.reviewer && (
                        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success, #059669)", fontWeight: 600, marginBottom: 6 }}>
                            <Check size={14} />
                            Zero hazardous recommendations verified. Approved for public dissemination.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Final Approved Emergency Guidance Card */}
                <div
                  className="ai-study-card"
                  style={{
                    border: "2px solid var(--primary)",
                    boxShadow: "0 0 20px rgba(6, 182, 212, 0.15)",
                  }}
                >
                  <div
                    className="ai-study-card-header"
                    style={{
                      background: "rgba(var(--primary-rgb, 15, 118, 110), 0.12)",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
                      <strong style={{ fontSize: 13, color: "var(--primary)" }}>
                        FINAL AUDITED EMERGENCY GUIDANCE
                      </strong>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="ai-icon-btn"
                        onClick={() => handleToggleSpeech(emergencyResult.finalResponse)}
                        title={isSpeaking ? "Stop speech" : "Read aloud"}
                        aria-label="Read guidance aloud"
                      >
                        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <button
                        type="button"
                        className="ai-icon-btn"
                        onClick={() => {
                          navigator.clipboard?.writeText(emergencyResult.finalResponse);
                          addToast({
                            title: "Copied",
                            message: "Emergency instructions copied to clipboard.",
                            type: "success",
                          });
                        }}
                        title="Copy instructions"
                        aria-label="Copy instructions"
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="ai-study-card-body">
                    <div className="ai-markdown" style={{ fontSize: 14 }}>
                      <pre style={{ background: "transparent", border: "none", padding: 0, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                        {emergencyResult.finalResponse}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================================
            MODE 3: DISASTER MANAGEMENT STUDY LAB
            ========================================================== */}
        {activeMode === "study" && (
          <div className="ai-study-panel">
            <div className="ai-study-header">
              <div>
                <h3 className="ai-study-title">Curriculum Modules & Scientific Foundations</h3>
                <p className="ai-study-subtitle">
                  Grounded directly in regional hydrological data, sensor telemetry, and geotechnical frameworks.
                </p>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {(projectContext?.datasets
                  ?.filter((dataset) => dataset.available)
                  .map((dataset) => ({
                    ...dataset,
                    desc: "Connected project AI source",
                  })) || []
                ).map((d) => (
                  <span
                    key={d.name}
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                    title={d.desc}
                  >
                    📄 {d.name.slice(0, 22)}...
                  </span>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="ai-study-topics">
              {studyModules.map((mod) => {
                const isSelected = selectedModule?.id === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className="ai-study-topic-btn"
                    onClick={() => setSelectedModule(mod)}
                    style={{
                      borderColor: isSelected ? "var(--primary)" : "var(--border)",
                      background: isSelected ? "rgba(var(--primary-rgb, 15, 118, 110), 0.08)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span className="ai-study-topic-name">{mod.title}</span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 6px",
                          borderRadius: 3,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {mod.level}
                      </span>
                    </div>
                    <p className="ai-study-topic-desc">{mod.summary}</p>
                  </button>
                );
              })}
            </div>

            {/* Active Module Details */}
            {selectedModule && (
              <div className="ai-study-card">
                <div className="ai-study-card-header" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={16} style={{ color: "var(--primary)" }} />
                    <span className="ai-study-card-label">{selectedModule.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {selectedModule.datasetLink}
                  </span>
                </div>

                <div className="ai-study-card-body">
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                    CORE CONCEPTS
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                    {selectedModule.keyConcepts.map((kc, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 12,
                          background: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                        }}
                      >
                        <strong style={{ display: "block", fontSize: 13, color: "var(--primary)", marginBottom: 4 }}>
                          {kc.term}
                        </strong>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                          {kc.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Takeaway Block */}
                  <div className="ai-callout takeaway" style={{ marginBottom: 14 }}>
                    <Lightbulb size={16} className="ai-callout-icon" />
                    <div>
                      <strong>Operational Takeaway:</strong> {selectedModule.takeaway}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="ai-study-action-row">
                    <button
                      type="button"
                      className="ai-study-btn primary"
                      onClick={() => {
                        handleModeChange("chat");
                        handleSendMessage(`Teach me more in-depth concepts about ${selectedModule.title}, specifically focusing on practical disaster response.`);
                      }}
                    >
                      <MessageSquare size={14} />
                      Deep Dive in Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
