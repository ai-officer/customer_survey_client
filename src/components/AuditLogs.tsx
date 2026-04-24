import React from 'react';
import { format } from 'date-fns';
import { AuditLog } from '../types';
import { api } from '../lib/api';
import { FilterBar, DateRangeControl, DateRange } from './ui/FilterBar';

type ActionTier = 'destructive' | 'write' | 'other';

const TIER_STYLE: Record<ActionTier, { text: string; marker: string | null }> = {
  destructive: { text: 'text-negative', marker: 'bg-negative' },
  write:       { text: 'text-ink',      marker: 'bg-accent'   },
  other:       { text: 'text-muted',    marker: null          },
};

function tierFor(action: string): ActionTier {
  if (/^(DELETE|DEACTIVATE)_/.test(action)) return 'destructive';
  if (/^(CREATE|UPDATE|SUBMIT)_/.test(action)) return 'write';
  return 'other';
}

function ActionBadge({ action }: { action: string }) {
  const { text, marker } = TIER_STYLE[tierFor(action)];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${text}`}>
      {marker && <span className={`w-1 h-3 ${marker}`} aria-hidden />}
      {action}
    </span>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [resourceFilter, setResourceFilter] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'all',
  });

  React.useEffect(() => {
    api.get<AuditLog[]>('/audit-logs?limit=200')
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const actionOptions = React.useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs],
  );
  const resourceOptions = React.useMemo(
    () => Array.from(new Set(logs.map((l) => l.resource).filter(Boolean))).sort(),
    [logs],
  );

  const filtered = logs.filter((log) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        (log.user_email || '').toLowerCase().includes(q) ||
        (log.detail || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter && log.action !== actionFilter) return false;
    if (resourceFilter && log.resource !== resourceFilter) return false;
    if (dateRange.startDate) {
      const start = new Date(`${dateRange.startDate}T00:00:00`).getTime();
      if (new Date(log.timestamp).getTime() < start) return false;
    }
    if (dateRange.endDate) {
      const end = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
      if (new Date(log.timestamp).getTime() > end) return false;
    }
    return true;
  });

  const hasFilter =
    !!search ||
    !!actionFilter ||
    !!resourceFilter ||
    dateRange.preset !== 'all' ||
    !!dateRange.startDate ||
    !!dateRange.endDate;

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setResourceFilter('');
    setDateRange({ startDate: '', endDate: '', preset: 'all' });
  };

  const today = format(new Date(), 'MMM d, yyyy').toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Title strip */}
      <div className="flex items-end justify-between gap-6 border-b border-line pb-4 rise">
        <div>
          <div className="label" style={{ fontSize: '10px' }}>
            System Audit · Last Updated {today}
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink tracking-tight">
            Audit Logs
          </h1>
        </div>
        <div className="label hidden sm:block">
          Admin Only
        </div>
      </div>

      {/* Filter bar */}
      <div className="rise" style={{ animationDelay: '60ms' }}>
        <FilterBar
          onReset={hasFilter ? clearFilters : undefined}
          loading={loading}
        >
          <DateRangeControl value={dateRange} onChange={setDateRange} />
          <div className="flex items-center gap-2">
            <span className="label">Search</span>
            <input
              type="text"
              placeholder="Action, user, or detail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink outline-none focus:border-accent placeholder:text-muted min-w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label">Action</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Any</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="label">Resource</span>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink outline-none focus:border-accent cursor-pointer capitalize"
            >
              <option value="">Any</option>
              {resourceOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </FilterBar>
      </div>

      {/* Audit table */}
      <section className="bg-surface border border-line rise" style={{ animationDelay: '120ms' }}>
        <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <span className="label tabular" style={{ fontSize: '10px' }}>Fig. 01</span>
            <h2 className="text-sm font-medium text-ink">Activity Trail</h2>
          </div>
          <span className="label tabular">
            {loading ? 'Loading…' : `${filtered.length} of ${logs.length}`}
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Timestamp</th>
                <th style={{ width: '220px' }}>Action</th>
                <th>User</th>
                <th style={{ width: '120px' }}>Resource</th>
                <th>Detail</th>
                <th style={{ width: '120px' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-12">
                    Loading audit logs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-12">
                    No logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="tabular text-muted text-[12px] whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td>
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="text-ink text-sm">
                      {log.user_email || <span className="text-muted italic">anonymous</span>}
                    </td>
                    <td className="text-ink text-sm capitalize">{log.resource || '—'}</td>
                    <td className="text-ink text-sm max-w-[320px] truncate" title={log.detail || ''}>
                      {log.detail || '—'}
                    </td>
                    <td className="font-mono text-[11px] text-muted whitespace-nowrap">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
