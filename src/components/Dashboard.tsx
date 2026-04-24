import React from 'react';
import { Users, ClipboardCheck, MessageSquare, TrendingUp, ThumbsUp, Calendar } from '../lib/icons';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { Survey } from '../types';
import EngagementPanel from './EngagementPanel';

const StatCard = ({ icon: Icon, label, value, trend, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

function ResponseTrend({ data }: { data: Array<{ name: string; responses: number }> }) {
  const total = data.reduce((sum, d) => sum + d.responses, 0);
  const peakValue = Math.max(1, ...data.map((d) => d.responses));
  const peakDay = data.find((d) => d.responses === peakValue);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-gray-900">Response Trend</h3>
        <span className="text-xs text-gray-400 font-medium">Last 7 days</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <div className="p-5">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <h4 className="text-2xl font-bold text-gray-900 mt-1">{total}</h4>
          <p className="text-xs text-gray-400 mt-1">responses</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 font-medium">Avg / day</p>
          <h4 className="text-2xl font-bold text-gray-900 mt-1">{(total / 7).toFixed(1)}</h4>
          <p className="text-xs text-gray-400 mt-1">over 7 d</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 font-medium">Peak day</p>
          <h4 className="text-2xl font-bold text-gray-900 mt-1">{peakValue}</h4>
          <p className="text-xs text-gray-400 mt-1">on {peakDay?.name ?? '—'}</p>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 h-36 border-t border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 6 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              height={24}
            />
            <YAxis hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: '#4f46e5', strokeOpacity: 0.25, strokeDasharray: '2 4' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopSurveys({ data }: { data: Array<{ name: string; responses: number }> }) {
  const sorted = [...data].sort((a, b) => b.responses - a.responses);
  const max = Math.max(1, ...sorted.map((d) => d.responses));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-gray-900">Top Surveys</h3>
        <span className="text-xs text-gray-400 font-medium">By response volume</span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">No surveys with responses in this range.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((row, i) => (
            <div key={`${row.name}-${i}`} className="px-6 py-3 flex items-center gap-4">
              <span className="text-xs text-gray-400 font-medium tabular-nums w-6">{String(i + 1).padStart(2, '0')}</span>
              <p className="flex-1 text-sm font-medium text-gray-900 truncate">{row.name || 'Untitled'}</p>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(row.responses / max) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 tabular-nums w-10 text-right">{row.responses}</span>
            </div>
          ))}
        </div>
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
    api.get<Survey[]>('/surveys').then(data => setSurveys(data)).catch(() => {});
  }, []);

  const fetchStats = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());
    if (statusFilter) params.append('status', statusFilter);
    if (surveyFilter) params.append('survey_id', surveyFilter);
    const qs = params.toString() ? `?${params}` : '';
    api.get<any>(`/analytics${qs}`)
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => { fetchStats(); }, [startDate, endDate, statusFilter, surveyFilter]);

  const hasFilter = startDate || endDate || statusFilter || surveyFilter;

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSurveyFilter('');
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <Calendar size={18} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-600">Filter:</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setSurveyFilter(''); }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={surveyFilter}
          onChange={e => { setSurveyFilter(e.target.value); setStatusFilter(''); }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px]"
        >
          <option value="">All Surveys</option>
          {surveys.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        {hasFilter && (
          <button onClick={clearFilters}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-all">
            Clear
          </button>
        )}
        {loading && (
          <span className="text-xs text-indigo-400 font-medium animate-pulse ml-auto">Updating...</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard icon={Users} label="Total Responses" value={loading ? '—' : stats?.totalResponses ?? 0} color="bg-indigo-600" />
        <StatCard icon={ClipboardCheck} label="Active Surveys" value={loading ? '—' : stats?.activeSurveys ?? 0} subtitle={`of ${stats?.surveyCount ?? 0} total`} color="bg-emerald-600" />
        <StatCard icon={MessageSquare} label="Completion Rate" value={loading ? '—' : `${stats?.completionRate ?? 0}%`} color="bg-amber-600" />
        <StatCard icon={TrendingUp} label="Avg. CSAT Score" value={loading ? '—' : `${stats?.csat ?? '0.0'}/5`} color="bg-rose-600" />
        <StatCard icon={ThumbsUp} label="NPS Score" value={loading ? '—' : stats?.nps ?? 0} subtitle="Net Promoter Score" color="bg-purple-600" />
      </div>

      {/* Engagement Panel (Responses + Driver Heatmap) */}
      <EngagementPanel
        ratingDistribution={stats?.ratingDistribution ?? null}
        departmentEngagement={stats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* Response Trend + Top Surveys */}
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
