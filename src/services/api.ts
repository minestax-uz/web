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
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;

        // Store the new access token
        localStorage.setItem("accessToken", accessToken);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
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
  getStats: () => api.get("/api/server/stats"),
  getPlayers: (search = "") => api.get("/api/server/players", { params: { search } }),
};

// Players API
export const playersAPI = {
  getPlayers: (page = 1, search = "") => api.get("/api/players", { params: { page, search } }),
  getPlayer: (username: string) => api.get(`/api/players/${username}`),
};

// Statistics API
export const statisticsAPI = {
  // Anarxiya statistics
  getAnarxiyaServerStats: (range?: number) => api.get("/api/anarxiya/statistics/server", { params: { range } }),
  getAnarxiyaPlayerStats: (player: string, range?: number) => api.get("/api/anarxiya/statistics/player", { params: { player, range } }),
  getAnarxiyaLeaderboard: (type: string, limit = 10) => api.get("/api/anarxiya/statistics/leaderboard", { params: { type, limit } }),
  searchAnarxiyaPlayers: (query: string) => api.get(`/api/anarxiya/statistics/search/${query}`),

  // Anarxiya Plan plugin statistics
  getAnarxiyaPlanServerStats: () => api.get("/api/anarxiya/statistics/plan/server"),
  getAnarxiyaPlanPlayerStats: (username: string) => api.get(`/api/anarxiya/statistics/plan/player/${username}`),

  // Survival statistics
  getSurvivalServerStats: (range?: number) => api.get("/api/survival/statistics/server", { params: { range } }),
  getSurvivalPlayerStats: (player: string, range?: number) => api.get("/api/survival/statistics/player", { params: { player, range } }),
  getSurvivalLeaderboard: (type: string, limit = 10) => api.get("/api/survival/statistics/leaderboard", { params: { type, limit } }),
  searchSurvivalPlayers: (query: string) => api.get(`/api/survival/statistics/search/${query}`),

  // Survival Plan plugin statistics
  getSurvivalPlanServerStats: () => api.get("/api/survival/statistics/plan/server"),
  getSurvivalPlanPlayerStats: (username: string) => api.get(`/api/survival/statistics/plan/player/${username}`),

  // Boxpvp statistics
  getBoxpvpServerStats: (range?: number) => api.get("/api/boxpvp/statistics/server", { params: { range } }),
  getBoxpvpPlayerStats: (player: string, range?: number) => api.get("/api/boxpvp/statistics/player", { params: { player, range } }),
  getBoxpvpLeaderboard: (type: string, limit = 10) => api.get("/api/boxpvp/statistics/leaderboard", { params: { type, limit } }),
  searchBoxpvpPlayers: (query: string) => api.get(`/api/boxpvp/statistics/search/${query}`),

  // Boxpvp Plan plugin statistics
  getBoxpvpPlanServerStats: () => api.get("/api/boxpvp/statistics/plan/server"),
  getBoxpvpPlanPlayerStats: (username: string) => api.get(`/api/boxpvp/statistics/plan/player/${username}`),
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

// Staff API
export const staffAPI = {
  getPermissions: (username: string, server: "anarxiya" | "survival" | "boxpvp") => api.get(`/api/${server}/permissions/${username}`),
  addPermission: (username: string, permission: string, server: "anarxiya" | "survival" | "boxpvp") => api.post(`/api/${server}/permissions/${username}/${permission}`),
};
