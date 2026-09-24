// frontend/src/components/ai/LearningSidebar.jsx

import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  MessageSquare,
  Plus,
  Zap,
} from "lucide-react";

const LEARNING_LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const MODES = [
  { id: "chat", label: "AI Chat", icon: MessageSquare, desc: "Ask anything" },
  { id: "study", label: "Study Mode", icon: BookOpen, desc: "Structured learning" },
];

const SUGGESTED_PROMPTS = [
  "What is flash flooding?",
  "Explain landslide risk assessment",
  "How does soil moisture affect landslide probability?",
  "What are early warning systems?",
  "Explain slope stability analysis",
  "How does rainfall affect flood risk?",
  "What is the Sendai Framework?",
  "Explain IoT sensors in disaster management",
  "What is disaster risk reduction?",
  "How does a command center operate during a flood?",
];

function LearningSidebar({
  learningLevel,
  onLevelChange,
  sessionType,
  onModeChange,
  onNewSession,
  onPromptSelect,
}) {
  return (
    <aside className="ai-sidebar" aria-label="Learning assistant navigation">
      {/* Brand header */}
      <div className="ai-sidebar-header">
        <div className="ai-sidebar-brand">
          <div className="ai-sidebar-brand-icon" aria-hidden="true">
            <BrainCircuit size={17} />
          </div>
          <div className="ai-sidebar-brand-text">
            <strong>AI Learning Lab</strong>
            <span>GeoNexus · Disaster Ed.</span>
          </div>
        </div>

        <button
          type="button"
          className="ai-new-session-btn"
          onClick={onNewSession}
          aria-label="Start new learning session"
        >
          <Plus size={14} />
          New Session
        </button>
      </div>

      {/* Learning level */}
      <div className="ai-sidebar-section" style={{ paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
        <span className="ai-sidebar-section-title">Learning Level</span>
        <div className="ai-level-selector" role="group" aria-label="Select learning level">
          {LEARNING_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              className={`ai-level-btn${learningLevel === level.id ? " active" : ""}`}
              onClick={() => onLevelChange(level.id)}
              aria-pressed={learningLevel === level.id}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="ai-sidebar-section" style={{ paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
        <span className="ai-sidebar-section-title">Mode</span>
        <div className="ai-mode-selector" role="group" aria-label="Select learning mode">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                className={`ai-mode-btn${sessionType === mode.id ? " active" : ""}`}
                onClick={() => onModeChange(mode.id)}
                aria-pressed={sessionType === mode.id}
                title={mode.desc}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="ai-suggested-prompts-sidebar" aria-label="Suggested learning prompts">
        <span className="ai-sidebar-section-title" style={{ display: "block", padding: "0 0 8px" }}>
          <Zap size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} aria-hidden="true" />
          Quick Prompts
        </span>

        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ai-prompt-chip"
            onClick={() => onPromptSelect(prompt)}
            aria-label={`Ask: ${prompt}`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Footer badge */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GraduationCap size={12} style={{ color: "var(--primary)" }} aria-hidden="true" />
          <span style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
            Powered by Google Gemini
          </span>
        </div>
      </div>
    </aside>
  );
}

export default LearningSidebar;
