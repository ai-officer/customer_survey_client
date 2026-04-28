import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { cn } from '../lib/utils';

const HEATMAP_COLUMNS = [
  'Participation Rate',
  'e-NPS',
  'Autonomy',
  'Work Environment',
  'Leadership',
  'Management',
  'Work Life Balance',
];

// Columns 0 and 1 map to real backend fields; columns 2-6 are placeholders
// until per-question driver categorization is added to the data model.
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

// Map a value within a column's typical range to a heatmap color band.
function cellColor(columnIndex: number, value: number): { bg: string; text: string } {
  let score: number; // normalized 0..1
  if (columnIndex === 0) {
    score = Math.max(0, Math.min(1, value / 100));
  } else if (columnIndex === 1) {
    score = Math.max(0, Math.min(1, (value + 100) / 200));
  } else {
    score = Math.max(0, Math.min(1, value / 10));
  }

  if (score < 0.25) return { bg: 'bg-rose-300', text: 'text-rose-900' };
  if (score < 0.45) return { bg: 'bg-orange-200', text: 'text-orange-900' };
  if (score < 0.6) return { bg: 'bg-amber-100', text: 'text-amber-900' };
  if (score < 0.8) return { bg: 'bg-lime-200', text: 'text-lime-900' };
  return { bg: 'bg-emerald-300', text: 'text-emerald-900' };
}

function formatCell(columnIndex: number, value: number): string {
  if (columnIndex === 0) return `${value.toFixed(1)}`;
  if (columnIndex === 1) return `${Math.round(value)}`;
  return value.toFixed(1);
}

export default function EngagementPanel({
  ratingDistribution = null,
  departmentEngagement = null,
  loading = false,
}: EngagementPanelProps) {
  // eNPS bar chart data — derived from the 1–5 rating distribution.
  const chartData = React.useMemo(() => {
    const buckets = ratingDistribution ?? [];
    return [1, 2, 3, 4, 5].map((n) => {
      const found = buckets.find((b) => b.rating === n);
      return { rating: String(n), value: found?.count ?? 0 };
    });
  }, [ratingDistribution]);

  const maxBar = Math.max(10, ...chartData.map((d) => d.value));

  const rows = departmentEngagement ?? [];

  return (
    <div className="space-y-6">
      {/* Responses chart + Engagement Score by Drivers — side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Responses (rating distribution) */}
        <div className="xl:col-span-2 bg-card rounded-xl border border-border shadow-card p-5 space-y-3">
          <div>
            <div className="eyebrow">responses</div>
            <h3 className="heading text-[15px] font-semibold text-foreground mt-0.5">Rating distribution</h3>
            <p className="text-[12px] text-muted-foreground mt-1">Response counts per rating (1–5).</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="rating"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
                  label={{ value: 'rating (1–5)', position: 'insideBottom', offset: -14, fill: '#78716c', fontSize: 10, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
                  domain={[0, Math.ceil(maxBar * 1.15)]}
                  allowDecimals={false}
                  label={{ value: 'responses', angle: -90, position: 'insideLeft', fill: '#78716c', fontSize: 10, fontFamily: 'JetBrains Mono, ui-monospace, monospace', offset: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(200, 36, 46, 0.08)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e7e5e4',
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  }}
                />
                <Bar dataKey="value" fill="#C8242E" radius={[2, 2, 0, 0]} barSize={32}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: '#0c0a09', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Score by Drivers */}
        <div className="xl:col-span-3 bg-card rounded-xl border border-border shadow-card p-5 space-y-3">
          <div>
            <div className="eyebrow">engagement score by drivers</div>
            <h3 className="heading text-[15px] font-semibold text-foreground mt-0.5">Heatmap by team</h3>
            <p className="text-[12px] text-muted-foreground mt-1">
              Participation Rate and e-NPS are live; remaining driver columns populate once survey questions are tagged with driver categories.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 italic">
              {loading ? 'Loading department engagement…' : 'No responses yet. The heatmap will populate as surveys receive submissions.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate" style={{ borderSpacing: '6px 4px' }}>
                <thead>
                  <tr>
                    <th className="w-28 text-left font-normal text-gray-400 pb-2 text-xs">Team</th>
                    {HEATMAP_COLUMNS.map((col) => (
                      <th key={col} className="text-center font-normal text-gray-500 pb-2 px-1 text-[11px] whitespace-nowrap">
                        <span className="border-b border-dashed border-gray-300 pb-0.5">{col}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const cells: Array<number | null> = [
                      row.participationRate ?? null,
                      row.nps ?? null,
                      null, null, null, null, null, // driver columns: awaits driver_category tagging
                    ];
                    return (
                      <tr key={row.department}>
                        <td className="py-1 pr-2 font-medium text-gray-700 text-sm whitespace-nowrap">
                          {row.department}
                        </td>
                        {cells.map((value, colIdx) => {
                          if (value == null) {
                            return (
                              <td key={colIdx} className="p-0">
                                <div
                                  className={cn(
                                    'h-8 min-w-14 rounded-md flex items-center justify-center text-xs border',
                                    colIdx >= PLACEHOLDER_COL_START
                                      ? 'bg-gray-50 border-gray-100 text-gray-300'
                                      : 'bg-gray-50 border-gray-100 text-gray-400'
                                  )}
                                  title={colIdx >= PLACEHOLDER_COL_START ? 'Awaiting driver-category data' : 'No data'}
                                >
                                  —
                                </div>
                              </td>
                            );
                          }
                          const { bg, text } = cellColor(colIdx, value);
                          return (
                            <td key={colIdx} className="p-0">
                              <div
                                className={cn(
                                  'h-8 min-w-14 rounded-md flex items-center justify-center text-xs font-semibold',
                                  bg,
                                  text
                                )}
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
        </div>
      </div>
    </div>
  );
}
