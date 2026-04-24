import React from 'react';
import { Users, ClipboardCheck, MessageSquare, TrendingUp, ThumbsUp, Calendar } from 'lucide-react';
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

export default function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [surveyFilter, setSurveyFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // Load survey list for the picker (non-archived by default)
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

      {/* Engagement Panel (Rating distribution + Participation + Driver Heatmap) */}
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
