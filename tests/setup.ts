import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// Node 22+ ships a `localStorage` global that lacks the standard methods
// (getItem, setItem, removeItem) unless `--localstorage-file` is passed,
// and jsdom's own localStorage implementation is shadowed by it. Source
// code that reads `localStorage.getItem(...)` directly (without `window.`
// prefix) blows up with "is not a function". Install a small in-memory
// polyfill on globalThis (and mirror to window) so application code can
// use the unprefixed name safely in jsdom-environment tests.
function installLocalStoragePolyfill() {
  const store = new Map<string, string>();
  const polyfill = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.has(key) ? store.get(key)! : null; },
    setItem(key: string, value: string) { store.set(key, String(value)); },
    removeItem(key: string) { store.delete(key); },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      value: polyfill,
      configurable: true,
      writable: true,
    });
  } catch {
    (globalThis as any).localStorage = polyfill;
  }
  if (typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: polyfill,
        configurable: true,
        writable: true,
      });
    } catch {
      (window as any).localStorage = polyfill;
    }
  }
}

installLocalStoragePolyfill();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  // Reset between tests. Use window.localStorage since Node 22+ ships a stub
  // global named `localStorage` that shadows the jsdom-provided one in some
  // contexts and lacks the standard methods.
  if (typeof window !== 'undefined' && window.localStorage?.clear) {
    window.localStorage.clear();
  }
});

afterAll(() => server.close());
