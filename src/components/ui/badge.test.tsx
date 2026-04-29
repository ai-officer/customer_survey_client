import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

// Pre-existing typecheck issue with the typed `variant` prop on Badge —
// route through a small wrapper that takes `variant` as a string. We still
// exercise the JSX path; runtime behavior is unchanged.
function RenderBadge({
  variant,
  children = 'Badge',
}: {
  variant?: string;
  children?: React.ReactNode;
}) {
  // BadgeProps has a known typecheck quirk (the codebase passes children + className
  // to Badge in many places and they all surface this same TS error). Cast props
  // through `unknown` so the test compiles cleanly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = { variant, children } as any;
  return <Badge {...props} />;
}

describe('Badge', () => {
  describe('cva variants (badgeVariants helper)', () => {
    it.each([
      ['default', 'bg-secondary'],
      ['primary', 'bg-primary/10'],
      ['success', 'bg-emerald-50'],
      ['warning', 'bg-amber-100'],
      ['destructive', 'bg-red-50'],
      ['outline', 'bg-transparent'],
      ['live', 'bg-transparent'],
    ] as const)('%s variant returns expected token in class string', (variant, token) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cls = badgeVariants({ variant: variant as any });
      expect(cls).toContain(token);
    });

    it('falls back to the default variant when none specified', () => {
      const cls = badgeVariants();
      expect(cls).toContain('bg-secondary');
    });
  });

  describe('rendered output', () => {
    it('renders children inside a <span>', () => {
      render(<RenderBadge>Hello</RenderBadge>);
      const el = screen.getByText('Hello');
      expect(el.tagName).toBe('SPAN');
    });

    it.each([
      ['default', 'bg-secondary'],
      ['primary', 'bg-primary/10'],
      ['success', 'bg-emerald-50'],
      ['warning', 'bg-amber-100'],
      ['destructive', 'bg-red-50'],
      ['outline', 'bg-transparent'],
      ['live', 'bg-transparent'],
    ] as const)('applies %s variant class to the rendered span', (variant, token) => {
      render(<RenderBadge variant={variant}>Tag</RenderBadge>);
      const el = screen.getByText('Tag');
      expect(el.className).toContain(token);
    });

    it('merges custom className', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = {
        className: 'my-custom',
        variant: 'success',
        children: 'Tag',
      } as any;
      render(<Badge {...props} />);
      const el = screen.getByText('Tag');
      expect(el.className).toContain('my-custom');
      expect(el.className).toContain('bg-emerald-50');
    });
  });
});
