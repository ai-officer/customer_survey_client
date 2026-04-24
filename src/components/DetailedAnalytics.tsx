import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Download, UserRound, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { Survey, SurveyResponse } from '../types';
import EngagementPanel from './EngagementPanel';
import { FilterBar, DateRangeControl, DateRange } from './ui/FilterBar';

const COLORS = ['#1d4ed8', '#0f766e', '#d97706', '#b91c1c', '#7c3aed'];

type KpiStat = {
  index: string;
  label: string;
  value: React.ReactNode;
  caption?: string;
};

function KpiCell({ stat }: { stat: KpiStat }) {
  return (
    <div className="flex flex-col py-5 px-6 border-r border-line last:border-r-0">
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

function PanelHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
      <div className="flex items-center gap-3">
        <span className="w-1 h-4 bg-accent" aria-hidden />
        <h2 className="text-sm font-medium text-ink">{title}</h2>
      </div>
      {meta && <span className="label">{meta}</span>}
    </header>
  );
}

export default function DetailedAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '', preset: 'all' });
  const [exporting, setExporting] = React.useState(false);
  const [responses, setResponses] = React.useState<SurveyResponse[]>([]);
  const [surveyMeta, setSurveyMeta] = React.useState<Survey | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [responsesError, setResponsesError] = React.useState('');
  const [dashStats, setDashStats] = React.useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('start_date', new Date(dateRange.startDate).toISOString());
    if (dateRange.endDate) params.append('end_date', new Date(dateRange.endDate).toISOString());
    const qs = params.toString() ? `?${params}` : '';

    // Per-survey analytics (custom shape)
    api.get<any>(`/analytics/${id}${qs}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Dashboard analytics scoped to this survey — provides ratingDistribution,
    // completionRate, previousCompletionRate, and departmentEngagement for the panel.
    const dashParams = new URLSearchParams(params);
    dashParams.append('survey_id', id || '');
    api.get<any>(`/analytics?${dashParams.toString()}`)
      .then(d => setDashStats(d))
      .catch(() => setDashStats(null));
  };

  const fetchResponses = () => {
    setResponsesError('');
    Promise.all([
      api.get<Survey>(`/surveys/${id}`),
      api.get<SurveyResponse[]>(`/responses?survey_id=${id}`),
    ])
      .then(([s, r]) => { setSurveyMeta(s); setResponses(r); })
      .catch((err: any) => setResponsesError(err?.message || 'Unable to load responses'));
  };

  React.useEffect(() => { fetchData(); fetchResponses(); }, [id, dateRange.startDate, dateRange.endDate]);

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/export/responses/${id}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_responses_${id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => setDateRange({ startDate: '', endDate: '', preset: 'all' });
  const hasFilter = dateRange.preset !== 'all';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-muted label">Loading detailed analytics…</div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-muted label">Failed to load analytics</div>
    </div>
  );

  const kpiStats: KpiStat[] = [
    {
      index: '01',
      label: 'Total Responses',
      value: data.totalResponses,
      caption: 'submitted',
    },
    {
      index: '02',
      label: 'Response Rate',
      value: data.responseRate,
      caption: 'of distributed emails',
    },
    {
      index: '03',
      label: 'Completion Rate',
      value: data.completionRate,
      caption: 'of sessions finished',
    },
    {
      index: '04',
      label: 'NPS Score',
      value: data.nps,
      caption: `CSAT ${data.csat}/5`,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      {/* Title strip */}
      <div className="flex items-end justify-between gap-6 border-b border-line pb-4 rise">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center label hover:text-accent transition-colors mb-2"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Back
          </button>
          <div className="label" style={{ fontSize: '10px' }}>
            Detailed Performance Report
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink tracking-tight">
            {data.surveyTitle}
          </h1>
        </div>
        <div className="label hidden sm:block">
          Survey Analytics
        </div>
      </div>

      {/* Filter + Export bar */}
      <FilterBar onReset={hasFilter ? resetFilters : undefined} className="rise" loading={loading && !hasFilter}>
        <DateRangeControl value={dateRange} onChange={setDateRange} />
        <div className="ml-auto flex items-center gap-2">
          <span className="label">Export</span>
          {(['csv', 'xlsx', 'pdf'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={exporting}
              className="flex items-center border border-line text-muted hover:text-accent hover:border-accent px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50"
            >
              <Download size={13} className="mr-1.5" /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </FilterBar>

      {/* KPI band */}
      <section className="bg-surface border border-line rise">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-line">
          {kpiStats.map((s) => (
            <KpiCell key={s.index} stat={s} />
          ))}
        </div>
      </section>

      {/* Engagement Panel (Response distribution + Department heatmap) */}
      <EngagementPanel
        ratingDistribution={dashStats?.ratingDistribution ?? null}
        departmentEngagement={dashStats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-line flex flex-col">
          <PanelHeader title="CSAT Score Over Time" meta="1–5 scale" />
          <div className="px-4 pt-4 pb-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.csatOverTime} margin={{ top: 16, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="0" stroke="#eff1f4" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: '#e3e5ea' }}
                  tickLine={false}
                  tick={{ fill: '#5b6472', fontSize: 11, fontFamily: 'Geist Mono' }}
                  height={30}
                />
                <YAxis
                  domain={[0, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5b6472', fontSize: 11, fontFamily: 'Geist Mono' }}
                  width={32}
                />
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
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1d4ed8"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#1d4ed8', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-surface border border-line flex flex-col">
          <PanelHeader title="Common Feedback Themes" meta={`${data.commonThemes.length} themes`} />
          {data.commonThemes.length > 0 ? (
            <div className="px-4 pt-4 pb-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.commonThemes} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#eff1f4" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="theme"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#5b6472', fontSize: 11, fontFamily: 'Geist Mono' }}
                    width={100}
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
                  <Bar dataKey="count" barSize={20}>
                    {data.commonThemes.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted italic text-sm">
              No text responses collected yet
            </div>
          )}
        </section>
      </div>

      {/* Individual Responses */}
      <section className="bg-surface border border-line">
        <PanelHeader title="Individual Responses" meta={`${responses.length} submission${responses.length === 1 ? '' : 's'}`} />
        <div className="p-6 md:p-8">
          <p className="label mb-4">Visible to the survey owner and administrators</p>

          {responsesError && (
            <div className="p-3 mb-4 bg-canvas border border-line text-sm" style={{ color: 'var(--color-negative)' }}>
              {responsesError}
            </div>
          )}

          {responses.length === 0 && !responsesError ? (
            <div className="text-center py-12 text-muted italic">No responses yet.</div>
          ) : (
            <div className="divide-y divide-line border-t border-b border-line">
              {responses.map((r) => {
                const isOpen = expandedId === r.id;
                const displayName = r.isAnonymous
                  ? 'Anonymous'
                  : (r.respondentName?.trim() || 'Unnamed respondent');
                return (
                  <div key={r.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent-soft/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${r.isAnonymous ? 'bg-line-2 text-muted' : 'bg-accent-soft text-accent'}`}>
                          {r.isAnonymous ? <EyeOff size={16} /> : <UserRound size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{displayName}</p>
                          <p className="label tabular mt-0.5">
                            {r.submittedAt ? format(new Date(r.submittedAt), 'MMM d, yyyy · h:mm a') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {!r.is_complete && (
                          <span className="label border border-line px-2 py-0.5">
                            Incomplete
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-3 bg-canvas border-t border-line space-y-3">
                        {(surveyMeta?.questions || []).map((q) => {
                          const val = r.answers?.[q.id];
                          const display =
                            val === undefined || val === null || val === ''
                              ? <span className="text-muted italic">No answer</span>
                              : typeof val === 'number'
                              ? <span className="font-medium text-accent tabular">{val} / 5</span>
                              : String(val);
                          return (
                            <div key={q.id} className="text-sm">
                              <p className="label mb-0.5">{q.text || '(untitled question)'}</p>
                              <p className="text-ink-2 break-words whitespace-pre-wrap">{display}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Open-ended responses */}
      <section className="bg-surface border border-line">
        <PanelHeader title="Open-Ended Responses" meta={`${data.openEndedResponses.length} responses`} />
        <div className="p-6 md:p-8">
          <div className="space-y-4">
            {data.openEndedResponses.length > 0 ? (
              data.openEndedResponses.map((resp: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 bg-canvas border border-line flex items-start gap-4"
                >
                  <div className="mt-0.5 p-1.5 bg-surface border border-line text-muted">
                    <MessageSquare size={14} />
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed italic">"{resp}"</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-muted italic">
                No open-ended responses collected yet for this survey.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
