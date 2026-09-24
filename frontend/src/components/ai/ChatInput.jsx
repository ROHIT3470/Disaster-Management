// frontend/src/components/ai/ChatInput.jsx

import { useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";

const MAX_CHARS = 2000;

function ChatInput({ onSend, disabled, placeholder }) {
  const textareaRef = useRef(null);
  const valueRef = useRef("");

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    valueRef.current = textareaRef.current?.value ?? "";
    autoResize();
    // Force re-render to update char count display
    textareaRef.current?.dispatchEvent(new Event("input-updated"));
  }, [autoResize]);

  const handleSend = useCallback(() => {
    const val = textareaRef.current?.value?.trim();
    if (!val || disabled) return;
    onSend(val);
    textareaRef.current.value = "";
    valueRef.current = "";
    autoResize();
  }, [onSend, disabled, autoResize]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Track char count without React state to avoid re-renders on every keystroke
  const charCountRef = useRef(null);
  const handleInputWithCount = useCallback(
    (e) => {
      handleInput();
      const len = e.target.value.length;
      if (charCountRef.current) {
        charCountRef.current.textContent = `${len} / ${MAX_CHARS}`;
        charCountRef.current.className =
          `ai-char-count${len > MAX_CHARS * 0.85 ? " warn" : ""}`;
      }
    },
    [handleInput],
  );

  return (
    <form className="ai-input-area" onSubmit={handleSubmit}>
      <div className="ai-input-wrapper">
        <textarea
          ref={textareaRef}
          className="ai-textarea"
          placeholder={
            placeholder ||
            "Ask about disaster management, risk assessment, early warning systems…"
          }
          disabled={disabled}
          rows={1}
          maxLength={MAX_CHARS}
          onInput={handleInputWithCount}
          onKeyDown={handleKeyDown}
          aria-label="Message to AI Learning Assistant"
          aria-multiline="true"
          aria-disabled={disabled}
        />

        <button
          type="button"
          className="ai-send-btn"
          onClick={handleSend}
          disabled={disabled}
          aria-label="Send message"
          title="Send (Enter)"
        >
          <Send size={15} />
        </button>
      </div>

      <div className="ai-input-footer">
        <span className="ai-input-hint">
          Enter to send · Shift+Enter for new line
        </span>
        <span ref={charCountRef} className="ai-char-count">
          0 / {MAX_CHARS}
        </span>
      </div>
    </form>
  );
}

export default ChatInput;
