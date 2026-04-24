import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type DatePreset = 'today' | '7d' | '30d' | 'month' | 'custom' | 'all';

export interface DateRange {
  startDate: string; // yyyy-mm-dd (for <input type="date">) or '' to clear
  endDate: string;
  preset: DatePreset;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all',   label: 'All time'     },
  { key: 'today', label: 'Today'        },
  { key: '7d',    label: 'Last 7 days'  },
  { key: '30d',   label: 'Last 30 days' },
  { key: 'month', label: 'This month'   },
  { key: 'custom',label: 'Custom…'      },
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = toISODate(now);
  if (preset === 'today') {
    return { startDate: today, endDate: today };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { startDate: toISODate(start), endDate: today };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { startDate: toISODate(start), endDate: today };
  }
  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toISODate(start), endDate: today };
  }
  return { startDate: '', endDate: '' };
}

interface DateRangeControlProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

/**
 * Preset + custom date range control. Click to open the preset dropdown.
 * Choosing "Custom…" reveals two underlined <input type="date"> fields.
 */
export function DateRangeControl({ value, onChange, className }: DateRangeControlProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = PRESETS.find(p => p.key === value.preset) ?? PRESETS[0];

  const selectPreset = (p: DatePreset) => {
    if (p === 'custom') {
      onChange({ startDate: value.startDate, endDate: value.endDate, preset: 'custom' });
      setOpen(false);
      return;
    }
    const range = rangeForPreset(p);
    onChange({ ...range, preset: p });
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-3', className)} ref={ref}>
      <span className="label">Date range</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 border border-line bg-surface text-[13px] text-ink hover:border-ink transition-colors"
        >
          <Calendar size={14} className="text-muted" />
          <span>{current.label}</span>
          <ChevronDown size={14} className={cn('text-muted transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute z-20 top-full mt-1 left-0 w-44 bg-surface border border-line shadow-sm"
          >
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => selectPreset(p.key)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[13px] transition-colors flex items-center justify-between',
                  value.preset === p.key
                    ? 'bg-accent-soft text-ink'
                    : 'text-ink hover:bg-accent-soft/60'
                )}
              >
                <span>{p.label}</span>
                {value.preset === p.key && <span className="w-1 h-3 bg-accent" aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </div>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value, preset: 'custom' })}
            className="bg-transparent border-b border-line px-1 py-0.5 tabular text-[13px] text-ink outline-none focus:border-accent cursor-pointer"
          />
          <span className="text-muted text-sm">→</span>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value, preset: 'custom' })}
            className="bg-transparent border-b border-line px-1 py-0.5 tabular text-[13px] text-ink outline-none focus:border-accent cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Shared compact filter strip used by Dashboard, AuditLogs, DetailedAnalytics.
 * Renders a hairline-framed row with slots for controls and a reset affordance.
 */
export function FilterBar({ children, onReset, loading, className }: FilterBarProps) {
  return (
    <div className={cn('bg-surface border border-line', className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-sm">
        <span className="label">Filters</span>
        {children}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto label hover:text-accent transition-colors"
          >
            Reset
          </button>
        )}
        {loading && !onReset && (
          <span className="ml-auto label animate-pulse">Loading…</span>
        )}
      </div>
    </div>
  );
}
