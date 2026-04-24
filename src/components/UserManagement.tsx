import React from 'react';
import { Plus, Edit2, UserX, X, KeyRound, Eye, EyeOff } from '../lib/icons';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

const ROLES: UserRole[] = ['admin', 'manager'];

const roleBadge = (role: UserRole) => {
  const styles: Record<UserRole, string> = {
    admin: 'bg-red-50 text-red-700 border-red-100',
    manager: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', styles[role])}>
      {role}
    </span>
  );
};

// ── User Modal ────────────────────────────────────────────────────────────────

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: () => void;
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
  const isEdit = !!user;
  const [email, setEmail] = React.useState(user?.email || '');
  const [fullName, setFullName] = React.useState(user?.full_name || '');
  const [role, setRole] = React.useState<UserRole>(user?.role || 'manager');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        const body: any = { full_name: fullName, role };
        if (password) body.password = password;
        await api.put(`/users/${user!.id}`, body);
      } else {
        await api.post('/users', { email, full_name: fullName, role, password });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit User' : 'Create User'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isEdit ? (
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} className="text-gray-400" />
                  Reset Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </span>
              ) : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? 'Enter new password to reset' : ''}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalUser, setModalUser] = React.useState<User | null | undefined>(undefined);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get<User[]>('/users')
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => { fetchUsers(); }, []);

  const deactivate = async (user: User) => {
    if (!confirm(`Deactivate ${user.full_name}?`)) return;
    setActionLoading(user.id);
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">Manage system staff accounts</p>
        </div>
        <button
          onClick={() => setModalUser(null)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" /> Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4">{roleBadge(user.role)}</td>
                <td className="px-6 py-4">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    user.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-gray-50 text-gray-500 border-gray-100'
                  )}>
                    {user.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setModalUser(user)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user.is_active && (
                      <button
                        onClick={() => deactivate(user)}
                        disabled={actionLoading === user.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Deactivate"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalUser !== undefined && (
        <UserModal user={modalUser} onClose={() => setModalUser(undefined)} onSave={fetchUsers} />
      )}
    </div>
  );
}
