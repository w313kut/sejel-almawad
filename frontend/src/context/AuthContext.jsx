import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "../api/client";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On refresh, re-validate the stored JWT against the real backend rather
  // than trusting anything cached client-side.
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("sejel_token");
      if (!token) { setLoading(false); return; }
      try {
        const { user } = await api.me();
        setUser(user);
        connectSocket(token);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login(username, password);
    setToken(token);
    setUser(user);
    connectSocket(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* best-effort */ }
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
