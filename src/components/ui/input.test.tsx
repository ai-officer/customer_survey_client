import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders with the supplied type and placeholder', () => {
    render(<Input type="email" placeholder="you@example.com" />);
    const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('email');
  });

  it('renders the supplied value', () => {
    render(<Input value="hello" onChange={() => {}} />);
    const input = screen.getByDisplayValue('hello');
    expect(input).toBeInTheDocument();
  });

  it('fires onChange when the user types', () => {
    const onChange = vi.fn();
    render(<Input placeholder="name" onChange={onChange} />);
    const input = screen.getByPlaceholderText('name');
    fireEvent.change(input, { target: { value: 'kyle' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('kyle');
  });

  it('honors disabled state', () => {
    const onChange = vi.fn();
    render(<Input placeholder="off" onChange={onChange} disabled />);
    const input = screen.getByPlaceholderText('off');
    expect(input).toBeDisabled();
  });

  it('forwards ref to the underlying input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="ref" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className alongside built-ins', () => {
    render(<Input placeholder="cls" className="custom-class" />);
    const input = screen.getByPlaceholderText('cls');
    expect(input.className).toContain('custom-class');
    expect(input.className).toContain('rounded-md');
  });
});
