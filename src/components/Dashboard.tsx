import React from 'react';
import { format } from 'date-fns';
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
    <div className="rise flex flex-col py-5 px-6 border-r border-line last:border-r-0" style={{ animationDelay: `${delay}ms` }}>
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
    <div className="space-y-8 pb-12">
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

      {/* Filter bar — professional compact row */}
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
            <button
              onClick={clearFilters}
              className="ml-auto label hover:text-accent transition-colors"
            >
              Reset
            </button>
          )}
          {loading && !hasFilter && (
            <span className="ml-auto label animate-pulse">Loading…</span>
          )}
        </div>
      </div>

      {/* KPI band — single row of cells divided by hairlines */}
      <section className="bg-surface border border-line rise" style={{ animationDelay: '120ms' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 divide-line">
          {statList.map((s, i) => (
            <StatCell key={s.index} stat={s} delay={140 + i * 40} />
          ))}
        </div>
      </section>

      {/* Engagement panel */}
      <EngagementPanel
        ratingDistribution={stats?.ratingDistribution ?? null}
        completionRate={stats?.completionRate ?? null}
        previousCompletionRate={stats?.previousCompletionRate ?? null}
        departmentEngagement={stats?.departmentEngagement ?? null}
        loading={loading}
      />
    </div>
  );
}
