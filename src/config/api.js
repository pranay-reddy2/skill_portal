// frontend/src/config/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
    SESSIONS: `${API_BASE_URL}/auth/sessions`,
    REVOKE_SESSION: (sessionId) => `${API_BASE_URL}/auth/sessions/${sessionId}`,
  },

  WORKER: {
    GET_ALL: `${API_BASE_URL}/worker`,
    GET_ONE: (id) => `${API_BASE_URL}/worker/${id}`,
    UPLOAD_PHOTO: `${API_BASE_URL}/worker/upload-photo`,
    GENERATE_CARD: `${API_BASE_URL}/worker/generate-card`,
    UPDATE: (id) => `${API_BASE_URL}/worker/${id}`,
    FLAG: (id) => `${API_BASE_URL}/worker/${id}/flag`,
    ENDORSEMENT: (id) => `${API_BASE_URL}/worker/${id}/endorsement`,
    HISTORY: (id) => `${API_BASE_URL}/worker/${id}/history`,
  },

  CUSTOMER: {
    SAVE_PROFILE: `${API_BASE_URL}/customer/save`,
  },
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to make authenticated requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    ...options.headers,
  };

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle token expiration
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.code === "TOKEN_EXPIRED") {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request with new token
        return fetchWithAuth(url, options);
      } else {
        clearAuthData();
        window.location.href = "/";
        throw new Error("Session expired. Please login again.");
      }
    }
  }

  return response;
};

// Function to refresh access token
export const refreshAccessToken = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access) {
        localStorage.setItem("token", data.access);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
};

// Function to save user data to localStorage
export const saveAuthData = (accessToken, user) => {
  localStorage.setItem("token", accessToken);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("user", JSON.stringify(user));
};

// Function to get user data from localStorage
export const getUserData = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("user");
};

export default API_BASE_URL;
