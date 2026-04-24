import React from 'react';
import { Plus, Edit2, UserX, X, KeyRound, Eye, EyeOff } from '../lib/icons';
import { motion } from 'motion/react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const ROLES: UserRole[] = ['admin', 'manager'];

function roleBadge(role: UserRole) {
  return (
    <Badge variant={role === 'admin' ? 'destructive' : 'primary'} className="normal-case tracking-normal">
      {role}
    </Badge>
  );
}

function statusBadge(active: boolean) {
  return (
    <Badge
      variant={active ? 'success' : 'outline'}
      className="normal-case tracking-normal gap-1.5"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-emerald-500' : 'bg-muted-foreground/60',
        )}
        aria-hidden
      />
      {active ? 'active' : 'deactivated'}
    </Badge>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-pop space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{isEdit ? 'account / edit' : 'account / create'}</div>
            <h3 className="heading text-[18px] font-semibold text-foreground mt-1 leading-none">
              {isEdit ? 'Edit user' : 'Create user'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors -mr-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
            <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user-name">Full name</Label>
            <Input
              id="user-name"
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Juan dela Cruz"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password" className="flex items-center gap-1.5">
              {isEdit ? (
                <>
                  <KeyRound size={12} className="text-muted-foreground" />
                  Reset password
                  <span className="text-muted-foreground font-normal">(leave blank to keep)</span>
                </>
              ) : 'Password'}
            </Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? 'New password' : ''}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      </motion.div>
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

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">directory</div>
          <h2 className="heading text-[24px] font-semibold text-foreground mt-1 leading-tight">
            Users
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage system staff accounts and roles.
          </p>
        </div>
        <Button onClick={() => setModalUser(null)}>
          <Plus size={14} /> Create user
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[120px]">Role</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading users…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md bg-secondary text-foreground font-mono text-[11px] font-semibold flex items-center justify-center border border-border">
                        {initials(user.full_name)}
                      </div>
                      <span className="font-medium text-foreground">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>{statusBadge(user.is_active)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5 opacity-70 hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => setModalUser(user)} aria-label="Edit">
                        <Edit2 size={14} />
                      </Button>
                      {user.is_active && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deactivate(user)}
                          disabled={actionLoading === user.id}
                          aria-label="Deactivate"
                          className="hover:text-destructive hover:bg-red-50"
                        >
                          <UserX size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      {modalUser !== undefined && (
        <UserModal user={modalUser} onClose={() => setModalUser(undefined)} onSave={fetchUsers} />
      )}
    </div>
  );
}
