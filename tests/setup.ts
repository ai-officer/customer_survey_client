import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

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
