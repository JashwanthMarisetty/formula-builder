import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(); 

// is useAuth a customhook ? 
// Yes, useAuth is a custom hook that provides access to the authentication context.
// It allows components to access authentication state and methods like login, register, and logout.
// It should be used within an AuthProvider to ensure the context is available.

export const useAuth = () => {
  const context = useContext(AuthContext); // useContext is a React hook that allows you to access the context value. 
  // explain what the above line does clearly
  // It retrieves the current value of AuthContext, which includes user information and authentication methods.
  // If context is null, it means useAuth is being used outside of an AuthProvider.
  // This will throw an error if useAuth is called outside of AuthProvider.
  // This is important because it ensures that components using useAuth have access to the authentication state and methods.
  // If context is null, it means useAuth is being used outside of AuthProvider.
  // This will throw an error if useAuth is called outside of AuthProvider.
  
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

  // Give clearly what the below function does 
  // The login function simulates a user login by creating a mock user object with an ID, email, name, and avatar.
  // It sets the user state, updates the authentication status, and saves the user data to local storage.
  // In a real application, this function would typically make an API call to authenticate the user.
  
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