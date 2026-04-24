import React from 'react';
import { Shield, Search } from '../lib/icons';
import { format } from 'date-fns';
import { AuditLog } from '../types';
import { api } from '../lib/api';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-50 text-blue-700',
  REGISTER: 'bg-indigo-50 text-indigo-700',
  CREATE_SURVEY: 'bg-emerald-50 text-emerald-700',
  UPDATE_SURVEY: 'bg-amber-50 text-amber-700',
  DELETE_SURVEY: 'bg-red-50 text-red-700',
  DUPLICATE_SURVEY: 'bg-purple-50 text-purple-700',
  DISTRIBUTE_SURVEY: 'bg-cyan-50 text-cyan-700',
  REMIND_NON_RESPONDENTS: 'bg-orange-50 text-orange-700',
  SUBMIT_RESPONSE: 'bg-teal-50 text-teal-700',
  CREATE_USER: 'bg-green-50 text-green-700',
  UPDATE_USER: 'bg-yellow-50 text-yellow-700',
  DEACTIVATE_USER: 'bg-red-50 text-red-700',
};

export default function AuditLogs() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    api.get<AuditLog[]>('/audit-logs?limit=200')
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log =>
    !search ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.detail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500">Complete trail of all user actions in the system</p>
        </div>
        <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-100">
          <Shield size={14} />
          <span>Admin Only</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by action, user, or detail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading audit logs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No logs found</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-600'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{log.user_email || <span className="text-gray-300 italic">anonymous</span>}</td>
                <td className="px-6 py-3 text-sm text-gray-600 capitalize">{log.resource}</td>
                <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{log.detail || '—'}</td>
                <td className="px-6 py-3 text-xs text-gray-400 font-mono">{log.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
