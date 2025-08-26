import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('formula_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/users/refresh-token')) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('formula_refresh_token');
      if (refreshToken) {
        try {
          // Use direct axios call to avoid triggering interceptors
          const response = await axios.post(
            (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/users/refresh-token',
            { refreshToken }
          );
          
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('formula_token', token);
          localStorage.setItem('formula_refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('formula_token');
          localStorage.removeItem('formula_refresh_token');
          localStorage.removeItem('formula_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  logout: async () => {
    // Clear local storage
    localStorage.removeItem('formula_token');
    localStorage.removeItem('formula_refresh_token');
    localStorage.removeItem('formula_user');
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/users/refresh-token', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData) => {
    const response = await api.post('/users/reset-password', resetData);
    return response.data;
  },

  googleSignIn: async (googleUserData) => {
    const response = await api.post('/users/google-signin', googleUserData);
    return response.data;
  },
};

// Form API calls
export const formAPI = {
  // Create a new form
  createForm: async (formData) => {
    const response = await api.post('/forms', formData);
    return response.data;
  },

  // Get all forms for the authenticated user
  getAllForms: async (params = {}) => {
    const response = await api.get('/forms', { params });
    return response.data;
  },

  // Get a specific form by ID
  getFormById: async (formId) => {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  },

  // Get a public form (no auth required)
  getPublicForm: async (formId) => {
    const response = await api.get(`/forms/public/${formId}`);
    return response.data;
  },

  // Update a form
  updateForm: async (formId, formData) => {
    const response = await api.put(`/forms/${formId}`, formData);
    return response.data;
  },

  // Delete a form
  deleteForm: async (formId) => {
    const response = await api.delete(`/forms/${formId}`);
    return response.data;
  },

  // Submit a response to a form
  submitFormResponse: async (formId, responseData) => {
    const response = await api.post(`/forms/${formId}/submit`, responseData);
    return response.data;
  },
};

export default api;
