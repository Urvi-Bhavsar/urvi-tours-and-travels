import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// status: 'checking' (token found, asking the server if it is still valid) | 'in' | 'out'
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(getToken() ? 'checking' : 'out');

  // On page load, confirm the saved token is still accepted by the server
  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    api
      .me()
      .then(() => alive && setStatus('in'))
      .catch(() => {
        // a 401 clears the token inside api.js; a network error keeps it, so stay signed in and let pages show the error
        if (alive) setStatus(getToken() ? 'in' : 'out');
      });
    return () => {
      alive = false;
    };
  }, []);

  // api.js fires this when any admin request gets a 401 (expired or invalid token)
  useEffect(() => {
    const onExpired = () => setStatus('out');
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token } = await api.login(email, password);
    setToken(token);
    setStatus('in');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStatus('out');
  }, []);

  const value = useMemo(() => ({ status, login, logout }), [status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
