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
  // Manually add authorization header
  addAuthHeader: (config = {}) => {
    const token = localStorage.getItem('formula_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

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
      localStorage.removeItem('formula_token');
      localStorage.removeItem('formula_refresh_token');
      localStorage.removeItem('formula_user');
      window.location.href = '/login';
      throw error;
    }
  },

  // Manual error handling for API responses
  handleApiError: async (error, originalConfig, retryCallback) => {
    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      
      try {
        await authUtils.refreshToken();
        // Retry the original request with new token
        const newConfig = authUtils.addAuthHeader(originalConfig);
        return retryCallback(newConfig);
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('formula_token');
    localStorage.removeItem('formula_refresh_token');
    localStorage.removeItem('formula_user');
  }
};

// Manual API request wrapper
const makeAuthenticatedRequest = async (requestFn, config = {}) => {
  try {
    const authConfig = authUtils.addAuthHeader(config);
    return await requestFn(authConfig);
  } catch (error) {
    return authUtils.handleApiError(error, config, requestFn);
  }
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
    // Use manual auth utility to clear data
    authUtils.clearAuth();
  },

  refreshToken: async (refreshToken) => {
    // Refresh token endpoint doesn't require auth token
    const response = await api.post('/users/refresh-token', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    // Manually handle authentication with retry logic
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.get('/users/me', config);
      return response.data;
    });
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
};

// Form API calls (no interceptors - manual handling)
export const formAPI = {
  // Create a new form (requires authentication)
  createForm: async (formData) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.post('/forms', formData, config);
      return response.data;
    });
  },

  // Get all forms for the authenticated user (requires authentication)
  getAllForms: async (params = {}) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.get('/forms', { ...config, params });
      return response.data;
    });
  },

  // Get a specific form by ID (requires authentication)
  getFormById: async (formId) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.get(`/forms/${formId}`, config);
      return response.data;
    });
  },

  // Get a public form (no auth required)
  getPublicForm: async (formId) => {
    const response = await api.get(`/forms/public/${formId}`);
    return response.data;
  },

  // Update a form (requires authentication)
  updateForm: async (formId, formData) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.put(`/forms/${formId}`, formData, config);
      return response.data;
    });
  },

  // Delete a form (requires authentication)
  deleteForm: async (formId) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.delete(`/forms/${formId}`, config);
      return response.data;
    });
  },

  // Submit a response to a form (no auth required - public endpoint)
  submitFormResponse: async (formId, responseData) => {
    const response = await api.post(`/forms/${formId}/submit`, responseData);
    return response.data;
  },

  // Get all responses for a form (requires authentication)
  getFormResponses: async (formId, params = {}) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.get(`/forms/${formId}/responses`, { ...config, params });
      return response.data;
    });
  },

  // Get a single response by ID (requires authentication)
  getResponseById: async (formId, responseId) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.get(`/forms/${formId}/responses/${responseId}`, config);
      return response.data;
    });
  },

  // Delete a specific response (requires authentication)
  deleteResponse: async (formId, responseId) => {
    return makeAuthenticatedRequest(async (config) => {
      const response = await api.delete(`/forms/${formId}/responses/${responseId}`, config);
      return response.data;
    });
  },
};

export { authUtils };
export default api;
