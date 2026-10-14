import { Moon, Sun } from "lucide-react";

import { useTheme } from "../context/ThemeContext.jsx";
import "../styles/ThemeToggle.css";

function ThemeToggle({ variant = "default" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`theme-switcher theme-switcher--${variant}`}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        className={`theme-switcher-option ${!isDark ? "active" : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label="Use bright theme"
        title="Bright theme"
      >
        <Sun size={16} aria-hidden="true" />
        <span>Bright</span>
      </button>
      <button
        type="button"
        className={`theme-switcher-option ${isDark ? "active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label="Use dark theme"
        title="Dark theme"
      >
        <Moon size={16} aria-hidden="true" />
        <span>Dark</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
