import React from 'react';
import { Users, ClipboardCheck, MessageSquare, TrendingUp, ThumbsUp, Calendar, Star, Building2, UserCog } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { api } from '../lib/api';
import { Survey } from '../types';
import { useAuth } from '../context/AuthContext';

const RATING_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];
const DEPT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#22c55e'];

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
  const { isAdmin } = useAuth();
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Response Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.responseTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="responses" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Survey Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.surveyPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="responses" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rating Scale Distribution + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Star size={18} className="text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Rating Scale Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(stats?.ratingDistribution || []).map((r: any) => ({ name: `${r.rating}★`, count: r.count, rating: r.rating }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {(stats?.ratingDistribution || []).map((_: any, i: number) => (
                    <Cell key={`rating-cell-${i}`} fill={RATING_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(!stats?.ratingDistribution || stats.ratingDistribution.every((r: any) => r.count === 0)) && (
            <p className="text-center text-xs text-gray-400 mt-3 italic">No rating responses yet.</p>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={18} className="text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">Team / Department Breakdown</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentBreakdown || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="department" type="category" axisLine={false} tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="responses" radius={[0, 6, 6, 0]} barSize={22}>
                  {(stats?.departmentBreakdown || []).map((_: any, i: number) => (
                    <Cell key={`dept-cell-${i}`} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(!stats?.departmentBreakdown || stats.departmentBreakdown.length === 0) && (
            <p className="text-center text-xs text-gray-400 mt-3 italic">No department data yet.</p>
          )}
        </div>
      </div>

      {/* Admin-only: Survey breakdown by creator */}
      {isAdmin && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <UserCog size={18} className="text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900">Admin · Responses by Survey Owner</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">Admin View</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.adminSurveyBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="responses" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(!stats?.adminSurveyBreakdown || stats.adminSurveyBreakdown.length === 0) && (
            <p className="text-center text-xs text-gray-400 mt-3 italic">No responses tied to a survey owner yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
