import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const HEATMAP_COLUMNS: { key: string; label: string; align: 'right' | 'center' }[] = [
  { key: 'participation', label: 'Participation', align: 'right' },
  { key: 'enps',          label: 'e-NPS',         align: 'right' },
  { key: 'autonomy',      label: 'Autonomy',      align: 'right' },
  { key: 'environment',   label: 'Environment',   align: 'right' },
  { key: 'leadership',    label: 'Leadership',    align: 'right' },
  { key: 'management',    label: 'Management',    align: 'right' },
  { key: 'balance',       label: 'Balance',       align: 'right' },
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
  departmentEngagement?: DepartmentEngagement[] | null;
  loading?: boolean;
}

function cellColor(columnIndex: number, value: number): string {
  let score: number;
  if (columnIndex === 0) {
    score = Math.max(0, Math.min(1, value / 100));
  } else if (columnIndex === 1) {
    score = Math.max(0, Math.min(1, (value + 100) / 200));
  } else {
    score = Math.max(0, Math.min(1, value / 10));
  }
  if (score < 0.25) return 'var(--heat-1)';
  if (score < 0.45) return 'var(--heat-2)';
  if (score < 0.6)  return 'var(--heat-3)';
  if (score < 0.8)  return 'var(--heat-4)';
  return 'var(--heat-5)';
}

function formatCell(columnIndex: number, value: number): string {
  if (columnIndex === 0) return `${value.toFixed(1)}%`;
  if (columnIndex === 1) return `${Math.round(value)}`;
  return value.toFixed(1);
}

export default function EngagementPanel({
  ratingDistribution = null,
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
  const rows = departmentEngagement ?? [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* Responses */}
      <section className="xl:col-span-2 bg-surface border border-line flex flex-col">
        <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <span className="label tabular" style={{ fontSize: '10px' }}>Fig. 01</span>
            <h2 className="text-sm font-medium text-ink">Response Distribution</h2>
          </div>
          <span className="label">1–5 rating</span>
        </header>
        <div className="px-4 pt-4 pb-2 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="0" stroke="#eff1f4" vertical={false} />
              <XAxis
                dataKey="rating"
                axisLine={{ stroke: '#e3e5ea' }}
                tickLine={false}
                tick={{ fill: '#5b6472', fontSize: 11, fontFamily: 'Geist Mono' }}
                height={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5b6472', fontSize: 11, fontFamily: 'Geist Mono' }}
                domain={[0, Math.ceil(maxBar * 1.2)]}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: 'rgba(29, 78, 216, 0.06)' }}
                contentStyle={{
                  background: '#0b1220',
                  border: 'none',
                  borderRadius: 2,
                  color: '#f7f8fa',
                  fontSize: 11,
                  fontFamily: 'Geist Mono',
                  padding: '6px 10px',
                }}
                labelStyle={{ color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              />
              <Bar dataKey="value" fill="#1d4ed8" barSize={32}>
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fill: '#0b1220', fontSize: 11, fontFamily: 'Geist Mono' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <footer className="mt-auto px-6 py-3 border-t border-line flex items-center justify-between">
          <span className="label">Total Responses</span>
          <span className="tabular text-base font-medium text-ink">{totalResponses}</span>
        </footer>
      </section>

      {/* Drivers heatmap */}
      <section className="xl:col-span-3 bg-surface border border-line flex flex-col">
        <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <span className="label tabular" style={{ fontSize: '10px' }}>Fig. 02</span>
            <h2 className="text-sm font-medium text-ink">Engagement by Department</h2>
          </div>
          <span className="label">By team</span>
        </header>

        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            {loading ? 'Loading department engagement…' : 'No responses yet. The heatmap will populate as surveys receive submissions.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Department</th>
                  {HEATMAP_COLUMNS.map((col) => (
                    <th key={col.key} style={{ textAlign: col.align }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const cells: Array<number | null> = [
                    row.participationRate ?? null,
                    row.nps ?? null,
                    null, null, null, null, null,
                  ];
                  return (
                    <tr key={row.department}>
                      <td className="font-medium">{row.department}</td>
                      {cells.map((value, colIdx) => {
                        if (value == null) {
                          return (
                            <td
                              key={colIdx}
                              className="num text-muted"
                              title={colIdx >= PLACEHOLDER_COL_START ? 'Awaiting driver-category data' : 'No data'}
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={colIdx} className="num p-0">
                            <div
                              className="h-full w-full px-3 py-2.5 text-right text-white tabular"
                              style={{
                                background: cellColor(colIdx, value),
                                fontVariantNumeric: 'tabular-nums lining-nums',
                                fontSize: 13,
                              }}
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

        <footer className="mt-auto px-6 py-3 border-t border-line flex items-center justify-between">
          <span className="label">Scale · Low → High</span>
          <div className="flex items-center">
            {[
              'var(--heat-1)',
              'var(--heat-2)',
              'var(--heat-3)',
              'var(--heat-4)',
              'var(--heat-5)',
            ].map((c, i) => (
              <span
                key={i}
                className="inline-block w-6 h-2"
                style={{ background: c }}
                aria-hidden
              />
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}
