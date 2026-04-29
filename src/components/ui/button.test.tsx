import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('variants', () => {
    it.each([
      ['default', 'bg-primary'],
      ['destructive', 'bg-destructive'],
      ['outline', 'border'],
      ['secondary', 'bg-secondary'],
      ['ghost', 'hover:bg-secondary'],
      ['link', 'text-primary'],
    ] as const)('applies %s variant classes', (variant, expectedClass) => {
      render(<Button variant={variant}>Press</Button>);
      const btn = screen.getByRole('button', { name: 'Press' });
      expect(btn.className).toContain(expectedClass);
    });

    it('default variant is applied when none specified', () => {
      render(<Button>Press</Button>);
      const btn = screen.getByRole('button', { name: 'Press' });
      // default variant token
      expect(btn.className).toContain('bg-primary');
    });
  });

  describe('size variants', () => {
    it.each([
      ['default', 'h-9'],
      ['sm', 'h-8'],
      ['lg', 'h-10'],
      ['icon', 'h-9'],
    ] as const)('applies %s size classes', (size, expectedClass) => {
      render(<Button size={size}>Press</Button>);
      const btn = screen.getByRole('button', { name: /press|/i });
      expect(btn.className).toContain(expectedClass);
    });
  });

  describe('interaction', () => {
    it('fires onClick when clicked', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disabled state suppresses click', () => {
      const onClick = vi.fn();
      render(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>,
      );
      const btn = screen.getByRole('button', { name: 'Disabled' });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the underlying button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>With ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('With ref');
    });
  });

  describe('asChild', () => {
    it('renders the slot child instead of a <button>', () => {
      render(
        <Button asChild>
          <a href="/somewhere">Link</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Link' });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/somewhere');
      // No <button> rendered
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('passes className to the slotted element', () => {
      render(
        <Button asChild variant="outline">
          <a href="#">Outline link</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Outline link' });
      expect(link.className).toContain('border');
    });
  });

  describe('buttonVariants helper', () => {
    it('returns class string honoring variant + size', () => {
      const cls = buttonVariants({ variant: 'destructive', size: 'sm' });
      expect(cls).toContain('bg-destructive');
      expect(cls).toContain('h-8');
    });

    it('falls back to defaults', () => {
      const cls = buttonVariants();
      expect(cls).toContain('bg-primary');
      expect(cls).toContain('h-9');
    });
  });
});
