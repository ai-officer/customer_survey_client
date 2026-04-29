import React from 'react';
import { AuthUser } from '../types';
import { api } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: boolean;
}

export const AuthContext = React.createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem('token'));

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await api.postForm<{ access_token: string; user: AuthUser }>('/auth/login', form);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit = isAdmin || isManager;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isManager, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
