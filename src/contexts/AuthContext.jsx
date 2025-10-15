import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('onekamer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const mockUser = {
      id: 1,
      email,
      name: 'Utilisateur',
      avatar: '',
      plan: 'gratuit',
      okCoins: 0,
      okPoints: 0,
      level: 1
    };
    localStorage.setItem('onekamer_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const register = (email, password, name) => {
    const mockUser = {
      id: Date.now(),
      email,
      name,
      avatar: '',
      plan: 'gratuit',
      okCoins: 0,
      okPoints: 0,
      level: 1
    };
    localStorage.setItem('onekamer_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const logout = () => {
    localStorage.removeItem('onekamer_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('onekamer_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};