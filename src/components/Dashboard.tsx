import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { Survey } from '../types';
import EngagementPanel from './EngagementPanel';
import { DateRangePicker, DateRange } from './ui/DateRangePicker';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Rating } from '@/components/ui/rating';
import { RibbonCell } from '@/components/ui/ribbon-cell';
import { PageHero } from '@/components/ui/page-hero';

const ACCENT = '#134e4a';  // teal-900, matches --primary
const ACCENT_SOFT = 'rgba(19, 78, 74, 0.18)';

/**
 * Horizontal stat ribbon — denser than a grid of cards. A single container
 * with divided columns, eyebrow + big number + optional subtitle/indicator.
 * Enterprise pattern (Stripe, Attio, Mercury all use this).
 */
function StatRibbon({
  stats, loading,
}: {
  stats: any;
  loading: boolean;
}) {
  const fmt = (v: any) => (loading ? '—' : v ?? 0);

  const csatValue = loading ? null : Number(stats?.csat ?? 0);
  const nps = loading ? null : Number(stats?.nps ?? 0);

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
        <RibbonCell label="Total responses" value={fmt(stats?.totalResponses)} />
        <RibbonCell
          label="Active surveys"
          value={fmt(stats?.activeSurveys)}
          subtitle={`of ${stats?.surveyCount ?? 0} total`}
        />
        <RibbonCell
          label="Completion rate"
          value={loading ? '—' : `${stats?.completionRate ?? 0}%`}
        />
        <RibbonCell label="Avg. CSAT">
          <div className="num text-[28px] font-semibold text-foreground leading-none">
            {csatValue == null ? '—' : csatValue.toFixed(1)}
          </div>
          <div className="mt-2.5">
            <Rating value={csatValue} showValue={false} size="sm" />
          </div>
        </RibbonCell>
        <RibbonCell
          label="NPS score"
          value={nps == null ? '—' : nps.toFixed(1)}
          subtitle="net promoter"
          trend={nps != null && nps >= 0 ? 'pos' : nps != null && nps < 0 ? 'neg' : undefined}
        />
      </div>
    </Card>
  );
}

function ResponseTrend({ data }: { data: Array<{ name: string; responses: number }> }) {
  const total = data.reduce((sum, d) => sum + d.responses, 0);
  const peakValue = Math.max(1, ...data.map((d) => d.responses));
  const peakDay = data.find((d) => d.responses === peakValue);

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <div>
          <div className="eyebrow mb-1">response trend</div>
          <CardTitle>Last 7 days</CardTitle>
        </div>
        <span className="num text-[12px] text-muted-foreground">{total} total</span>
      </CardHeader>

      <div className="grid grid-cols-3 divide-x divide-border">
        <MiniStat label="total" value={total} subtitle="responses" />
        <MiniStat label="avg / day" value={(total / 7).toFixed(1)} subtitle="over 7 d" />
        <MiniStat label="peak" value={peakValue} subtitle={`on ${peakDay?.name ?? '—'}`} />
      </div>

      <div className="px-3 pt-2 pb-2 flex-1 min-h-40 border-t border-border">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 6 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8a857e', fontSize: 10, fontFamily: 'Geist Mono, ui-monospace, monospace' }}
              height={22}
            />
            <YAxis hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: ACCENT, strokeOpacity: 0.4, strokeDasharray: '2 4' }}
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #e7e5e0',
                boxShadow: '0 4px 14px -3px rgba(16,24,40,0.08)',
                fontFamily: 'Geist Mono, ui-monospace, monospace',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke={ACCENT}
              strokeWidth={1.5}
              fill="url(#trendFill)"
              dot={{ r: 2.5, fill: ACCENT, strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: ACCENT, stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, subtitle }: { label: string; value: React.ReactNode; subtitle: string }) {
  return (
    <div className="px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className="num mt-1.5 text-[20px] font-semibold leading-none">{value}</div>
      <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function TopSurveys({ data }: { data: Array<{ name: string; responses: number }> }) {
  const sorted = [...data].sort((a, b) => b.responses - a.responses);
  const max = Math.max(1, ...sorted.map((d) => d.responses));

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <div>
          <div className="eyebrow mb-1">top surveys</div>
          <CardTitle>By response volume</CardTitle>
        </div>
      </CardHeader>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-center text-sm text-muted-foreground">
          No surveys with responses in this range.
        </div>
      ) : (
        <div className="flex-1 flex flex-col divide-y divide-border">
          {sorted.map((row, i) => (
            <div key={`${row.name}-${i}`} className="flex-1 min-h-14 px-5 py-3 flex items-center gap-3">
              <span className="num text-[11px] font-medium text-muted-foreground w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="flex-1 text-[13.5px] font-medium text-foreground truncate">
                {row.name || 'Untitled'}
              </p>
              <div className="hidden sm:block w-24 h-1 bg-muted rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(row.responses / max) * 100}%`, background: ACCENT }}
                />
              </div>
              <span className="num text-[13.5px] font-semibold text-foreground w-7 text-right">
                {row.responses}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '', preset: 'all' });
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [surveyFilter, setSurveyFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<Survey[]>('/surveys').then(data => setSurveys(data)).catch(() => {});
  }, []);

  const fetchStats = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('start_date', new Date(dateRange.startDate).toISOString());
    if (dateRange.endDate) params.append('end_date', new Date(dateRange.endDate + 'T23:59:59').toISOString());
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    if (surveyFilter && surveyFilter !== 'all') params.append('survey_id', surveyFilter);
    const qs = params.toString() ? `?${params}` : '';
    api.get<any>(`/analytics${qs}`)
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => { fetchStats(); }, [dateRange.startDate, dateRange.endDate, statusFilter, surveyFilter]);

  const hasFilter = dateRange.preset !== 'all' || statusFilter !== 'all' || surveyFilter !== 'all';

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '', preset: 'all' });
    setStatusFilter('all');
    setSurveyFilter('all');
  };

  return (
    <div className="space-y-7">
      {/* Page hero — editorial Fraunces display */}
      <PageHero
        eyebrow="overview"
        title="Customer Satisfaction"
        description="A consolidated view of every signal collected this period."
        action={
          <div className="flex items-center gap-2 text-[12px]">
            <span
              className={loading ? 'h-2 w-2 rounded-full bg-amber-500 animate-pulse' : 'h-2 w-2 rounded-full bg-emerald-600'}
              aria-hidden
            />
            <span className="eyebrow">{loading ? 'syncing' : 'live'}</span>
          </div>
        }
      />

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow pl-1 pr-2">filters</span>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); if (v !== 'all') setSurveyFilter('all'); }}
          >
            <SelectTrigger className="w-35">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={surveyFilter}
            onValueChange={(v) => { setSurveyFilter(v); if (v !== 'all') setStatusFilter('all'); }}
          >
            <SelectTrigger className="w-55">
              <SelectValue placeholder="All surveys" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surveys</SelectItem>
              {surveys.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
          )}
          {loading && <span className="eyebrow ml-auto animate-pulse">updating</span>}
        </div>
      </Card>

      {/* Dense stat ribbon */}
      <StatRibbon stats={stats} loading={loading} />

      {/* Engagement (responses chart + driver heatmap) */}
      <EngagementPanel
        ratingDistribution={stats?.ratingDistribution ?? null}
        departmentEngagement={stats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* Response Trend + Top Surveys */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 flex">
          <ResponseTrend data={stats?.responseTrend ?? []} />
        </div>
        <div className="xl:col-span-2 flex">
          <TopSurveys data={stats?.surveyPerformance ?? []} />
        </div>
      </div>
    </div>
  );
}
