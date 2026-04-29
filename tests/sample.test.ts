import { describe, expect, it } from 'vitest';

describe('vitest foundation', () => {
  it('runs basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('intercepts /api/health via MSW', async () => {
    const res = await fetch('/api/health');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });
});
