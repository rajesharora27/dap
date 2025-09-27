import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthState { token: string | null; setToken: (t: string | null) => void }
const AuthCtx = createContext<AuthState>({ token: null, setToken: () => { } });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always use the fallback admin token for no-auth mode
  const [token, setToken] = useState<string | null>('admin');

  const update = (t: string | null) => {
    setToken(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
  };

  // Set admin token immediately for auth bypass
  useEffect(() => {
    console.log('Auth bypass: using admin token');
    update('admin');
  }, []);

  return <AuthCtx.Provider value={{ token, setToken: update }}>{children}</AuthCtx.Provider>;
}
