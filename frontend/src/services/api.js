import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://tracked-app-production.up.railway.app/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;

    // If 401/403 and we haven't retried yet, try to refresh token
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/token/`, {
      username,
      password,
    });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },

  signup: async (username, password, email) => {
    const response = await axios.post(`${API_BASE_URL}/core/signup/`, {
      username,
      password,
      email,
    });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },

  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

// Core APIs
export const coreAPI = {
  getUserCount: async () => {
    const response = await api.get('/core/users/count/');
    return response.data;
  },
};

// Tracker APIs
export const trackerAPI = {
  // Get month view (main Excel-like grid)
  getMonthView: async (year, month) => {
    const response = await api.get(`/tracker/month/${year}/${month}/`);
    return response.data;
  },

  // List all trackers
  listTrackers: async () => {
    const response = await api.get('/tracker/trackers/');
    return response.data;
  },

  // Create custom tracker
  createTracker: async (trackerData) => {
    const response = await api.post('/tracker/trackers/create/', trackerData);
    return response.data;
  },

  // Update tracker
  updateTracker: async (id, trackerData) => {
    const response = await api.put(`/tracker/trackers/${id}/`, trackerData);
    return response.data;
  },

  // Delete tracker
  deleteTracker: async (id) => {
    const response = await api.delete(`/tracker/trackers/${id}/delete/`);
    return response.data;
  },
};

// Entry APIs
export const entryAPI = {
  // Create or update entry
  saveEntry: async (entryData) => {
    const response = await api.post('/tracker/entries/create/', entryData);
    return response.data;
  },

  // Delete entry
  deleteEntry: async (id) => {
    const response = await api.delete(`/tracker/entries/${id}/delete/`);
    return response.data;
  },
};

// Insights APIs
export const insightsAPI = {
  getLatest: async () => {
    const response = await api.get('/insights/latest/');
    return response.data;
  },

  getHistory: async (limit = 10) => {
    const response = await api.get('/insights/history/', {
      params: { limit },
    });
    return response.data;
  },

  generate: async () => {
    const response = await api.post('/insights/generate/');
    return response.data;
  },
};

export default api;
