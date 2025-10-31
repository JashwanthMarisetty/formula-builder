import axios from 'axios';

// Create axios instance with base configuration (no interceptors)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


// Manual authentication utilities
const authUtils = {
  // Manually handle token refresh
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('formula_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/users/refresh-token',
        { refreshToken }
      );
      
      const { token, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('formula_token', token);
      localStorage.setItem('formula_refresh_token', newRefreshToken);
      
      return { token, refreshToken: newRefreshToken };
    } catch (error) {
      // Refresh failed, clear tokens and redirect
      authUtils.clearAuth();
      window.location.href = '/login';
      throw error;
    }
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('formula_token');
    localStorage.removeItem('formula_refresh_token');
    localStorage.removeItem('formula_user');
  }
};

// Helper function to get token from localStorage
const getToken = () => {
  return localStorage.getItem('formula_token');
};

// Auth API calls (no interceptors - manual handling)
export const authAPI = {
  register: async (userData) => {
    // Registration doesn't require auth token
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    // Login doesn't require auth token
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  logout: async () => {
    // Use authUtils to clear authentication data
    authUtils.clearAuth();
  },

  refreshToken: async (refreshToken) => {
    // Refresh token endpoint doesn't require auth token
    const response = await api.post('/users/refresh-token', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    const token = getToken();
    try {
      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  forgotPassword: async (email) => {
    // Forgot password doesn't require auth token
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData) => {
    // Reset password doesn't require auth token
    const response = await api.post('/users/reset-password', resetData);
    return response.data;
  },

  googleSignIn: async (googleUserData) => {
    // Google sign-in doesn't require auth token
    const response = await api.post('/users/google-signin', googleUserData);
    return response.data;
  },

  // OTP
  sendOtp: async (email) => {
    const response = await api.post('/users/send-otp', { email });
    return response.data;
  },
  verifyOtp: async (email, code) => {
    const response = await api.post('/users/verify-otp', { email, code });
    return response.data;
  },
};

// Form API calls with explicit authorization headers
export const formAPI = {
  // Create a new form (requires authentication)
  createForm: async (formData) => {
    const token = getToken();
    try {
      const response = await api.post('/forms', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.post('/forms', formData, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Get all forms for the authenticated user (requires authentication)
  getAllForms: async (params = {}) => {
    const token = getToken();
    try {
      const response = await api.get('/forms', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.get('/forms', {
            headers: { Authorization: `Bearer ${newToken}` },
            params
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Get a specific form by ID (requires authentication)
  getFormById: async (formId) => {
    const token = getToken();
    try {
      const response = await api.get(`/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.get(`/forms/${formId}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Get a public form (no auth required)
  getPublicForm: async (formId) => {
    const response = await api.get(`/forms/public/${formId}`);
    return response.data;
  },

  // Update a form (requires authentication)
  updateForm: async (formId, formData) => {
    const token = getToken();
    try {
      const response = await api.put(`/forms/${formId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.put(`/forms/${formId}`, formData, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Delete a form (requires authentication)
  deleteForm: async (formId) => {
    const token = getToken();
    try {
      const response = await api.delete(`/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.delete(`/forms/${formId}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Submit a response to a form (no auth required - public endpoint)
  submitFormResponse: async (formId, responseData) => {
    const response = await api.post(`/forms/${formId}/submit`, responseData);
    return response.data;
  },

  // Get all responses for a form (requires authentication)
  getFormResponses: async (formId, params = {}) => {
    const token = getToken();
    try {
      const response = await api.get(`/forms/${formId}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.get(`/forms/${formId}/responses`, {
            headers: { Authorization: `Bearer ${newToken}` },
            params
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Get a single response by ID (requires authentication)
  getResponseById: async (formId, responseId) => {
    const token = getToken();
    try {
      const response = await api.get(`/forms/${formId}/responses/${responseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.get(`/forms/${formId}/responses/${responseId}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },

  // Delete a specific response (requires authentication)
  deleteResponse: async (formId, responseId) => {
    const token = getToken();
    try {
      const response = await api.delete(`/forms/${formId}/responses/${responseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authUtils.refreshToken();
          const newToken = getToken();
          const response = await api.delete(`/forms/${formId}/responses/${responseId}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          return response.data;
        } catch (refreshError) {
          authUtils.clearAuth();
          throw refreshError;
        }
      }
      throw error;
    }
  },
};

export { authUtils };
export default api;
