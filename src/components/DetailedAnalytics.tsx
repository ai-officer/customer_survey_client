import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, MessageSquare, PieChart as PieChartIcon, ThumbsUp, Download, Calendar, UserRound, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { Survey, SurveyResponse } from '../types';
import EngagementPanel from './EngagementPanel';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DetailedAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [responses, setResponses] = React.useState<SurveyResponse[]>([]);
  const [surveyMeta, setSurveyMeta] = React.useState<Survey | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [responsesError, setResponsesError] = React.useState('');
  const [dashStats, setDashStats] = React.useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());
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

  React.useEffect(() => { fetchData(); fetchResponses(); }, [id, startDate, endDate]);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-gray-400 font-medium">Loading detailed analytics...</div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-400">Failed to load analytics</div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>
        <div className="md:text-right">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{data.surveyTitle}</h2>
          <p className="text-sm text-gray-500">Detailed Performance Report</p>
        </div>
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <Calendar size={16} className="text-gray-400" />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); }}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-all">
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Export:</span>
          {(['csv', 'xlsx', 'pdf'] as const).map(fmt => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={exporting}
              className="flex items-center px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-50">
              <Download size={13} className="mr-1" /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20} /></div>
            <span className="text-sm font-medium text-gray-500">Total Responses</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data.totalResponses}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            <span className="text-sm font-medium text-gray-500">Response Rate</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data.responseRate}</h3>
          <p className="text-xs text-gray-400 mt-2">Based on distributed emails</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><PieChartIcon size={20} /></div>
            <span className="text-sm font-medium text-gray-500">Completion Rate</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data.completionRate}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ThumbsUp size={20} /></div>
            <span className="text-sm font-medium text-gray-500">NPS Score</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data.nps}</h3>
          <p className="text-xs text-gray-400 mt-2">CSAT: {data.csat}/5</p>
        </div>
      </div>

      {/* Engagement Panel (Rating distribution + Participation + Driver Heatmap) */}
      <EngagementPanel
        ratingDistribution={dashStats?.ratingDistribution ?? null}
        completionRate={dashStats?.completionRate ?? null}
        previousCompletionRate={dashStats?.previousCompletionRate ?? null}
        departmentEngagement={dashStats?.departmentEngagement ?? null}
        loading={loading}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">CSAT Score Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.csatOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Common Feedback Themes</h3>
          {data.commonThemes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.commonThemes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="theme" type="category" axisLine={false} tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={100} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {data.commonThemes.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 italic text-sm">
              No text responses collected yet
            </div>
          )}
        </div>
      </div>

      {/* Individual Responses */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Individual Responses</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Visible to the survey owner and administrators.
            </p>
          </div>
          <span className="text-sm text-gray-400">{responses.length} submission{responses.length === 1 ? '' : 's'}</span>
        </div>

        {responsesError && (
          <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
            {responsesError}
          </div>
        )}

        {responses.length === 0 && !responsesError ? (
          <div className="text-center py-12 text-gray-400 italic">No responses yet.</div>
        ) : (
          <div className="space-y-2">
            {responses.map((r) => {
              const isOpen = expandedId === r.id;
              const displayName = r.isAnonymous
                ? 'Anonymous'
                : (r.respondentName?.trim() || 'Unnamed respondent');
              return (
                <div key={r.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${r.isAnonymous ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        {r.isAnonymous ? <EyeOff size={16} /> : <UserRound size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500">
                          {r.submittedAt ? format(new Date(r.submittedAt), 'MMM d, yyyy · h:mm a') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!r.is_complete && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-medium border border-amber-100">
                          Incomplete
                        </span>
                      )}
                      {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-100 space-y-3">
                      {(surveyMeta?.questions || []).map((q) => {
                        const val = r.answers?.[q.id];
                        const display =
                          val === undefined || val === null || val === ''
                            ? <span className="text-gray-400 italic">No answer</span>
                            : typeof val === 'number'
                            ? <span className="font-semibold text-indigo-600">{val} / 5</span>
                            : String(val);
                        return (
                          <div key={q.id} className="text-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{q.text || '(untitled question)'}</p>
                            <p className="text-gray-800 break-words whitespace-pre-wrap">{display}</p>
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

      {/* Open-ended responses */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Open-Ended Responses</h3>
          <span className="text-sm text-gray-400">{data.openEndedResponses.length} responses</span>
        </div>
        <div className="space-y-4">
          {data.openEndedResponses.length > 0 ? (
            data.openEndedResponses.map((resp: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-4">
                <div className="mt-1 p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400">
                  <MessageSquare size={14} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">"{resp}"</p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 italic">
              No open-ended responses collected yet for this survey.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
