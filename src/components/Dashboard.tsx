import React from 'react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { Survey } from '../types';
import EngagementPanel from './EngagementPanel';

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  caption?: string;
  delay?: number;
  accent?: boolean;
};

function StatTile({ label, value, caption, delay = 0, accent = false }: StatTileProps) {
  return (
    <div
      className="rise relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted font-medium">
          {label}
        </span>
        <span className="flex-1 rule-dash" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`font-display tabular text-5xl md:text-6xl font-light leading-none ${accent ? 'text-accent' : 'text-ink'}`}
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
        >
          {value}
        </span>
      </div>
      {caption && (
        <p className="mt-2 text-xs text-muted italic font-display">{caption}</p>
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
    api
      .get<any>(`/analytics${qs}`)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [startDate, endDate, statusFilter, surveyFilter]);

  const hasFilter = startDate || endDate || statusFilter || surveyFilter;
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSurveyFilter('');
  };

  const today = format(new Date(), 'MMMM d, yyyy');

  return (
    <div className="relative space-y-10 pb-16">
      {/* Editorial masthead */}
      <header className="rise relative border-b border-line pb-8">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-muted">
          <span className="inline-block w-6 h-px bg-accent" />
          <span>Observatory</span>
          <span className="text-line">·</span>
          <span className="tabular">{today}</span>
        </div>

        <h1 className="mt-4 font-display text-6xl md:text-7xl font-light text-ink leading-[0.95] tracking-tight">
          At a glance.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted font-display italic">
          A quiet overview of what your customers are telling you — pulled live from the field, cast in ink.
        </p>
      </header>

      {/* Filter strip — flush with editorial style */}
      <div
        className="rise flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-3 text-sm"
        style={{ animationDelay: '80ms' }}
      >
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted font-medium">
          Lens
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none outline-none text-ink font-display italic focus:text-accent cursor-pointer"
          />
          <span className="text-muted">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none outline-none text-ink font-display italic focus:text-accent cursor-pointer"
          />
        </div>
        <span className="text-line">|</span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSurveyFilter('');
          }}
          className="bg-transparent text-ink font-display italic outline-none cursor-pointer hover:text-accent"
        >
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-line">|</span>
        <select
          value={surveyFilter}
          onChange={(e) => {
            setSurveyFilter(e.target.value);
            setStatusFilter('');
          }}
          className="bg-transparent text-ink font-display italic outline-none cursor-pointer hover:text-accent max-w-[240px] truncate"
        >
          <option value="">All surveys</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="ml-auto text-[11px] uppercase tracking-[0.22em] text-muted hover:text-accent transition-colors"
          >
            Reset
          </button>
        )}
        {loading && !hasFilter && (
          <span className="ml-auto text-[11px] uppercase tracking-[0.22em] text-muted animate-pulse">
            Pulling data…
          </span>
        )}
      </div>

      {/* Five figures, editorial style */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-8 gap-y-10">
        <StatTile
          delay={120}
          label="I · Responses"
          value={loading ? '—' : stats?.totalResponses ?? 0}
          caption="submitted, in sum"
          accent
        />
        <StatTile
          delay={170}
          label="II · Active"
          value={loading ? '—' : stats?.activeSurveys ?? 0}
          caption={`of ${stats?.surveyCount ?? 0} surveys`}
        />
        <StatTile
          delay={220}
          label="III · Completion"
          value={loading ? '—' : <>{stats?.completionRate ?? 0}<span className="text-3xl text-muted">%</span></>}
          caption="of sessions finished"
        />
        <StatTile
          delay={270}
          label="IV · CSAT"
          value={loading ? '—' : <>{stats?.csat ?? '0.0'}<span className="text-3xl text-muted">/5</span></>}
          caption="average sentiment"
        />
        <StatTile
          delay={320}
          label="V · NPS"
          value={loading ? '—' : stats?.nps ?? 0}
          caption="net promoter"
        />
      </section>

      {/* Section rule */}
      <div className="rise flex items-center gap-4 pt-2" style={{ animationDelay: '380ms' }}>
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted font-medium">
          The panel
        </span>
        <span className="flex-1 rule-dash" />
        <span className="font-display italic text-muted text-sm">drivers · teams · responses</span>
      </div>

      {/* Engagement panel */}
      <div className="rise" style={{ animationDelay: '440ms' }}>
        <EngagementPanel
          ratingDistribution={stats?.ratingDistribution ?? null}
          completionRate={stats?.completionRate ?? null}
          previousCompletionRate={stats?.previousCompletionRate ?? null}
          departmentEngagement={stats?.departmentEngagement ?? null}
          loading={loading}
        />
      </div>
    </div>
  );
}
