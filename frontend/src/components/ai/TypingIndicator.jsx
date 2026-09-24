// frontend/src/components/ai/TypingIndicator.jsx

import { useRef, useEffect } from "react";
import { Bot } from "lucide-react";

function TypingIndicator() {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div className="ai-message" aria-live="polite" aria-label="AI is thinking" ref={ref}>
      <div className="ai-message-avatar assistant-avatar" aria-hidden="true">
        <Bot size={15} />
      </div>

      <div className="ai-typing-indicator">
        <div className="ai-typing-dots" aria-hidden="true">
          <div className="ai-typing-dot" />
          <div className="ai-typing-dot" />
          <div className="ai-typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
