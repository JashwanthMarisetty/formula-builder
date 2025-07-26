import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(); 

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start

    //what does the below function do , explain very clearly 
    // It initializes authentication state by checking local storage for tokens, 
    // verifies the token by fetching user data, and updates the context state accordingly.

    const initializeAuth = async () => { 
      const token = localStorage.getItem('formula_token');
      const savedUser = localStorage.getItem('formula_user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching user data
          const response = await authAPI.getMe();
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
            // Update saved user data
            localStorage.setItem('formula_user', JSON.stringify(response.user));
          }
        } catch (error) {
          // Token is invalid, clear stored data
          localStorage.removeItem('formula_token');
          localStorage.removeItem('formula_refresh_token');
          localStorage.removeItem('formula_user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const { user, token, refreshToken } = response;
        
        // Store tokens and user data
        localStorage.setItem('formula_token', token);
        localStorage.setItem('formula_refresh_token', refreshToken);
        localStorage.setItem('formula_user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await authAPI.register({ 
        name, 
        email, 
        password 
      });
      
      if (response.success) {
        // After successful registration, log the user in
        return await login(email, password);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};