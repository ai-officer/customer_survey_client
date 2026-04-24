import React from 'react';
import { Search, X } from '../../lib/icons';
import { cn } from '../../lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Render a small ⌘K hint on the right when empty, and bind that shortcut to focus the input. */
  shortcut?: string;
  /** Optional debounce in ms before invoking onChange (still updates the input immediately). */
  debounceMs?: number;
  /** Optional "N results" / similar caption rendered below. */
  resultsCaption?: React.ReactNode;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
  shortcut,
  debounceMs,
  resultsCaption,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [local, setLocal] = React.useState(value);

  // Keep local in sync if parent resets value externally
  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce upstream onChange
  React.useEffect(() => {
    if (!debounceMs) {
      if (local !== value) onChange(local);
      return;
    }
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  // ⌘K / Ctrl+K to focus
  React.useEffect(() => {
    if (!shortcut) return;
    const handler = (e: KeyboardEvent) => {
      const isFocusKey = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isFocusKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcut]);

  const clear = () => {
    setLocal('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-12 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
      />
      {local ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={14} />
        </button>
      ) : shortcut ? (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 border border-gray-200 rounded bg-gray-50 pointer-events-none">
          {shortcut}
        </kbd>
      ) : null}
      {resultsCaption !== undefined && (
        <div className="mt-1.5 text-[11px] text-gray-400">{resultsCaption}</div>
      )}
    </div>
  );
}
