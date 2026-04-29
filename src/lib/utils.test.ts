import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins multiple class names with spaces', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('dedupes conflicting tailwind utilities, last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, null, undefined, '', 0, 'bar')).toBe('foo bar');
  });

  it('handles arrays and conditional objects via clsx', () => {
    expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz');
  });

  it('returns an empty string when given no truthy classes', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
