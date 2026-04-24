import React from 'react';
import { Calendar, ChevronDown } from '../../lib/icons';
import { cn } from '../../lib/utils';

export type DatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface DateRange {
  startDate: string; // 'yyyy-mm-dd' (or empty)
  endDate: string;
  preset: DatePreset;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all',       label: 'All time' },
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d',        label: 'Last 7 days' },
  { key: '30d',       label: 'Last 30 days' },
  { key: '90d',       label: 'Last 90 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'custom',    label: 'Custom range' },
];

function fmtISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function rangeForPreset(key: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = fmtISO(now);
  if (key === 'today') return { startDate: today, endDate: today };
  if (key === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const ys = fmtISO(y);
    return { startDate: ys, endDate: ys };
  }
  if (key === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 6);
    return { startDate: fmtISO(s), endDate: today };
  }
  if (key === '30d') {
    const s = new Date(now); s.setDate(s.getDate() - 29);
    return { startDate: fmtISO(s), endDate: today };
  }
  if (key === '90d') {
    const s = new Date(now); s.setDate(s.getDate() - 89);
    return { startDate: fmtISO(s), endDate: today };
  }
  if (key === 'thisMonth') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmtISO(s), endDate: today };
  }
  if (key === 'lastMonth') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: fmtISO(s), endDate: fmtISO(e) };
  }
  return { startDate: '', endDate: '' };
}

function formatHuman(iso: string): string {
  if (!iso) return '…';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  align?: 'left' | 'right';
}

export function DateRangePicker({ value, onChange, className, align = 'left' }: Props) {
  const [open, setOpen] = React.useState(false);
  const [customStart, setCustomStart] = React.useState(value.startDate);
  const [customEnd, setCustomEnd] = React.useState(value.endDate);
  const ref = React.useRef<HTMLDivElement>(null);

  // Keep custom-mode state in sync if parent updates
  React.useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  }, [value.startDate, value.endDate]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = PRESETS.find(p => p.key === value.preset) || PRESETS[0];

  const apply = (key: DatePreset) => {
    if (key === 'custom') {
      // Switch to custom mode but don't close — let user pick dates
      onChange({ startDate: customStart, endDate: customEnd, preset: 'custom' });
      return;
    }
    onChange({ ...rangeForPreset(key), preset: key });
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customStart && !customEnd) {
      onChange({ startDate: '', endDate: '', preset: 'all' });
    } else {
      onChange({ startDate: customStart, endDate: customEnd, preset: 'custom' });
    }
    setOpen(false);
  };

  const trigger = value.preset === 'custom' && (value.startDate || value.endDate)
    ? `${formatHuman(value.startDate)} → ${formatHuman(value.endDate)}`
    : current.label;

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
          'border bg-white',
          open
            ? 'border-blue-300 ring-2 ring-blue-100 text-blue-700'
            : 'border-gray-200 text-gray-700 hover:border-gray-300'
        )}
      >
        <Calendar size={14} className={open ? 'text-blue-500' : 'text-gray-400'} />
        <span className="font-medium whitespace-nowrap">{trigger}</span>
        <ChevronDown size={14} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1.5 w-60 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <ul className="py-1.5 max-h-72 overflow-y-auto">
            {PRESETS.map(p => {
              const active = value.preset === p.key;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    onClick={() => apply(p.key)}
                    className={cn(
                      'w-full text-left px-4 py-1.5 text-sm flex items-center justify-between transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span>{p.label}</span>
                    {active && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>

          {value.preset === 'custom' && (
            <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                  className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={applyCustom}
                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
