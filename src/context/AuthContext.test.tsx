import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

// Mock the api module before importing AuthContext.
vi.mock('@/lib/api', () => ({
  api: {
    postForm: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Imports below intentionally come after the mock so that AuthContext picks
// up the mocked api singleton.
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

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

interface ProbeRef {
  value: ReturnType<typeof useAuth> | null;
}

// Tiny probe that surfaces the AuthContext value so individual tests can
// inspect it without fighting around React state asynchronously.
function Probe({ probe }: { probe: ProbeRef }) {
  probe.value = useAuth();
  return null;
}

function renderWithAuth(probe: ProbeRef) {
  return render(
    <AuthProvider>
      <Probe probe={probe} />
    </AuthProvider>,
  );
}

beforeAll(() => {
  // Node 22+ ships a stub `localStorage` global that lacks the standard
  // Storage methods and shadows jsdom's implementation when code uses the
  // bare `localStorage` identifier (as AuthContext does). Replace both the
  // global and window-bound references with a minimal in-memory shim.
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: shim });
  Object.defineProperty(window, 'localStorage', { configurable: true, value: shim });
});

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(api.postForm).mockReset();
});

describe('AuthContext / AuthProvider', () => {
  it('starts with null user and token when localStorage is empty', () => {
    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);

    expect(probe.value?.user).toBeNull();
    expect(probe.value?.token).toBeNull();
    expect(probe.value?.isAdmin).toBe(false);
    expect(probe.value?.isManager).toBe(false);
    expect(probe.value?.canEdit).toBe(false);
  });

  it('hydrates user and token from localStorage on mount', () => {
    window.localStorage.setItem('token', 'persisted-token');
    window.localStorage.setItem('user', JSON.stringify(adminUser));

    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);

    expect(probe.value?.token).toBe('persisted-token');
    expect(probe.value?.user).toEqual(adminUser);
    expect(probe.value?.isAdmin).toBe(true);
    expect(probe.value?.canEdit).toBe(true);
  });

  it('login() calls api.postForm, persists token + user, and updates state', async () => {
    vi.mocked(api.postForm).mockResolvedValueOnce({
      access_token: 'new-token',
      user: managerUser,
    });

    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);

    await act(async () => {
      await probe.value!.login('manager@example.com', 'hunter2');
    });

    expect(api.postForm).toHaveBeenCalledTimes(1);
    const [path, form] = vi.mocked(api.postForm).mock.calls[0];
    expect(path).toBe('/auth/login');
    expect(form).toBeInstanceOf(URLSearchParams);
    expect((form as URLSearchParams).get('username')).toBe('manager@example.com');
    expect((form as URLSearchParams).get('password')).toBe('hunter2');

    expect(window.localStorage.getItem('token')).toBe('new-token');
    expect(JSON.parse(window.localStorage.getItem('user') || 'null')).toEqual(managerUser);

    expect(probe.value?.token).toBe('new-token');
    expect(probe.value?.user).toEqual(managerUser);
    expect(probe.value?.isManager).toBe(true);
    expect(probe.value?.isAdmin).toBe(false);
    expect(probe.value?.canEdit).toBe(true);
  });

  it('logout() clears state and localStorage', () => {
    window.localStorage.setItem('token', 'persisted-token');
    window.localStorage.setItem('user', JSON.stringify(adminUser));

    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);

    expect(probe.value?.user).toEqual(adminUser);

    act(() => {
      probe.value!.logout();
    });

    expect(probe.value?.user).toBeNull();
    expect(probe.value?.token).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
  });

  it('isAdmin is true only for admin role', () => {
    window.localStorage.setItem('user', JSON.stringify(adminUser));
    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);
    expect(probe.value?.isAdmin).toBe(true);
  });

  it('isAdmin is false for manager role', () => {
    window.localStorage.setItem('user', JSON.stringify(managerUser));
    const probe: ProbeRef = { value: null };
    renderWithAuth(probe);
    expect(probe.value?.isAdmin).toBe(false);
  });

  it('isManager is true only for manager role (admin is not manager)', () => {
    window.localStorage.setItem('user', JSON.stringify(managerUser));
    const managerProbe: ProbeRef = { value: null };
    renderWithAuth(managerProbe);
    expect(managerProbe.value?.isManager).toBe(true);

    // Re-render fresh provider with admin user; isManager should be false.
    window.localStorage.clear();
    window.localStorage.setItem('user', JSON.stringify(adminUser));
    const adminProbe: ProbeRef = { value: null };
    renderWithAuth(adminProbe);
    expect(adminProbe.value?.isManager).toBe(false);
  });

  it('canEdit is true for admin and manager, false when signed out', () => {
    // Admin
    window.localStorage.setItem('user', JSON.stringify(adminUser));
    const adminProbe: ProbeRef = { value: null };
    renderWithAuth(adminProbe);
    expect(adminProbe.value?.canEdit).toBe(true);

    // Manager
    window.localStorage.clear();
    window.localStorage.setItem('user', JSON.stringify(managerUser));
    const managerProbe: ProbeRef = { value: null };
    renderWithAuth(managerProbe);
    expect(managerProbe.value?.canEdit).toBe(true);

    // Signed out
    window.localStorage.clear();
    const anonProbe: ProbeRef = { value: null };
    renderWithAuth(anonProbe);
    expect(anonProbe.value?.canEdit).toBe(false);
  });
});
