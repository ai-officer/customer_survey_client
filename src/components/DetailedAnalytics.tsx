import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, UserRound, EyeOff, ChevronDown, ChevronUp, MessageSquare,
} from '../lib/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { Survey, SurveyResponse } from '../types';
import EngagementPanel from './EngagementPanel';
import { DateRangePicker, DateRange } from './ui/DateRangePicker';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RibbonCell } from '@/components/ui/ribbon-cell';
import { PageHero } from '@/components/ui/page-hero';
import { Rating } from '@/components/ui/rating';

const ACCENT = '#134e4a';

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
    if (dateRange.endDate) params.append('end_date', new Date(dateRange.endDate + 'T23:59:59').toISOString());
    const qs = params.toString() ? `?${params}` : '';

    api.get<any>(`/analytics/${id}${qs}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

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

  const handleExport = async (fmt: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/export/responses/${id}?format=${fmt}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_responses_${id}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="eyebrow animate-pulse">loading analytics</div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[13px] text-muted-foreground">Failed to load analytics.</div>
    </div>
  );

  const csatNumber = Number(data.csat) || 0;

  return (
    <div className="space-y-7 pb-12">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Back to surveys
      </button>

      {/* Editorial hero */}
      <PageHero
        eyebrow="survey analytics"
        title={data.surveyTitle}
        description="Detailed performance, response distribution, and individual submissions."
        action={
          <div className="flex items-center gap-1.5">
            {(['csv', 'xlsx', 'pdf'] as const).map(fmt => (
              <Button
                key={fmt}
                variant="outline"
                size="sm"
                onClick={() => handleExport(fmt)}
                disabled={exporting}
              >
                <Download size={13} /> {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow pl-1 pr-2 shrink-0">filters</span>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {dateRange.preset !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ startDate: '', endDate: '', preset: 'all' })}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* KPI ribbon */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <RibbonCell label="Total responses" value={data.totalResponses} />
          <RibbonCell
            label="Response rate"
            value={data.responseRate}
            subtitle="of distributed emails"
          />
          <RibbonCell label="Completion rate" value={data.completionRate} />
          <RibbonCell label="Avg. CSAT">
            <div className="num text-[28px] font-semibold leading-none mt-1">{data.csat}</div>
            <div className="mt-2.5">
              <Rating value={csatNumber} showValue={false} size="sm" />
            </div>
          </RibbonCell>
        </div>
      </Card>

      {/* Engagement Panel (Response distribution + Driver heatmap) */}
      <EngagementPanel
        ratingDistribution={dashStats?.ratingDistribution ?? null}
        departmentEngagement={dashStats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* CSAT trend + Common themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <div className="eyebrow mb-1">csat over time</div>
              <CardTitle>Score trend</CardTitle>
            </div>
            <span className="num text-[12px] text-muted-foreground">{data.csat} avg</span>
          </CardHeader>
          <div className="px-3 pt-2 pb-3 flex-1 min-h-64">
            {data.csatOverTime.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-muted-foreground italic">
                No rating responses yet — chart will populate as responses come in.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.csatOverTime} margin={{ top: 8, right: 12, left: -8, bottom: 6 }}>
                <defs>
                  <linearGradient id="csat-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e7e5e0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a857e', fontSize: 11, fontFamily: 'Geist Mono, ui-monospace, monospace' }}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a857e', fontSize: 11, fontFamily: 'Geist Mono, ui-monospace, monospace' }}
                />
                <Tooltip
                  cursor={{ stroke: ACCENT, strokeOpacity: 0.4, strokeDasharray: '2 4' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e7e5e0',
                    boxShadow: '0 4px 14px -3px rgba(16,24,40,0.08)',
                    fontFamily: 'Geist Mono, ui-monospace, monospace',
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={ACCENT}
                  strokeWidth={1.75}
                  fill="url(#csat-fill)"
                  dot={{ r: 2.5, fill: ACCENT, strokeWidth: 0 }}
                  activeDot={{ r: 4.5, fill: ACCENT, stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <div className="eyebrow mb-1">common themes</div>
              <CardTitle>From open-ended responses</CardTitle>
            </div>
            <span className="num text-[12px] text-muted-foreground">
              {data.commonThemes.length} {data.commonThemes.length === 1 ? 'theme' : 'themes'}
            </span>
          </CardHeader>
          {data.commonThemes.length > 0 ? (
            <div className="px-5 py-5 flex-1 flex flex-col justify-center space-y-3">
              {data.commonThemes.slice(0, 6).map((t: { theme: string; count: number }, i: number) => {
                const max = Math.max(1, ...data.commonThemes.map((x: { count: number }) => x.count));
                return (
                  <motion.div
                    key={t.theme}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 text-[13px]"
                  >
                    <span className="num text-[10.5px] text-muted-foreground w-5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="w-32 truncate text-foreground capitalize">{t.theme}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(t.count / max) * 100}%` }}
                        transition={{ delay: i * 0.04 + 0.1, duration: 0.4, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: ACCENT }}
                      />
                    </div>
                    <span className="num text-foreground w-7 text-right">{t.count}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 min-h-64 flex items-center justify-center text-[13px] text-muted-foreground italic">
              No text responses collected yet.
            </div>
          )}
        </Card>
      </div>

      {/* Individual responses */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <div className="eyebrow mb-1">individual responses</div>
            <CardTitle>{responses.length} submission{responses.length === 1 ? '' : 's'}</CardTitle>
          </div>
          <span className="eyebrow">visible to owner & admins</span>
        </CardHeader>

        {responsesError && (
          <div className="mx-5 mt-4 px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
            <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
            {responsesError}
          </div>
        )}

        {responses.length === 0 && !responsesError ? (
          <div className="py-12 text-center text-[13px] text-muted-foreground italic">
            No responses yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {responses.map((r) => {
              const isOpen = expandedId === r.id;
              const displayName = r.isAnonymous
                ? 'Anonymous'
                : (r.respondentName?.trim() || 'Unnamed respondent');
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 border ${
                          r.isAnonymous
                            ? 'bg-secondary text-muted-foreground border-border'
                            : 'bg-foreground text-primary-foreground border-foreground'
                        }`}
                      >
                        {r.isAnonymous ? <EyeOff size={14} /> : <UserRound size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-foreground truncate leading-tight">
                          {displayName}
                        </p>
                        <p className="eyebrow mt-1">
                          {r.submittedAt ? format(new Date(r.submittedAt), 'MMM d, yyyy · h:mm a') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!r.is_complete && (
                        <Badge variant="warning" className="normal-case tracking-normal">
                          incomplete
                        </Badge>
                      )}
                      {isOpen
                        ? <ChevronUp size={16} className="text-muted-foreground" />
                        : <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />}
                    </div>
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden bg-secondary/30 border-t border-border"
                    >
                      <div className="px-5 py-4 space-y-3">
                        {(surveyMeta?.questions || []).map((q) => {
                          const val = r.answers?.[q.id];
                          const display =
                            val === undefined || val === null || val === ''
                              ? <span className="text-muted-foreground italic">No answer</span>
                              : typeof val === 'number'
                              ? <span className="num font-semibold text-foreground">{val} / 5</span>
                              : String(val);
                          return (
                            <div key={q.id} className="text-[13px]">
                              <div className="eyebrow mb-1">{q.text || '(untitled question)'}</div>
                              <div className="text-foreground break-words whitespace-pre-wrap">{display}</div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Open-ended */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <div className="eyebrow mb-1">open-ended responses</div>
            <CardTitle>Verbatim feedback</CardTitle>
          </div>
          <span className="num text-[12px] text-muted-foreground">
            {data.openEndedResponses.length}
          </span>
        </CardHeader>
        {data.openEndedResponses.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.openEndedResponses.map((resp: string, i: number) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="px-5 py-4 flex items-start gap-3"
              >
                <div className="h-6 w-6 mt-0.5 rounded-md bg-secondary text-muted-foreground border border-border flex items-center justify-center shrink-0">
                  <MessageSquare size={12} />
                </div>
                <p className="text-[13px] text-foreground leading-relaxed italic">"{resp}"</p>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-[13px] text-muted-foreground italic">
            No open-ended responses collected yet.
          </div>
        )}
      </Card>
    </div>
  );
}
