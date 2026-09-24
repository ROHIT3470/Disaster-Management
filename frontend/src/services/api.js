import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getStoredToken = () => {
  try {
    const rawSession = sessionStorage.getItem("disaster_auth_session");
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    if (session?.expiresAt && Date.now() > Number(session.expiresAt)) {
      sessionStorage.removeItem("disaster_auth_session");
      return null;
    }

    return session?.token ?? null;
  } catch (error) {
    console.error("Failed to read authentication session:", error);
    sessionStorage.removeItem("disaster_auth_session");
    return null;
  }
};

API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("API Error: Backend server not responding.");
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export const getSensors = () => API.get("/sensors");
export const createSensor = (data) => API.post("/sensors", data);
export const deleteSensor = (sensorId) => API.delete(`/sensors/${sensorId}`);
export const getWeather = () => API.get("/weather");
export const getAlerts = () => API.get("/alerts");
export const getPredictions = () => API.get("/risk");
export const predictRisk = (data) => API.post("/risk/predict", data);
export const getDisasters = () => API.get("/disasters");
export const getLocations = () => API.get("/locations");
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const requestPasswordReset = (data) => API.post("/auth/forgot-password", data);
export const resetUserPassword = ({ token, password }) => {
  const encodedToken = encodeURIComponent(token || "");

  if (!encodedToken) {
    return API.post("/auth/reset-password", { password });
  }

  return API.post(`/auth/reset-password/${encodedToken}`, { password });
};
export const submitContactMessage = (data) => API.post("/contact", data);

export const sendAIMessage = (data) => API.post("/ai/chat", data);
export const getAISession = () => API.get("/ai/session");
export const clearAISession = () => API.delete("/ai/session");
export const updateAISession = (data) => API.patch("/ai/session", data);
export const runAIEmergencyAgent = (data) => API.post("/ai/emergency", data);
export const getAIStudyModules = () => API.get("/ai/study-modules");
export const getAIProjectContext = () => API.get("/ai/project-context");

export default API;