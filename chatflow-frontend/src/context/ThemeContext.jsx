// context/ThemeContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Apply theme based on user preference
    const theme = user?.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also set on body for additional styling if needed
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [user?.theme]);

  return (
    <ThemeContext.Provider value={{ theme: user?.theme || 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


