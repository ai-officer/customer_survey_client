import React from 'react';
import { Users, ClipboardCheck, MessageSquare, TrendingUp, ThumbsUp } from '../lib/icons';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { Survey } from '../types';
import EngagementPanel from './EngagementPanel';
import { DateRangePicker, DateRange } from './ui/DateRangePicker';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const StatCard = ({ icon: Icon, label, value, trend, subtitle }: any) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div className="eyebrow flex items-center gap-1.5">
        {Icon && <Icon size={12} className="opacity-60" />}
        <span>{label}</span>
      </div>
      {trend !== undefined && (
        <span className={`num text-[10.5px] font-medium px-1.5 py-0.5 rounded-sm ${
          trend > 0 ? 'bg-emerald-50 text-emerald-700'
            : trend < 0 ? 'bg-red-50 text-red-700'
            : 'bg-secondary text-muted-foreground'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="num mt-4 text-[30px] font-semibold leading-none text-foreground">
      {value}
    </div>
    {subtitle && (
      <p className="text-[11.5px] text-muted-foreground mt-2">{subtitle}</p>
    )}
  </Card>
);

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
        <Badge variant="outline"><span className="num">{total}</span>&nbsp;total</Badge>
      </CardHeader>

      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-5 py-4">
          <div className="eyebrow">total</div>
          <div className="num mt-2 text-[22px] font-semibold leading-none">{total}</div>
          <p className="text-[11px] text-muted-foreground mt-2">responses</p>
        </div>
        <div className="px-5 py-4">
          <div className="eyebrow">avg / day</div>
          <div className="num mt-2 text-[22px] font-semibold leading-none">{(total / 7).toFixed(1)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">over 7 d</p>
        </div>
        <div className="px-5 py-4">
          <div className="eyebrow">peak day</div>
          <div className="num mt-2 text-[22px] font-semibold leading-none">{peakValue}</div>
          <p className="text-[11px] text-muted-foreground mt-2">on {peakDay?.name ?? '—'}</p>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 flex-1 min-h-[10rem] border-t border-border">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 6 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#78716c', fontSize: 10, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              height={22}
            />
            <YAxis hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: '#f59e0b', strokeOpacity: 0.4, strokeDasharray: '2 4' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e7e5e4',
                boxShadow: '0 4px 12px -3px rgba(0,0,0,0.08)',
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke="#f59e0b"
              strokeWidth={1.75}
              fill="url(#trendFill)"
              dot={{ r: 2.5, fill: '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
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
            <div key={`${row.name}-${i}`} className="flex-1 min-h-[56px] px-5 py-3 flex items-center gap-3">
              <span className="num text-[11px] font-medium text-muted-foreground w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="flex-1 text-sm font-medium text-foreground truncate">
                {row.name || 'Untitled'}
              </p>
              <div className="hidden sm:block w-20 h-1 bg-secondary rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(row.responses / max) * 100}%` }}
                />
              </div>
              <span className="num text-sm font-semibold text-foreground w-7 text-right">
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

  const fmt = (v: any) => (loading ? '—' : v ?? 0);

  return (
    <div className="space-y-7">
      {/* Page eyebrow + live status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">dashboard</div>
          <h1 className="heading text-[24px] font-semibold text-foreground mt-1 leading-tight">
            Customer Satisfaction Overview
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`}
            aria-hidden
          />
          <span className="eyebrow">{loading ? 'syncing' : 'live'}</span>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow pl-1 pr-2">filters</span>

          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); if (v !== 'all') setSurveyFilter('all'); }}
          >
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[220px]">
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Reset
            </Button>
          )}

          {loading && (
            <span className="eyebrow ml-auto text-primary animate-pulse">updating</span>
          )}
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="total responses" value={fmt(stats?.totalResponses)} />
        <StatCard
          icon={ClipboardCheck}
          label="active surveys"
          value={fmt(stats?.activeSurveys)}
          subtitle={`of ${stats?.surveyCount ?? 0} total`}
        />
        <StatCard
          icon={MessageSquare}
          label="completion rate"
          value={loading ? '—' : `${stats?.completionRate ?? 0}%`}
        />
        <StatCard
          icon={TrendingUp}
          label="avg. CSAT"
          value={loading ? '—' : `${stats?.csat ?? '0.0'}/5`}
        />
        <StatCard
          icon={ThumbsUp}
          label="NPS score"
          value={fmt(stats?.nps)}
          subtitle="net promoter"
        />
      </div>

      {/* Engagement panel (Responses + Driver Heatmap) */}
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
