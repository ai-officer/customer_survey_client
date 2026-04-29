import * as React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with the supplied placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Look up…" />);
    expect(screen.getByPlaceholderText('Look up…')).toBeInTheDocument();
  });

  it('uses default placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('renders the supplied value', () => {
    render(<SearchBar value="hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('typing without debounce fires onChange (after the effect tick)', () => {
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = React.useState('');
      return (
        <SearchBar
          value={v}
          onChange={(next) => {
            setV(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  describe('debounced onChange', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not fire onChange immediately when debounceMs is set', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} debounceMs={300} />);
      const input = screen.getByPlaceholderText('Search…');
      fireEvent.change(input, { target: { value: 'foo' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('fires onChange after debounceMs elapses', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} debounceMs={300} />);
      const input = screen.getByPlaceholderText('Search…');
      fireEvent.change(input, { target: { value: 'foo' } });
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('foo');
    });

    it('coalesces rapid typing into a single onChange', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} debounceMs={200} />);
      const input = screen.getByPlaceholderText('Search…');
      fireEvent.change(input, { target: { value: 'a' } });
      act(() => vi.advanceTimersByTime(50));
      fireEvent.change(input, { target: { value: 'ab' } });
      act(() => vi.advanceTimersByTime(50));
      fireEvent.change(input, { target: { value: 'abc' } });
      act(() => vi.advanceTimersByTime(199));
      expect(onChange).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('abc');
    });
  });

  describe('clear button', () => {
    it('does not render when value is empty', () => {
      render(<SearchBar value="" onChange={() => {}} />);
      expect(screen.queryByLabelText('Clear search')).toBeNull();
    });

    it('renders when value is non-empty', () => {
      render(<SearchBar value="abc" onChange={() => {}} />);
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clicking clear fires onChange with empty string', () => {
      const onChange = vi.fn();
      render(<SearchBar value="abc" onChange={onChange} />);
      const clearBtn = screen.getByLabelText('Clear search');
      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('shortcut hint', () => {
    it('renders a kbd hint when shortcut is set and value is empty', () => {
      render(<SearchBar value="" onChange={() => {}} shortcut="⌘K" />);
      const kbd = screen.getByText('⌘K');
      expect(kbd.tagName).toBe('KBD');
    });

    it('hides the kbd hint when value is non-empty', () => {
      render(<SearchBar value="something" onChange={() => {}} shortcut="⌘K" />);
      expect(screen.queryByText('⌘K')).toBeNull();
    });

    it('Cmd+K focuses the input', () => {
      render(<SearchBar value="" onChange={() => {}} shortcut="⌘K" />);
      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
      expect(document.activeElement).not.toBe(input);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(document.activeElement).toBe(input);
    });
  });

  it('renders the optional results caption', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        resultsCaption={<span>3 results</span>}
      />,
    );
    expect(screen.getByText('3 results')).toBeInTheDocument();
  });
});
