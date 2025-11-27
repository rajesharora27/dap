import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { isTokenValid, getUserFromToken, clearAuth } from '../utils/auth';

interface AuthState { 
  token: string | null; 
  setToken: (t: string | null) => void;
  user: any | null;
  setUser: (u: any | null) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthCtx = createContext<AuthState>({ 
  token: null, 
  setToken: () => { }, 
  user: null,
  setUser: () => { },
  logout: () => { },
  isLoading: true,
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const validateSession = () => {
      const savedToken = localStorage.getItem('token');
      
      if (savedToken && isTokenValid(savedToken)) {
        // Token is valid
        setTokenState(savedToken);
        
        // Try to get user from localStorage first
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUserState(JSON.parse(savedUser));
          } catch (e) {
            // If parsing fails, extract from token
            const userFromToken = getUserFromToken(savedToken);
            setUserState(userFromToken);
            if (userFromToken) {
              localStorage.setItem('user', JSON.stringify(userFromToken));
            }
          }
        } else {
          // Extract user from token
          const userFromToken = getUserFromToken(savedToken);
          setUserState(userFromToken);
          if (userFromToken) {
            localStorage.setItem('user', JSON.stringify(userFromToken));
          }
        }
        
        setIsAuthenticated(true);
      } else {
        // Token is invalid or expired - clear everything
        clearAuth();
        setTokenState(null);
        setUserState(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    validateSession();
  }, []);

  // Check token validity periodically (every 5 minutes)
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      if (!isTokenValid(token)) {
        console.warn('Token expired, logging out...');
        logout();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [token]);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t && isTokenValid(t)) {
      localStorage.setItem('token', t);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  const setUser = (u: any | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
    setIsAuthenticated(false);
    // Use BASE_URL for subpath deployment support
    const basePath = (typeof import.meta !== 'undefined' && import.meta.env) 
      ? (import.meta.env.BASE_URL || '/').replace(/\/$/, '') 
      : '/';
    window.location.href = basePath || '/';
  };

  return (
    <AuthCtx.Provider value={{ 
      token, 
      setToken, 
      user, 
      setUser, 
      logout, 
      isLoading, 
      isAuthenticated 
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
