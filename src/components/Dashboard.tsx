import React from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { Survey } from '../types';
import EngagementPanel from './EngagementPanel';

type Stat = {
  index: string;
  label: string;
  value: React.ReactNode;
  caption?: string;
};

function StatCell({ stat, delay }: { stat: Stat; delay: number }) {
  return (
    <div
      className="rise flex flex-col py-5 px-6 border-r border-line last:border-r-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="label tabular" style={{ fontSize: '10px' }}>{stat.index}</span>
        <span className="label">{stat.label}</span>
      </div>
      <div className="mt-3 text-[32px] font-medium tabular leading-none text-ink">
        {stat.value}
      </div>
      {stat.caption && (
        <p className="mt-2 text-xs text-muted tabular">{stat.caption}</p>
      )}
    </div>
  );
}

/**
 * Compact sparkline showing response volume over the last 7 days.
 */
function ResponseTrend({ data }: { data: Array<{ name: string; responses: number }> }) {
  const total = data.reduce((sum, d) => sum + d.responses, 0);
  const peakValue = Math.max(1, ...data.map((d) => d.responses));
  const peakDay = data.find((d) => d.responses === peakValue);

  return (
    <section className="bg-surface border border-line flex flex-col">
      <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
        <div className="flex items-center gap-3">
          <span className="label tabular" style={{ fontSize: '10px' }}>Fig. 03</span>
          <h2 className="text-sm font-medium text-ink">Response Trend</h2>
        </div>
        <span className="label">Last 7 days</span>
      </header>

      <div className="grid grid-cols-3 divide-x divide-line">
        <div className="p-6">
          <div className="label">Total</div>
          <div className="mt-2 text-[32px] font-medium tabular leading-none text-ink">{total}</div>
          <div className="mt-2 label">responses</div>
        </div>
        <div className="p-6">
          <div className="label">Avg / day</div>
          <div className="mt-2 text-[32px] font-medium tabular leading-none text-ink">
            {(total / 7).toFixed(1)}
          </div>
          <div className="mt-2 label">over 7 d</div>
        </div>
        <div className="p-6">
          <div className="label">Peak day</div>
          <div className="mt-2 text-[32px] font-medium tabular leading-none text-ink">
            {peakValue}
          </div>
          <div className="mt-2 label">on {peakDay?.name ?? '—'}</div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1 h-36 border-t border-line">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 6 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5b6472', fontSize: 10, fontFamily: 'Geist Mono' }}
              height={24}
            />
            <YAxis hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: '#1d4ed8', strokeOpacity: 0.25, strokeDasharray: '2 4' }}
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
            <Area
              type="monotone"
              dataKey="responses"
              stroke="#1d4ed8"
              strokeWidth={1.5}
              fill="url(#trendFill)"
              dot={{ r: 2.5, fill: '#1d4ed8', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/**
 * Ranked list of surveys by response count.
 */
function TopSurveys({ data }: { data: Array<{ name: string; responses: number }> }) {
  const sorted = [...data].sort((a, b) => b.responses - a.responses);
  const max = Math.max(1, ...sorted.map((d) => d.responses));

  return (
    <section className="bg-surface border border-line flex flex-col">
      <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
        <div className="flex items-center gap-3">
          <span className="label tabular" style={{ fontSize: '10px' }}>Fig. 04</span>
          <h2 className="text-sm font-medium text-ink">Top Surveys</h2>
        </div>
        <span className="label">By response volume</span>
      </header>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">No surveys with responses in this range.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Survey</th>
              <th style={{ width: '40%' }}>Volume</th>
              <th style={{ textAlign: 'right', width: '70px' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={`${row.name}-${i}`}>
                <td className="tabular text-muted">{String(i + 1).padStart(2, '0')}</td>
                <td className="font-medium truncate max-w-[220px]">{row.name || 'Untitled'}</td>
                <td>
                  <div className="h-1.5 bg-line-2 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent"
                      style={{ width: `${(row.responses / max) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="num tabular">{row.responses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [surveyFilter, setSurveyFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<Survey[]>('/surveys').then((data) => setSurveys(data)).catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());
    if (statusFilter) params.append('status', statusFilter);
    if (surveyFilter) params.append('survey_id', surveyFilter);
    const qs = params.toString() ? `?${params}` : '';
    api.get<any>(`/analytics${qs}`)
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [startDate, endDate, statusFilter, surveyFilter]);

  const hasFilter = startDate || endDate || statusFilter || surveyFilter;
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSurveyFilter('');
  };

  const today = format(new Date(), 'MMM d, yyyy').toUpperCase();

  const statList: Stat[] = [
    {
      index: '01',
      label: 'Total Responses',
      value: loading ? '—' : (stats?.totalResponses ?? 0),
      caption: 'submitted',
    },
    {
      index: '02',
      label: 'Active Surveys',
      value: loading ? '—' : (stats?.activeSurveys ?? 0),
      caption: `of ${stats?.surveyCount ?? 0} total`,
    },
    {
      index: '03',
      label: 'Completion Rate',
      value: loading ? '—' : <>{stats?.completionRate ?? 0}<span className="text-xl text-muted ml-0.5">%</span></>,
      caption: 'of sessions finished',
    },
    {
      index: '04',
      label: 'Avg. CSAT',
      value: loading ? '—' : <>{stats?.csat ?? '0.0'}<span className="text-xl text-muted ml-0.5">/5</span></>,
      caption: 'overall rating',
    },
    {
      index: '05',
      label: 'NPS',
      value: loading ? '—' : (stats?.nps ?? 0),
      caption: 'net promoter',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title strip */}
      <div className="flex items-end justify-between gap-6 border-b border-line pb-4 rise">
        <div>
          <div className="label" style={{ fontSize: '10px' }}>
            Overview · Last Updated {today}
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="label hidden sm:block">
          Customer Survey System
        </div>
      </div>

      {/* Filter bar */}
      <div className="rise bg-surface border border-line" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-sm">
          <span className="label">Filters</span>
          <div className="flex items-center gap-2">
            <span className="label">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 tabular text-ink outline-none focus:border-accent cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-b border-line px-1 py-0.5 tabular text-ink outline-none focus:border-accent cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSurveyFilter(''); }}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Any</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="label">Survey</span>
            <select
              value={surveyFilter}
              onChange={(e) => { setSurveyFilter(e.target.value); setStatusFilter(''); }}
              className="bg-transparent border-b border-line px-1 py-0.5 text-ink outline-none focus:border-accent cursor-pointer max-w-[220px] truncate"
            >
              <option value="">Any</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <button onClick={clearFilters} className="ml-auto label hover:text-accent transition-colors">
              Reset
            </button>
          )}
          {loading && !hasFilter && (
            <span className="ml-auto label animate-pulse">Loading…</span>
          )}
        </div>
      </div>

      {/* KPI band */}
      <section className="bg-surface border border-line rise" style={{ animationDelay: '120ms' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 divide-line">
          {statList.map((s, i) => (
            <StatCell key={s.index} stat={s} delay={140 + i * 40} />
          ))}
        </div>
      </section>

      {/* Engagement panel (responses + department heatmap) */}
      <EngagementPanel
        ratingDistribution={stats?.ratingDistribution ?? null}
        departmentEngagement={stats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* Trend + Top Surveys */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <ResponseTrend data={stats?.responseTrend ?? []} />
        </div>
        <div className="xl:col-span-3">
          <TopSurveys data={stats?.surveyPerformance ?? []} />
        </div>
      </div>
    </div>
  );
}
