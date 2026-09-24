import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "disaster_auth_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

const AuthContext = createContext(null);

/* ============================================================
   SESSION HELPERS
============================================================ */

const clearStoredSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear authentication session:", error);
  }
};

const getStoredSession = () => {
  try {
    const rawSession = sessionStorage.getItem(STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession);

    // Validate basic structure
    if (
      !session ||
      typeof session !== "object" ||
      !session.user ||
      !session.token
    ) {
      clearStoredSession();
      return null;
    }

    // Validate expiration
    if (
      session.expiresAt &&
      Number.isFinite(session.expiresAt) &&
      Date.now() >= session.expiresAt
    ) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Invalid stored authentication session:", error);
    clearStoredSession();
    return null;
  }
};

const saveSession = (user, token, expiresAt) => {
  try {
    const session = {
      user,
      token,
      expiresAt,
      createdAt: Date.now(),
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error("Failed to save authentication session:", error);
    return false;
  }
};

/* ============================================================
   AUTH PROVIDER
============================================================ */

export const AuthProvider = ({ children }) => {
  const expiryTimerRef = useRef(null);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const [error, setError] = useState(null);

  /* ==========================================================
     CLEAR EXPIRY TIMER
  ========================================================== */

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  /* ==========================================================
     CLEAR AUTH STATE
  ========================================================== */

  const clearSession = useCallback(() => {
    clearExpiryTimer();

    clearStoredSession();

    setUser(null);
    setToken(null);
    setError(null);
  }, [clearExpiryTimer]);

  /* ==========================================================
     CHECK SESSION EXPIRATION
  ========================================================== */

  const checkSession = useCallback(() => {
    const session = getStoredSession();

    if (!session) {
      clearSession();
      return false;
    }

    setUser(session.user);
    setToken(session.token);

    return true;
  }, [clearSession]);

  /* ==========================================================
     AUTOMATIC SESSION EXPIRATION
  ========================================================== */

  const scheduleSessionExpiry = useCallback(
    (expiresAt) => {
      clearExpiryTimer();

      if (!expiresAt) return;

      const remainingTime = expiresAt - Date.now();

      if (remainingTime <= 0) {
        clearSession();
        return;
      }

      expiryTimerRef.current = setTimeout(() => {
        clearSession();
        setError("Your session has expired. Please login again.");
      }, remainingTime);
    },
    [clearExpiryTimer, clearSession]
  );

  /* ==========================================================
     INITIALIZE AUTHENTICATION
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = getStoredSession();

        if (!mounted) return;

        if (session) {
          setUser(session.user);
          setToken(session.token);

          scheduleSessionExpiry(session.expiresAt);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Authentication initialization failed:", error);

        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearExpiryTimer();
    };
  }, [clearExpiryTimer, clearSession, scheduleSessionExpiry]);

  /* ==========================================================
     LOGIN
  ========================================================== */

  const login = useCallback(
    async (userData, authToken, customExpiry = null) => {
      setAuthLoading(true);
      setError(null);

      try {
        if (!userData) {
          throw new Error("User information is required.");
        }

        if (!authToken) {
          throw new Error("Authentication token is required.");
        }

        const expiresAt =
          customExpiry || Date.now() + SESSION_DURATION;

        const saved = saveSession(
          userData,
          authToken,
          expiresAt
        );

        if (!saved) {
          throw new Error(
            "Unable to securely save your authentication session."
          );
        }

        setUser(userData);
        setToken(authToken);

        scheduleSessionExpiry(expiresAt);

        return {
          success: true,
          user: userData,
          token: authToken,
          expiresAt,
        };
      } catch (loginError) {
        console.error("Login failed:", loginError);

        setError(
          loginError?.message ||
            "Login failed. Please try again."
        );

        clearSession();

        return {
          success: false,
          error:
            loginError?.message ||
            "Login failed. Please try again.",
        };
      } finally {
        setAuthLoading(false);
      }
    },
    [clearSession, scheduleSessionExpiry]
  );

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const logout = useCallback(async () => {
    setAuthLoading(true);

    try {
      /*
       * If your backend later provides:
       *
       * POST /api/auth/logout
       *
       * call it here before clearing the client session.
       */

      clearSession();

      return {
        success: true,
      };
    } catch (logoutError) {
      console.error("Logout failed:", logoutError);

      setError(
        logoutError?.message ||
          "Logout failed. Please try again."
      );

      return {
        success: false,
        error:
          logoutError?.message ||
          "Logout failed. Please try again.",
      };
    } finally {
      setAuthLoading(false);
    }
  }, [clearSession]);

  /* ==========================================================
     UPDATE USER
  ========================================================== */

  const updateUser = useCallback(
    (updatedData) => {
      if (!user) return;

      const updatedUser = {
        ...user,
        ...updatedData,
      };

      const session = getStoredSession();

      if (session) {
        saveSession(
          updatedUser,
          session.token,
          session.expiresAt
        );
      }

      setUser(updatedUser);
    },
    [user]
  );

  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* ==========================================================
     ROLE HELPERS
  ========================================================== */

  const hasRole = useCallback(
    (role) => {
      if (!user || !role) return false;

      const userRole = String(user.role || "").toLowerCase();

      return userRole === String(role).toLowerCase();
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles = []) => {
      if (!user || !Array.isArray(roles)) {
        return false;
      }

      const userRole = String(user.role || "").toLowerCase();

      return roles.some(
        (role) =>
          String(role).toLowerCase() === userRole
      );
    },
    [user]
  );

  /* ==========================================================
     COMMON ROLE FLAGS
  ========================================================== */

  const isAdmin = useMemo(
    () => hasRole("admin"),
    [hasRole]
  );

  const isCitizen = useMemo(
    () => hasRole("citizen"),
    [hasRole]
  );

  const isResponder = useMemo(
    () => hasRole("responder"),
    [hasRole]
  );

  const isAuthority = useMemo(
    () => hasRole("authority"),
    [hasRole]
  );

  /* ==========================================================
     SESSION INFORMATION
  ========================================================== */

  const sessionInfo = useMemo(() => {
    const session = getStoredSession();

    if (!session) {
      return {
        expiresAt: null,
        createdAt: null,
        remainingTime: 0,
      };
    }

    return {
      expiresAt: session.expiresAt || null,
      createdAt: session.createdAt || null,
      remainingTime: session.expiresAt
        ? Math.max(0, session.expiresAt - Date.now())
        : 0,
    };
  }, [user, token]);

  /* ==========================================================
     AUTHENTICATION STATUS
  ========================================================== */

  const isAuthenticated = Boolean(user && token);

  /* ==========================================================
     RECHECK SESSION WHEN TAB BECOMES ACTIVE
  ========================================================== */

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    const handleFocus = () => {
      checkSession();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", handleFocus);
    };
  }, [checkSession]);

  /* ==========================================================
     CROSS-TAB / WINDOW SYNC
     
     NOTE:
     sessionStorage is intentionally tab-scoped.
     The browser "storage" event is mainly useful if you
     later migrate this to localStorage.
  ========================================================== */

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const session = getStoredSession();

      if (!session) {
        setUser(null);
        setToken(null);
        clearExpiryTimer();
        return;
      }

      setUser(session.user);
      setToken(session.token);

      scheduleSessionExpiry(session.expiresAt);
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
  }, [
    clearExpiryTimer,
    scheduleSessionExpiry,
  ]);

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const contextValue = useMemo(
    () => ({
      // User
      user,
      updateUser,

      // Token
      token,

      // Authentication
      login,
      logout,
      clearSession,

      // Status
      loading,
      authLoading,
      isAuthenticated,

      // Errors
      error,
      clearError,

      // Roles
      hasRole,
      hasAnyRole,

      // Common roles
      isAdmin,
      isCitizen,
      isResponder,
      isAuthority,

      // Session
      sessionInfo,

      // Utility
      checkSession,
    }),
    [
      user,
      updateUser,
      token,
      login,
      logout,
      clearSession,
      loading,
      authLoading,
      isAuthenticated,
      error,
      clearError,
      hasRole,
      hasAnyRole,
      isAdmin,
      isCitizen,
      isResponder,
      isAuthority,
      sessionInfo,
      checkSession,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/* ============================================================
   AUTH HOOK
============================================================ */

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};