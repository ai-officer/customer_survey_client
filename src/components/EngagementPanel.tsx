import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { cn } from '../lib/utils';

const HEATMAP_COLUMNS = [
  'Participation',
  'e-NPS',
  'Autonomy',
  'Environment',
  'Leadership',
  'Management',
  'Balance',
];

const PLACEHOLDER_COL_START = 2;

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface DepartmentEngagement {
  department: string;
  responseCount: number;
  participationRate?: number | null;
  csat?: number | null;
  nps?: number | null;
}

interface EngagementPanelProps {
  ratingDistribution?: RatingBucket[] | null;
  completionRate?: number | null;
  previousCompletionRate?: number | null;
  departmentEngagement?: DepartmentEngagement[] | null;
  loading?: boolean;
}

// Warm editorial heatmap scale — terracotta → olive → forest
function cellColor(columnIndex: number, value: number): { bg: string; text: string } {
  let score: number;
  if (columnIndex === 0) {
    score = Math.max(0, Math.min(1, value / 100));
  } else if (columnIndex === 1) {
    score = Math.max(0, Math.min(1, (value + 100) / 200));
  } else {
    score = Math.max(0, Math.min(1, value / 10));
  }

  // Warm ramp: burnt sienna → apricot → straw → sage → moss
  if (score < 0.25) return { bg: '#e6a087', text: '#5c1f0a' };
  if (score < 0.45) return { bg: '#f0c79a', text: '#6e3c16' };
  if (score < 0.6)  return { bg: '#eddfa7', text: '#5a4b18' };
  if (score < 0.8)  return { bg: '#c6cf9a', text: '#3b4820' };
  return { bg: '#8fae82', text: '#1e3220' };
}

function formatCell(columnIndex: number, value: number): string {
  if (columnIndex === 0) return value.toFixed(1);
  if (columnIndex === 1) return `${Math.round(value)}`;
  return value.toFixed(1);
}

export default function EngagementPanel({
  ratingDistribution = null,
  completionRate = null,
  previousCompletionRate = null,
  departmentEngagement = null,
  loading = false,
}: EngagementPanelProps) {
  const chartData = React.useMemo(() => {
    const buckets = ratingDistribution ?? [];
    return [1, 2, 3, 4, 5].map((n) => {
      const found = buckets.find((b) => b.rating === n);
      return { rating: String(n), value: found?.count ?? 0 };
    });
  }, [ratingDistribution]);

  const maxBar = Math.max(10, ...chartData.map((d) => d.value));
  const totalResponses = chartData.reduce((sum, d) => sum + d.value, 0);

  const displayRate = completionRate == null ? '—' : completionRate.toFixed(1);
  const delta =
    completionRate != null && previousCompletionRate != null
      ? completionRate - previousCompletionRate
      : null;

  const rows = departmentEngagement ?? [];

  return (
    <div className="space-y-8">
      {/* Participation — the hero number, set as a pull-quote */}
      <div className="relative py-6 border-y border-line flex flex-wrap items-baseline gap-x-10 gap-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted font-medium">
            Participation
          </p>
          <p className="mt-2 font-display italic text-sm text-muted max-w-xs">
            share of distributed surveys that were completed
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-display tabular text-ink leading-none"
            style={{
              fontSize: 'clamp(4rem, 9vw, 7rem)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 300',
            }}
          >
            {loading ? '—' : displayRate}
          </span>
          <span className="font-display text-3xl text-muted">%</span>
        </div>
        {delta !== null && delta !== 0 && (
          <div
            className={cn(
              'flex items-center gap-1 font-display italic text-sm',
              delta < 0 ? 'text-accent' : 'text-[color:#3b6147]'
            )}
          >
            {delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <span className="tabular">{Math.abs(delta).toFixed(1)}%</span>
            <span className="text-muted not-italic text-[11px] uppercase tracking-[0.18em] ml-1">
              vs. prior
            </span>
          </div>
        )}
        {delta === null && !loading && (
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
            pick a date range to compare
          </span>
        )}
      </div>

      {/* Responses + Drivers, bound as a spread */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Responses — left page */}
        <article className="xl:col-span-2 bg-surface border border-line rounded-sm p-7 space-y-6 grain">
          <header className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.28em] text-accent font-medium">
              Fig. I
            </span>
            <h2 className="font-display text-2xl text-ink font-light tracking-tight">
              Responses
            </h2>
          </header>
          <p className="font-display italic text-sm text-muted -mt-4">
            Distribution of ratings, one through five.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 24, right: 12, left: -10, bottom: 24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e8ddd0" vertical={false} />
                <XAxis
                  dataKey="rating"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a7f74', fontSize: 11, fontFamily: 'Instrument Sans' }}
                  label={{ value: '1 — 5', position: 'insideBottom', offset: -8, fill: '#8a7f74', fontSize: 10, fontStyle: 'italic', fontFamily: 'Fraunces' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a7f74', fontSize: 11, fontFamily: 'Instrument Sans' }}
                  domain={[0, Math.ceil(maxBar * 1.2)]}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(181, 71, 24, 0.08)' }}
                  contentStyle={{
                    background: '#1a1510',
                    border: 'none',
                    borderRadius: 2,
                    color: '#fbf8f3',
                    fontSize: 11,
                    fontFamily: 'Instrument Sans',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#fbeadb', fontStyle: 'italic', fontFamily: 'Fraunces' }}
                />
                <Bar dataKey="value" fill="#b54718" radius={[1, 1, 0, 0]} barSize={32}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: '#1a1510', fontSize: 11, fontFamily: 'Fraunces', fontWeight: 400 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <footer className="pt-4 border-t border-line flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Total</span>
            <span className="font-display tabular text-2xl text-ink">{totalResponses}</span>
          </footer>
        </article>

        {/* Drivers — right page */}
        <article className="xl:col-span-3 bg-surface border border-line rounded-sm p-7 space-y-5 grain">
          <header className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.28em] text-accent font-medium">
              Fig. II
            </span>
            <h2 className="font-display text-2xl text-ink font-light tracking-tight">
              Engagement, by driver
            </h2>
          </header>
          <p className="font-display italic text-sm text-muted -mt-3">
            A heatmap across departments. Participation and e-NPS are live; driver columns await question-level categorisation.
          </p>

          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display italic text-muted">
                {loading ? 'Turning pages…' : 'Nothing to show yet — the column will fill as responses arrive.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '4px 6px' }}>
                <thead>
                  <tr>
                    <th className="text-left pb-2 pr-3 w-28 align-bottom">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-muted font-medium">
                        Team
                      </span>
                    </th>
                    {HEATMAP_COLUMNS.map((col) => (
                      <th key={col} className="pb-2 px-1 align-bottom">
                        <span className="block text-center font-display italic text-[11px] text-muted whitespace-nowrap">
                          {col}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const cells: Array<number | null> = [
                      row.participationRate ?? null,
                      row.nps ?? null,
                      null,
                      null,
                      null,
                      null,
                      null,
                    ];
                    return (
                      <tr key={row.department} className="group">
                        <td className="pr-3 align-middle">
                          <span className="font-display text-ink text-sm leading-tight">
                            {row.department}
                          </span>
                        </td>
                        {cells.map((value, colIdx) => {
                          if (value == null) {
                            return (
                              <td key={colIdx} className="p-0">
                                <div
                                  className={cn(
                                    'h-9 min-w-14 rounded-sm flex items-center justify-center text-[11px] font-display italic',
                                    colIdx >= PLACEHOLDER_COL_START
                                      ? 'bg-[color:#f5eee2] text-[color:#c4b5a1]'
                                      : 'bg-[color:#f5eee2] text-[color:#a99a85]'
                                  )}
                                  title={
                                    colIdx >= PLACEHOLDER_COL_START
                                      ? 'Awaiting driver-category data'
                                      : 'No data'
                                  }
                                >
                                  ·
                                </div>
                              </td>
                            );
                          }
                          const { bg, text } = cellColor(colIdx, value);
                          return (
                            <td key={colIdx} className="p-0">
                              <div
                                className="h-9 min-w-14 rounded-sm flex items-center justify-center text-[12px] tabular font-medium transition-transform group-hover:scale-[1.02]"
                                style={{ background: bg, color: text }}
                              >
                                {formatCell(colIdx, value)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="pt-4 border-t border-line flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted">
            <span>Warm → cool ≈ Low → high engagement</span>
            <div className="flex items-center gap-1.5">
              {['#e6a087', '#f0c79a', '#eddfa7', '#c6cf9a', '#8fae82'].map((c) => (
                <span key={c} className="w-4 h-2 rounded-sm" style={{ background: c }} />
              ))}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
