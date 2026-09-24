// frontend/src/components/ai/AIMessage.jsx

// Renders a single chat message (user or assistant).
// Provides simple markdown rendering without requiring a new library.

import { useState, useCallback } from "react";
import {
  Bot,
  User,
  Copy,
  CheckCheck,
  ExternalLink,
  Radio,
} from "lucide-react";

/* ============================================================
   SIMPLE MARKDOWN RENDERER
   Handles the patterns Gemini typically returns.
   ============================================================ */

function renderMarkdown(text) {
  if (!text) return [];

  const lines = text.split("\n");
  const elements = [];

  let listBuffer = [];
  let orderedBuffer = [];
  let inCodeBlock = false;
  let codeLines = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`}>
          {listBuffer.map((item, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{
                __html: inlineFormat(item),
              }}
            />
          ))}
        </ul>,
      );

      listBuffer = [];
    }

    if (orderedBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${key++}`}>
          {orderedBuffer.map((item, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{
                __html: inlineFormat(item),
              }}
            />
          ))}
        </ol>,
      );

      orderedBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /* --------------------------------------------------------
       CODE BLOCK
       -------------------------------------------------------- */

    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeLines = [];
      } else {
        inCodeBlock = false;

        elements.push(
          <pre
            key={`pre-${key++}`}
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
              overflow: "auto",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
      }

      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    /* --------------------------------------------------------
       HEADINGS
       -------------------------------------------------------- */

    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);

    if (h1) {
      flushList();

      elements.push(
        <h1
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(h1[1]),
          }}
        />,
      );

      continue;
    }

    if (h2) {
      flushList();

      elements.push(
        <h2
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(h2[1]),
          }}
        />,
      );

      continue;
    }

    if (h3) {
      flushList();

      elements.push(
        <h3
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(h3[1]),
          }}
        />,
      );

      continue;
    }

    /* --------------------------------------------------------
       HORIZONTAL RULE
       -------------------------------------------------------- */

    if (/^-{3,}$/.test(line.trim())) {
      flushList();

      elements.push(<hr key={key++} />);

      continue;
    }

    /* --------------------------------------------------------
       BLOCKQUOTE
       -------------------------------------------------------- */

    if (line.startsWith("> ")) {
      flushList();

      elements.push(
        <blockquote
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(line.slice(2)),
          }}
        />,
      );

      continue;
    }

    /* --------------------------------------------------------
       UNORDERED LIST
       -------------------------------------------------------- */

    const uMatch = line.match(/^[-*+] (.+)/);

    if (uMatch) {
      if (orderedBuffer.length > 0) {
        flushList();
      }

      listBuffer.push(uMatch[1]);

      continue;
    }

    /* --------------------------------------------------------
       ORDERED LIST
       -------------------------------------------------------- */

    const oMatch = line.match(/^\d+\.\s+(.+)/);

    if (oMatch) {
      if (listBuffer.length > 0) {
        flushList();
      }

      orderedBuffer.push(oMatch[1]);

      continue;
    }

    /* --------------------------------------------------------
       EMPTY LINE
       -------------------------------------------------------- */

    if (line.trim() === "") {
      flushList();
      continue;
    }

    /* --------------------------------------------------------
       PARAGRAPH
       -------------------------------------------------------- */

    flushList();

    elements.push(
      <p
        key={key++}
        dangerouslySetInnerHTML={{
          __html: inlineFormat(line),
        }}
      />,
    );
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre
        key={`pre-${key++}`}
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          overflow: "auto",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
  }

  flushList();

  return elements;
}

/* ============================================================
   INLINE MARKDOWN
   ============================================================ */

function inlineFormat(text) {
  if (!text) return "";

  let formatted = String(text);

  // Escape HTML first to prevent raw HTML injection.
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Bold
  formatted = formatted.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>",
  );

  // Italic
  formatted = formatted.replace(
    /(?<!\*)\*([^*]+?)\*(?!\*)/g,
    "<em>$1</em>",
  );

  // Inline code
  formatted = formatted.replace(
    /`([^`]+)`/g,
    "<code>$1</code>",
  );

  return formatted;
}

/* ============================================================
   VISUAL EXTRACTION
   ============================================================ */

function extractVisuals(message) {
  const visuals = Array.isArray(message.visuals)
    ? message.visuals
    : Array.isArray(message.images)
      ? message.images
      : [];

  const markdownImages = [];

  const content =
    typeof message.content === "string"
      ? message.content
      : "";

  const imagePattern =
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    markdownImages.push({
      url: match[2],
      alt: match[1] || "AI visual reference",
      source: "response",
    });
  }

  return [...visuals, ...markdownImages]
    .map((visual) => {
      if (typeof visual === "string") {
        return {
          url: visual,
        };
      }

      return visual;
    })
    .filter(
      (visual) =>
        visual?.url ||
        visual?.src ||
        visual?.prompt,
    );
}

/* ============================================================
   VISUAL OUTPUT
   ============================================================ */

function VisualOutput({ visual }) {
  const imageUrl = visual.url || visual.src;

  const isLive =
    visual.type === "live" ||
    visual.live === true;

  if (!imageUrl) {
    return (
      <div className="ai-visual-placeholder">
        <div className="ai-visual-placeholder-icon">
          <Radio size={16} />
        </div>

        <div>
          <strong>Live visual requested</strong>

          <span>
            {visual.prompt ||
              "A visual asset was requested but is not available yet."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <figure className="ai-visual-output">
      <div className="ai-visual-image-wrap">
        <img
          src={imageUrl}
          alt={
            visual.alt ||
            visual.caption ||
            "AI disaster-management visual"
          }
          loading="lazy"
          onError={(event) => {
            event.currentTarget
              .closest(".ai-visual-output")
              ?.classList.add("is-unavailable");
          }}
        />

        {isLive && (
          <span className="ai-visual-live-badge">
            <span className="ai-visual-live-dot" />
            Live visual
          </span>
        )}
      </div>

      {(visual.caption || visual.source) && (
        <figcaption>
          <span>
            {visual.caption || "Visual response"}
          </span>

          {visual.source && (
            <small>{visual.source}</small>
          )}
        </figcaption>
      )}

      <a
        className="ai-visual-open-link"
        href={imageUrl}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={12} />
        Open full image
      </a>
    </figure>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

function AIMessage({ message, onRetry }) {
  const [copied, setCopied] = useState(false);

  const isUser = message?.role === "user";
  const isAssistant = message?.role === "assistant";

  const visuals = isAssistant
    ? extractVisuals(message)
    : [];

  const content =
    typeof message?.content === "string"
      ? message.content
      : "";

  const cleanContent = content
    .replace(
      /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
      "",
    )
    .trim();

  const formattedTime = message?.timestamp
    ? new Date(message.timestamp).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        },
      )
    : "";

  const handleCopy = useCallback(() => {
    if (!navigator.clipboard || !content) return;

    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1800);
      })
      .catch(() => {
        setCopied(false);
      });
  }, [content]);

  return (
    <div
      className={`ai-message ${
        isUser ? "user-message" : ""
      }`}
      role="article"
      aria-label={
        isUser
          ? "Your message"
          : "Assistant response"
      }
    >
      {/* Avatar */}
      <div
        className={`ai-message-avatar ${
          isUser
            ? "user-avatar"
            : "assistant-avatar"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User size={14} />
        ) : (
          <Bot size={15} />
        )}
      </div>

      {/* Content */}
      <div className="ai-message-content">
        <div
          className={`ai-message-bubble ${
            isUser
              ? "user-bubble"
              : "assistant-bubble"
          }`}
        >
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>
              {content}
            </span>
          ) : (
            <div className="ai-markdown">
              {renderMarkdown(cleanContent)}

              {visuals.length > 0 && (
                <div
                  className="ai-visual-output-grid"
                  aria-label="Visual response outputs"
                >
                  {visuals.map((visual, index) => (
                    <VisualOutput
                      key={`${
                        visual.url ||
                        visual.prompt ||
                        "visual"
                      }-${index}`}
                      visual={visual}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="ai-message-meta">
          {formattedTime && (
            <time
              className="ai-message-time"
              dateTime={message.timestamp}
            >
              {formattedTime}
            </time>
          )}

          {isAssistant && (
            <div
              className="ai-message-actions"
              role="group"
              aria-label="Message actions"
            >
              <button
                type="button"
                className="ai-message-action-btn"
                onClick={handleCopy}
                aria-label={
                  copied
                    ? "Copied"
                    : "Copy response"
                }
                title={
                  copied
                    ? "Copied!"
                    : "Copy"
                }
              >
                {copied ? (
                  <CheckCheck size={12} />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIMessage;