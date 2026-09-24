import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { playSuccessChime, playWarningBeep } from "../utils/audioAlert";

const ToastContext = createContext(null);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback(
    (id) => {
      clearTimer(id);

      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    },
    [clearTimer]
  );

  const clearAllToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...updates,
              updatedAt: Date.now(),
            }
          : toast
      )
    );
  }, []);

  const addToast = useCallback(
    ({
      title = "Notification",
      message = "",
      type = "info",
      duration = DEFAULT_DURATION,
      persistent = false,
      dismissible = true,
      sound = true,
      data = null,
      action = null,
    } = {}) => {
      const validTypes = ["info", "success", "warning", "error", "critical"];

      const normalizedType = validTypes.includes(type) ? type : "info";

      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const toast = {
        id,
        title,
        message,
        type: normalizedType,
        duration,
        persistent,
        dismissible,
        data,
        action,
        createdAt: Date.now(),
      };

      if (sound) {
        try {
          if (
            normalizedType === "warning" ||
            normalizedType === "critical" ||
            normalizedType === "error"
          ) {
            playWarningBeep();
          } else if (normalizedType === "success") {
            playSuccessChime();
          }
        } catch (error) {
          console.warn("Toast audio failed:", error);
        }
      }

      setToasts((prev) => [...prev, toast].slice(-MAX_TOASTS));

      if (!persistent && duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);

        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, options = {}) =>
      addToast({
        ...options,
        message,
        type: "success",
      }),
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) =>
      addToast({
        ...options,
        message,
        type: "info",
      }),
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) =>
      addToast({
        ...options,
        message,
        type: "warning",
      }),
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) =>
      addToast({
        ...options,
        message,
        type: "error",
      }),
    [addToast]
  );

  const critical = useCallback(
    (message, options = {}) =>
      addToast({
        ...options,
        message,
        type: "critical",
        persistent: true,
        duration: 0,
      }),
    [addToast]
  );

  const notify = useCallback(
    (options) => addToast(options),
    [addToast]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      notify,
      success,
      info,
      warning,
      error,
      critical,
      removeToast,
      updateToast,
      clearAllToasts,
      count: toasts.length,
      hasToasts: toasts.length > 0,
      hasCritical: toasts.some((toast) => toast.type === "critical"),
      hasWarnings: toasts.some(
        (toast) =>
          toast.type === "warning" ||
          toast.type === "critical" ||
          toast.type === "error"
      ),
    }),
    [
      toasts,
      addToast,
      notify,
      success,
      info,
      warning,
      error,
      critical,
      removeToast,
      updateToast,
      clearAllToasts,
    ]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }

  return context;
}

export default ToastContext;