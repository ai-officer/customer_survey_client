import { http, HttpResponse } from 'msw';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/server';
import { api } from './api';

beforeAll(() => {
  // Node 22+ ships a stub `localStorage` global that lacks the standard
  // methods and shadows jsdom's implementation when code uses the bare
  // `localStorage` identifier (as src/lib/api.ts does). Replace it with a
  // minimal in-memory Storage-shaped object so the production code works.
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
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: shim,
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: shim,
  });
});

describe('api.get', () => {
  it('injects Bearer header when token is present in localStorage', async () => {
    window.localStorage.setItem('token', 'secret-token');
    let receivedAuth: string | null = null;

    server.use(
      http.get('/api/me', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get('/me');
    expect(receivedAuth).toBe('Bearer secret-token');
  });

  it('omits Authorization header when no token is set', async () => {
    let receivedAuth: string | null = 'unset';

    server.use(
      http.get('/api/me', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get('/me');
    expect(receivedAuth).toBeNull();
  });

  it('parses and returns the JSON body on success', async () => {
    server.use(
      http.get('/api/widget', () =>
        HttpResponse.json({ id: 'w-1', name: 'Widget' }),
      ),
    );

    const data = await api.get<{ id: string; name: string }>('/widget');
    expect(data).toEqual({ id: 'w-1', name: 'Widget' });
  });

  it('returns undefined for a 204 No Content response', async () => {
    server.use(
      http.get('/api/empty', () => new HttpResponse(null, { status: 204 })),
    );

    const result = await api.get('/empty');
    expect(result).toBeUndefined();
  });

  it('throws an Error with detail message on non-2xx response', async () => {
    server.use(
      http.get('/api/missing', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );

    await expect(api.get('/missing')).rejects.toThrow('Not found');
  });

  it('falls back to a generic message when detail is absent on error', async () => {
    server.use(
      http.get('/api/broken', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    await expect(api.get('/broken')).rejects.toThrow('Request failed');
  });
});

describe('api 401 handling', () => {
  let hrefSetter: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    hrefSetter = vi.fn();
    originalLocation = window.location;
    // jsdom makes `window.location.href` non-configurable, but
    // `window.location` itself is configurable, so swap the whole object.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        get href() {
          return originalLocation.href;
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('clears localStorage and redirects to /login on 401', async () => {
    window.localStorage.setItem('token', 'expired');
    window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));

    server.use(
      http.get('/api/secret', () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(api.get('/secret')).rejects.toThrow('Unauthorized');

    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });
});

describe('api.post', () => {
  it('sends a JSON body with Content-Type application/json', async () => {
    let receivedContentType: string | null = null;
    let receivedBody: unknown = null;

    server.use(
      http.post('/api/widgets', async ({ request }) => {
        receivedContentType = request.headers.get('Content-Type');
        receivedBody = await request.json();
        return HttpResponse.json({ id: 'w-2' });
      }),
    );

    const result = await api.post<{ id: string }>('/widgets', {
      name: 'New Widget',
    });

    expect(receivedContentType).toBe('application/json');
    expect(receivedBody).toEqual({ name: 'New Widget' });
    expect(result).toEqual({ id: 'w-2' });
  });
});

describe('api.postForm', () => {
  it('sends body as application/x-www-form-urlencoded with the encoded params', async () => {
    let receivedContentType: string | null = null;
    let receivedBody: string | null = null;

    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        receivedContentType = request.headers.get('Content-Type');
        receivedBody = await request.text();
        return HttpResponse.json({ access_token: 'abc', token_type: 'bearer' });
      }),
    );

    const params = new URLSearchParams();
    params.set('username', 'admin@example.com');
    params.set('password', 'hunter2');

    const result = await api.postForm<{ access_token: string }>(
      '/auth/login',
      params,
    );

    expect(receivedContentType).toMatch(/application\/x-www-form-urlencoded/);
    expect(receivedBody).toContain('username=admin%40example.com');
    expect(receivedBody).toContain('password=hunter2');
    expect(result.access_token).toBe('abc');
  });

  it('throws using the detail message when login fails', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'Bad credentials' }, { status: 400 }),
      ),
    );

    const params = new URLSearchParams({ username: 'x', password: 'y' });
    await expect(api.postForm('/auth/login', params)).rejects.toThrow(
      'Bad credentials',
    );
  });
});
