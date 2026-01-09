import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isTokenValid, getUserFromToken, clearAuth } from '../utils/auth';

// Storage keys for impersonation
const ORIGINAL_ADMIN_TOKEN_KEY = 'originalAdminToken';
const ORIGINAL_ADMIN_USER_KEY = 'originalAdminUser';
const IS_IMPERSONATING_KEY = 'isImpersonating';

interface AuthState {
  token: string | null;
  setToken: (t: string | null) => void;
  user: any | null;
  setUser: (u: any | null) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Impersonation state
  isImpersonating: boolean;
  originalAdminUser: any | null;

  /**
   * Start impersonating a user. Sets the new token/user and preserves original admin credentials.
   * @param impersonatedToken - The token received from startImpersonation mutation
   * @param impersonatedUser - The user object of the impersonated user
   */
  startImpersonation: (impersonatedToken: string, impersonatedUser: any) => void;

  /**
   * End impersonation and restore the original admin token/user.
   */
  endImpersonation: () => void;
}

const AuthCtx = createContext<AuthState>({
  token: null,
  setToken: () => { },
  user: null,
  setUser: () => { },
  logout: () => { },
  isLoading: true,
  isAuthenticated: false,
  isImpersonating: false,
  originalAdminUser: null,
  startImpersonation: () => { },
  endImpersonation: () => { }
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdminUser, setOriginalAdminUser] = useState<any | null>(null);

  // Validate session on mount
  useEffect(() => {
    const validateSession = () => {
      const savedToken = localStorage.getItem('token');
      const savedIsImpersonating = localStorage.getItem(IS_IMPERSONATING_KEY) === 'true';

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

        // Restore impersonation state
        if (savedIsImpersonating) {
          setIsImpersonating(true);
          const savedOriginalAdminUser = localStorage.getItem(ORIGINAL_ADMIN_USER_KEY);
          if (savedOriginalAdminUser) {
            try {
              setOriginalAdminUser(JSON.parse(savedOriginalAdminUser));
            } catch (e) {
              console.error('Failed to parse original admin user:', e);
            }
          }
        }

        setIsAuthenticated(true);
      } else {
        // Token is invalid or expired
        console.warn('Session validation failed:', savedToken ? 'Token invalid/expired' : 'No token found');
        // Force clear any stale data to ensure login prompt
        clearAuth();
        clearImpersonationState();
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

  const clearImpersonationState = () => {
    localStorage.removeItem(ORIGINAL_ADMIN_TOKEN_KEY);
    localStorage.removeItem(ORIGINAL_ADMIN_USER_KEY);
    localStorage.removeItem(IS_IMPERSONATING_KEY);
    setIsImpersonating(false);
    setOriginalAdminUser(null);
  };

  const logout = useCallback(() => {
    console.log('Logging out...');
    clearAuth();
    clearImpersonationState();
    setTokenState(null);
    setUserState(null);
    setIsAuthenticated(false);
    // Remove hard redirect to avoid refresh loops
  }, []);

  /**
   * Start impersonating a user. 
   * Preserves the current admin token/user and switches to the impersonated user.
   */
  const startImpersonation = useCallback((impersonatedToken: string, impersonatedUser: any) => {
    // Save current admin credentials
    if (token) {
      localStorage.setItem(ORIGINAL_ADMIN_TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(ORIGINAL_ADMIN_USER_KEY, JSON.stringify(user));
      setOriginalAdminUser(user);
    }

    // Set impersonation flag
    localStorage.setItem(IS_IMPERSONATING_KEY, 'true');
    setIsImpersonating(true);

    // Switch to impersonated user
    setToken(impersonatedToken);
    setUser(impersonatedUser);

    console.log(`🔄 Started impersonating: ${impersonatedUser?.email || impersonatedUser?.username}`);
  }, [token, user]);

  /**
   * End impersonation and restore the original admin credentials.
   */
  const endImpersonation = useCallback(() => {
    // Restore original admin credentials
    const originalToken = localStorage.getItem(ORIGINAL_ADMIN_TOKEN_KEY);
    const originalUserStr = localStorage.getItem(ORIGINAL_ADMIN_USER_KEY);

    if (originalToken && isTokenValid(originalToken)) {
      setToken(originalToken);

      if (originalUserStr) {
        try {
          const originalUser = JSON.parse(originalUserStr);
          setUser(originalUser);
        } catch (e) {
          // If parsing fails, extract from token
          const userFromToken = getUserFromToken(originalToken);
          setUser(userFromToken);
        }
      }
    } else {
      // Original admin token expired - force re-login
      console.warn('Original admin token expired, forcing logout...');
      logout();
      return;
    }

    // Clear impersonation state
    clearImpersonationState();

    console.log('✅ Ended impersonation, restored admin session');
  }, [logout]);

  return (
    <AuthCtx.Provider value={{
      token,
      setToken,
      user,
      setUser,
      logout,
      isLoading,
      isAuthenticated,
      isImpersonating,
      originalAdminUser,
      startImpersonation,
      endImpersonation
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

