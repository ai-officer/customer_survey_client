import React from 'react';
import { Info, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { cn } from '../lib/utils';

const ENPS_RATINGS = [
  { rating: '1', value: 5 },
  { rating: '2', value: 3 },
  { rating: '3', value: 13 },
  { rating: '4', value: 14 },
  { rating: '5', value: 23 },
  { rating: '6', value: 28 },
  { rating: '7', value: 29 },
  { rating: '8', value: 25 },
  { rating: '9', value: 20 },
  { rating: '10', value: 10 },
];

const HEATMAP_TABS = ['Teams', 'Locations', 'Reporting Manager', 'Gender', 'Employee type'] as const;

const HEATMAP_COLUMNS = [
  'Participation Rate',
  'e-NPS',
  'Autonomy',
  'Work Environment',
  'Leadership',
  'Management',
  'Work Life Balance',
];

// Hand-tuned sample values per screenshot reference. Swap with live backend
// data once engagement drivers are wired.
const HEATMAP_ROWS: { team: string; cells: Array<number | string> }[] = [
  { team: 'Sales',       cells: [28.9, -26,  6.9, 6.4, 5.7, 6.2, 5.8] },
  { team: 'Marketing',   cells: [23.3,  28,  6.7, 5.5, 5.4, 6.4, 4.1] },
  { team: 'Engineering', cells: [23.6, -12,  6.4, 4.0, 4.8, 5.5, 4.3] },
  { team: 'Product',     cells: [15.1,  13,  6.0, 5.5, 5.1, 5.6, 4.3] },
  { team: 'Legal',       cells: [13.5, -17,  8.0, 4.1, 5.3, 6.1, 5.4] },
  { team: 'TravelDesk',  cells: [21.2,  17,  6.0, 3.6, 4.9, 6.3, 4.8] },
  { team: 'Support',     cells: [24.2, -42,  7.1, 5.3, 5.0, 7.3, 5.6] },
];

// Map a value within a column's typical range to a heatmap color band.
function cellColor(columnIndex: number, value: number): { bg: string; text: string } {
  // Column 0 = Participation Rate (%), Column 1 = e-NPS (-100..100), rest = 0..10
  let score: number; // normalized 0..1
  if (columnIndex === 0) {
    score = Math.max(0, Math.min(1, value / 35));
  } else if (columnIndex === 1) {
    score = Math.max(0, Math.min(1, (value + 50) / 100));
  } else {
    score = Math.max(0, Math.min(1, value / 10));
  }

  if (score < 0.25) return { bg: 'bg-rose-300', text: 'text-rose-900' };
  if (score < 0.45) return { bg: 'bg-orange-200', text: 'text-orange-900' };
  if (score < 0.6)  return { bg: 'bg-amber-100', text: 'text-amber-900' };
  if (score < 0.8)  return { bg: 'bg-lime-200', text: 'text-lime-900' };
  return { bg: 'bg-emerald-300', text: 'text-emerald-900' };
}

function formatCell(columnIndex: number, value: number): string {
  if (columnIndex === 0) return value.toFixed(1);      // Participation Rate %
  if (columnIndex === 1) return `${Math.round(value)}`; // e-NPS integer (may be negative)
  return value.toFixed(1);
}

interface EngagementPanelProps {
  participationRate?: number | null;
  participationChange?: number | null;
}

export default function EngagementPanel({
  participationRate = null,
  participationChange = null,
}: EngagementPanelProps) {
  const [activeTab, setActiveTab] = React.useState<typeof HEATMAP_TABS[number]>('Teams');

  const displayRate = participationRate == null ? '—' : `${participationRate.toFixed(1)}%`;
  const displayChange = participationChange == null ? null : Math.abs(participationChange).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top row: eNPS chart + Participation rate card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* eNPS Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ENPS_RATINGS} margin={{ top: 24, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="rating"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'eNPS Rating', position: 'insideBottom', offset: -15, fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, 30]}
                  ticks={[0, 10, 20, 30]}
                  label={{ value: 'eNPS Score', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12, offset: 10 }}
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

        {/* Participation rate */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <span>Participation rate</span>
            <Info size={14} className="text-gray-400" />
          </div>
          <div className="text-5xl font-bold text-gray-900 leading-none mb-3">{displayRate}</div>
          {displayChange !== null && (
            <div className="flex items-center gap-1 text-sm text-rose-500 font-medium">
              <span>{displayChange}%</span>
              <TrendingDown size={14} />
              <span className="text-gray-500 font-normal">decrease from previous survey</span>
            </div>
          )}
          {displayChange === null && (
            <div className="text-xs text-gray-400">Awaiting prior period data</div>
          )}
        </div>
      </div>

      {/* Engagement Score by Drivers */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Engagement Score by Drivers</h3>
          <p className="text-xs text-gray-500 mt-1">
            This heatmap will show you what are drivers/areas that you need to focus on in a glance and across which team/location/reporting...
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200">
          {HEATMAP_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-2 text-sm transition-all -mb-px border-b-2',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: '6px 4px' }}>
            <thead>
              <tr>
                <th className="w-20 text-left font-normal text-gray-400 pb-2 text-xs">…</th>
                {HEATMAP_COLUMNS.map((col) => (
                  <th key={col} className="text-center font-normal text-gray-500 pb-2 px-1 text-[11px] whitespace-nowrap">
                    <span className="border-b border-dashed border-gray-300 pb-0.5">{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_ROWS.map((row) => (
                <tr key={row.team}>
                  <td className="py-1 pr-2 font-medium text-gray-700 text-sm whitespace-nowrap">
                    {row.team}
                  </td>
                  {row.cells.map((value, colIdx) => {
                    const num = typeof value === 'number' ? value : 0;
                    const { bg, text } = cellColor(colIdx, num);
                    return (
                      <td key={colIdx} className="p-0">
                        <div
                          className={cn(
                            'h-8 min-w-[64px] rounded-md flex items-center justify-center text-xs font-semibold',
                            bg,
                            text
                          )}
                        >
                          {formatCell(colIdx, num)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-400 italic pt-1">
          Sample values shown. Live heatmap will populate once survey data is wired to engagement drivers.
        </p>
      </div>
    </div>
  );
}
