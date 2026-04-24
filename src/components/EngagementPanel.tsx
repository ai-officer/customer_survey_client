import React from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
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
  completionRate?: number | null;
  previousCompletionRate?: number | null;
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
  completionRate = null,
  previousCompletionRate = null,
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

  const displayRate = completionRate == null ? '—' : `${completionRate.toFixed(1)}%`;
  const delta =
    completionRate != null && previousCompletionRate != null
      ? completionRate - previousCompletionRate
      : null;

  const rows = departmentEngagement ?? [];

  return (
    <div className="space-y-6">
      {/* Participation rate banner */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
          <span>Participation rate</span>
          <Info size={14} className="text-gray-400" />
        </div>
        <div className="text-4xl font-bold text-gray-900 leading-none">
          {loading ? '…' : displayRate}
        </div>
        {delta !== null && delta !== 0 && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              delta < 0 ? 'text-rose-500' : 'text-emerald-600'
            )}
          >
            <span>{Math.abs(delta).toFixed(1)}%</span>
            {delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <span className="text-gray-500 font-normal">
              {delta < 0 ? 'decrease' : 'increase'} from previous period
            </span>
          </div>
        )}
        {delta === null && !loading && (
          <div className="text-xs text-gray-400">Apply a date range to compare against the previous period.</div>
        )}
      </div>

      {/* Responses chart + Engagement Score by Drivers — side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Responses (rating distribution) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Responses</h3>
            <p className="text-xs text-gray-500 mt-1">
              Response counts per rating (1–5).
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="rating"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Rating (1–5)', position: 'insideBottom', offset: -15, fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, Math.ceil(maxBar * 1.15)]}
                  allowDecimals={false}
                  label={{ value: 'Responses', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12, offset: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(249, 168, 168, 0.1)' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#f8a5a5" radius={[3, 3, 0, 0]} barSize={36}>
                  <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Score by Drivers */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Engagement Score by Drivers</h3>
            <p className="text-xs text-gray-500 mt-1">
              This heatmap shows engagement drivers/areas at a glance across teams. Participation Rate and e-NPS are live; the remaining driver columns will populate once survey questions can be tagged with driver categories.
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
