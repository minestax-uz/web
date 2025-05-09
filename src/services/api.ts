import axios from "axios";

// Define the API URL
const API_URL = "http://localhost:3000";

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If there's no response, it's a network error
    if (!error.response) {
      console.error("Network error:", error);
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token, redirect to login
          console.log("No refresh token available, redirecting to login");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log("Attempting to refresh token...");

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        // Check if the response has the expected structure
        // The API returns data in the format { success: true, data: { accessToken: '...' } }
        if (response.data && response.data.success && response.data.data && response.data.data.accessToken) {
          const { accessToken } = response.data.data;
          console.log("Token refresh successful");

          // Store the new access token
          localStorage.setItem("accessToken", accessToken);

          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Also update the default headers for future requests
          api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error("Invalid response format from refresh token endpoint");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // If refresh fails, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Add a small delay before redirecting to avoid potential redirect loops
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export the API service
export default api;

// Auth API
export const authAPI = {
  login: (username: string, password: string) => api.post("/api/auth/login", { username, password }),
  refresh: (refreshToken: string) => api.post("/api/auth/refresh", { refreshToken }),
};

// Server API
export const serverAPI = {
  // Get server stats from Plan plugin
  getStats: (server: "anarxiya" | "survival" | "boxpvp" = "anarxiya") => api.get(`/api/${server}/statistics/`, { params: { range: 24 } }),
  getFullStats: (server: "anarxiya" | "survival" | "boxpvp" = "anarxiya") => api.get(`/api/${server}/statistics/server`),
};

// Statistics API
export const statisticsAPI = {
  // Anarxiya statistics
  getAnarxiyaServerStats: (range?: number) => api.get("/api/anarxiya/statistics/server", { params: { range } }),
  getAnarxiyaPlayerStats: (player: string, range?: number) => api.get(`/api/anarxiya/statistics/player/${player}`, { params: { range } }),
  // These endpoints don't exist yet - will be implemented later
  getAnarxiyaLeaderboard: (_type: string, _limit = 10) => Promise.resolve({ data: { data: [] } }),
  searchAnarxiyaPlayers: (_query: string) => Promise.resolve({ data: { data: [] } }),

  // Survival statistics
  getSurvivalServerStats: (range?: number) => api.get("/api/survival/statistics/server", { params: { range } }),
  getSurvivalPlayerStats: (player: string, range?: number) => api.get(`/api/survival/statistics/player/${player}`, { params: { range } }),
  // These endpoints don't exist yet - will be implemented later
  getSurvivalLeaderboard: (_type: string, _limit = 10) => Promise.resolve({ data: { data: [] } }),
  searchSurvivalPlayers: (_query: string) => Promise.resolve({ data: { data: [] } }),

  // Boxpvp statistics
  getBoxpvpServerStats: (range?: number) => api.get("/api/boxpvp/statistics/server", { params: { range } }),
  getBoxpvpPlayerStats: (player: string, range?: number) => api.get(`/api/boxpvp/statistics/player/${player}`, { params: { range } }),
  // These endpoints don't exist yet - will be implemented later
  getBoxpvpLeaderboard: (_type: string, _limit = 10) => Promise.resolve({ data: { data: [] } }),
  searchBoxpvpPlayers: (_query: string) => Promise.resolve({ data: { data: [] } }),
};

// Bans API
export const bansAPI = {
  getBans: (page = 1, search = "") => api.get("/api/bans", { params: { page, search } }),
  getBan: (id: number) => api.get(`/api/bans/${id}`),
  getBanProofs: (id: number) => api.get(`/api/bans/${id}/proofs`),
  getBanComments: (id: number) => api.get(`/api/bans/${id}/comments`),
  addBanProof: (data: any) => api.post("/api/bans/proof", data),
  uploadBanProof: (data: FormData, onUploadProgress: (progressEvent: any) => void) =>
    api.post("/api/bans/proof/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    }),
  deleteBanProof: (id: number) => api.delete(`/api/bans/proof/${id}`),
  addBanComment: (data: any) => api.post("/api/bans/comment", data),
  deleteBanComment: (id: number) => api.delete(`/api/bans/comment/${id}`),
};
