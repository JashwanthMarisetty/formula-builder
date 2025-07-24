import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const savedUser = localStorage.getItem('formula_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (email, password) => {
    // Mock login - in real app, this would be an API call
    const mockUser = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      avatar: `https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('formula_user', JSON.stringify(mockUser));
    return { success: true };
  };

  const register = (email, password, name) => {
    // Mock registration - in real app, this would be an API call
    const mockUser = {
      id: Date.now().toString(),
      email,
      name,
      avatar: `https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('formula_user', JSON.stringify(mockUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('formula_user');
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