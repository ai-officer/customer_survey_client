import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: boolean;
}

export type AuthPreset = 'admin' | 'manager' | 'signed-out';

export interface AuthOverride {
  user?: AuthUser | null;
  token?: string | null;
  login?: AuthContextValue['login'];
  logout?: AuthContextValue['logout'];
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  auth?: AuthPreset | AuthOverride;
}

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
};

const managerUser: AuthUser = {
  id: 'user-manager-1',
  email: 'manager@example.com',
  full_name: 'Manager User',
  role: 'manager',
};

function resolveAuth(auth: AuthPreset | AuthOverride | undefined): AuthOverride {
  if (auth === 'admin') return { user: adminUser, token: 'test-admin-token' };
  if (auth === 'manager') return { user: managerUser, token: 'test-manager-token' };
  if (auth === 'signed-out' || auth === undefined) return {};
  return auth;
}

function buildAuthValue(auth: AuthPreset | AuthOverride | undefined): AuthContextValue {
  const { user = null, token = null, login, logout } = resolveAuth(auth);
  return {
    user,
    token,
    login: login ?? (async () => {}),
    logout: logout ?? (() => {}),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    canEdit: user?.role === 'admin' || user?.role === 'manager',
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', auth, ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  const value = buildAuthValue(auth);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
