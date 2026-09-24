import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ============================================================
// THEME CONFIGURATION
// ============================================================

const STORAGE_KEY = "dm_theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const THEME_PALETTE = {
  light: {
    primary: "#2563eb",
    primaryStrong: "#1d4ed8",
    primarySoft: "#eff6ff",
    secondary: "#10b981",
    secondaryStrong: "#059669",
    secondarySoft: "#ecfdf5",
    background: "#f4f9ff",
    backgroundAlt: "#edf6ff",
    surface: "#ffffff",
    surfaceStrong: "#f8fbff",
    surfaceMuted: "#eef6ff",
    text: "#0f172a",
    textSecondary: "#475569",
    border: "rgba(148, 163, 184, 0.3)",
    shadow: "0 24px 64px rgba(37, 99, 235, 0.12)",
  },
  dark: {
    primary: "#60a5fa",
    primaryStrong: "#93c5fd",
    primarySoft: "#172554",
    secondary: "#34d399",
    secondaryStrong: "#6ee7b7",
    secondarySoft: "#052e2b",
    background: "#06131f",
    backgroundAlt: "#0d1b2a",
    surface: "#0f172a",
    surfaceStrong: "#111f36",
    surfaceMuted: "#142033",
    text: "#e2e8f0",
    textSecondary: "#cbd5e1",
    border: "rgba(148, 163, 184, 0.22)",
    shadow: "0 24px 64px rgba(2, 6, 23, 0.52)",
  },
};

const VALID_THEMES = Object.values(THEMES);

// ============================================================
// THEME CONTEXT
// ============================================================

const ThemeContext = createContext(null);

// ============================================================
// SAFE LOCAL STORAGE HELPERS
// ============================================================

const getStoredTheme = () => {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY);

    if (VALID_THEMES.includes(storedTheme)) {
      return storedTheme;
    }

    return THEMES.LIGHT;
  } catch (error) {
    console.warn("Theme storage unavailable:", error);
    return THEMES.LIGHT;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Unable to save theme preference:", error);
  }
};

// ============================================================
// GET SYSTEM THEME
// ============================================================

const getSystemTheme = () => {
  if (typeof window === "undefined") {
    return THEMES.DARK;
  }

  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

// ============================================================
// GET ACTUAL ACTIVE THEME
// ============================================================

const getResolvedTheme = (theme) => {
  if (theme === THEMES.SYSTEM) {
    return getSystemTheme();
  }

  return theme;
};

// ============================================================
// THEME PROVIDER
// ============================================================

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getResolvedTheme(theme)
  );

  // ==========================================================
  // APPLY THEME TO DOCUMENT
  // ==========================================================

  const applyTheme = useCallback((selectedTheme) => {
    const root = document.documentElement;
    const body = document.body;

    const activeTheme = getResolvedTheme(selectedTheme);

    // --------------------------------------------------------
    // HTML ATTRIBUTES
    // --------------------------------------------------------

    root.setAttribute("data-theme", activeTheme);
    root.setAttribute("data-theme-preference", selectedTheme);

    // --------------------------------------------------------
    // DARK CLASS
    // --------------------------------------------------------

    root.classList.toggle("dark", activeTheme === THEMES.DARK);

    // --------------------------------------------------------
    // BODY CLASS
    // --------------------------------------------------------

    body.classList.toggle("theme-dark", activeTheme === THEMES.DARK);
    body.classList.toggle("theme-light", activeTheme === THEMES.LIGHT);

    // --------------------------------------------------------
    // COLOR SCHEME
    // Helps browser-native UI follow the theme
    // --------------------------------------------------------

    root.style.colorScheme = activeTheme;

    // --------------------------------------------------------
    // META THEME COLOR
    // --------------------------------------------------------

    let metaThemeColor = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.content =
      activeTheme === THEMES.DARK ? "#07111f" : "#f8fafc";

    // --------------------------------------------------------
    // UPDATE STATE
    // --------------------------------------------------------

    setResolvedTheme(activeTheme);
  }, []);

  // ==========================================================
  // INITIAL THEME APPLICATION
  // ==========================================================

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // ==========================================================
  // SYSTEM THEME LISTENER
  // ==========================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      if (theme === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM);
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, [theme, applyTheme]);

  // ==========================================================
  // CHANGE THEME
  // ==========================================================

  const setTheme = useCallback(
    (newTheme) => {
      if (!VALID_THEMES.includes(newTheme)) {
        console.warn(`Invalid theme: ${newTheme}`);
        return;
      }

      saveTheme(newTheme);
      setThemeState(newTheme);
    },
    []
  );

  // ==========================================================
  // TOGGLE LIGHT / DARK
  // ==========================================================

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const currentResolvedTheme = getResolvedTheme(currentTheme);

      const nextTheme =
        currentResolvedTheme === THEMES.DARK
          ? THEMES.LIGHT
          : THEMES.DARK;

      saveTheme(nextTheme);

      return nextTheme;
    });
  }, []);

  // ==========================================================
  // RESET TO SYSTEM
  // ==========================================================

  const useSystemTheme = useCallback(() => {
    setTheme(THEMES.SYSTEM);
  }, [setTheme]);

  // ==========================================================
  // CHECK CURRENT THEME
  // ==========================================================

  const isDark = resolvedTheme === THEMES.DARK;
  const isLight = resolvedTheme === THEMES.LIGHT;
  const isSystem = theme === THEMES.SYSTEM;

  // ==========================================================
  // CROSS-TAB SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY) return;

      if (VALID_THEMES.includes(event.newValue)) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  // ==========================================================
  // MEMOIZED CONTEXT
  // ==========================================================

  const value = useMemo(
    () => ({
      // Current user preference
      theme,

      // Actual active theme
      resolvedTheme,

      // Theme states
      isDark,
      isLight,
      isSystem,

      // Theme actions
      setTheme,
      toggleTheme,
      useSystemTheme,

      // Available themes
      themes: THEMES,
    }),
    [
      theme,
      resolvedTheme,
      isDark,
      isLight,
      isSystem,
      setTheme,
      toggleTheme,
      useSystemTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOK
// ============================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside a ThemeProvider"
    );
  }

  return context;
};