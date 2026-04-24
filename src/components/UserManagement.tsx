import React from 'react';
import { Plus, Edit2, UserX, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

const ROLES: UserRole[] = ['admin', 'manager'];

const roleBadge = (role: UserRole) => {
  const base = 'px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] font-mono';
  const styles: Record<UserRole, string> = {
    admin: 'bg-ink text-canvas',
    manager: 'border border-line text-muted',
  };
  return <span className={cn(base, styles[role])}>{role}</span>;
};

// ── Password Input ────────────────────────────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-line focus:border-accent outline-none px-1 py-1.5 pr-8 text-sm text-ink placeholder:text-muted-2"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-surface border border-line max-w-md w-full shadow-xl"
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-accent" aria-hidden />
            <h3 className="text-[15px] font-medium text-ink">{isEdit ? 'Edit user' : 'Create user'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-accent-soft border-l-2 border-negative text-negative text-[13px]">
              {error}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-line focus:border-accent outline-none px-1 py-1.5 text-sm text-ink"
              />
            </div>
          )}

          <div>
            <label className="label block mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-transparent border-b border-line focus:border-accent outline-none px-1 py-1.5 text-sm text-ink"
            />
          </div>

          <div>
            <label className="label block mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-transparent border-b border-line focus:border-accent outline-none px-1 py-1.5 text-sm text-ink cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label block mb-1.5">
              {isEdit ? (
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound size={12} className="text-muted" />
                  Reset password <span className="text-muted normal-case tracking-normal">(optional)</span>
                </span>
              ) : (
                'Password'
              )}
            </label>
            <PasswordInput
              required={!isEdit}
              value={password}
              onChange={setPassword}
              placeholder={isEdit ? 'Leave blank to keep current' : ''}
            />
          </div>

          <div className="flex gap-3 pt-4 -mx-5 px-5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────

interface DeactivateModalProps {
  user: User;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeactivateModal({ user, loading, onCancel, onConfirm }: DeactivateModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-surface border border-line max-w-sm w-full shadow-xl"
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-accent" aria-hidden />
            <h3 className="text-[15px] font-medium text-ink">Deactivate user</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-ink">
            Deactivate <span className="font-medium">{user.full_name}</span>? They will lose access to the system.
          </p>
          <div className="flex gap-3 pt-4 -mx-5 px-5 border-t border-line">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2 bg-negative text-white text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalUser, setModalUser] = React.useState<User | null | undefined>(undefined);
  const [deactivateTarget, setDeactivateTarget] = React.useState<User | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api
      .get<User[]>('/users')
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(deactivateTarget.id);
    try {
      await api.delete(`/users/${deactivateTarget.id}`);
      fetchUsers();
      setDeactivateTarget(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title strip */}
      <div className="flex items-end justify-between gap-6 border-b border-line pb-4 rise">
        <div>
          <div className="label" style={{ fontSize: '10px' }}>
            Admin · User Accounts
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink tracking-tight">
            User Management
          </h1>
        </div>
        <button
          onClick={() => setModalUser(null)}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-2 text-white px-4 py-2 text-sm transition-colors"
        >
          <Plus size={16} />
          Create user
        </button>
      </div>

      {/* Users Table */}
      <section className="bg-surface border border-line rise" style={{ animationDelay: '80ms' }}>
        <header className="px-6 py-4 border-b border-line flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <span className="label tabular" style={{ fontSize: '10px' }}>Tbl. 01</span>
            <h2 className="text-sm font-medium text-ink">Staff accounts</h2>
          </div>
          <span className="label">
            {loading ? 'Loading' : `${users.length} total`}
          </span>
        </header>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: '110px' }}>Role</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span className="label">Loading users…</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span className="label">No users found</span>
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id}>
                    <td className="tabular text-muted">{String(i + 1).padStart(2, '0')}</td>
                    <td className="font-medium">{user.full_name}</td>
                    <td className="text-muted">{user.email}</td>
                    <td>{roleBadge(user.role)}</td>
                    <td>
                      <span
                        className={cn(
                          'label',
                          user.is_active ? 'text-positive' : 'text-muted'
                        )}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModalUser(user)}
                          className="p-1.5 text-muted hover:text-accent transition-colors"
                          title="Edit"
                          aria-label={`Edit ${user.full_name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        {user.is_active && (
                          <button
                            onClick={() => setDeactivateTarget(user)}
                            disabled={actionLoading === user.id}
                            className="p-1.5 text-muted hover:text-negative transition-colors disabled:opacity-50"
                            title="Deactivate"
                            aria-label={`Deactivate ${user.full_name}`}
                          >
                            <UserX size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalUser !== undefined && (
          <UserModal
            user={modalUser}
            onClose={() => setModalUser(undefined)}
            onSave={fetchUsers}
          />
        )}
      </AnimatePresence>

      {/* Deactivate Confirm Modal */}
      <AnimatePresence>
        {deactivateTarget && (
          <DeactivateModal
            user={deactivateTarget}
            loading={actionLoading === deactivateTarget.id}
            onCancel={() => setDeactivateTarget(null)}
            onConfirm={confirmDeactivate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
