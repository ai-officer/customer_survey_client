import React from 'react';
import { Plus, Edit2, UserX, KeyRound, Eye, EyeOff } from '../lib/icons';
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
import { Pagination, paginate } from '@/components/ui/pagination';
import { SearchBar } from './ui/SearchBar';
import { ModalScaffold } from '@/components/ui/modal-scaffold';

const ROLES: UserRole[] = ['admin', 'manager'];

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'deactivated';

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
    <ModalScaffold
      onClose={onClose}
      eyebrow={isEdit ? 'account · edit' : 'account · create'}
      title={isEdit ? 'Edit user' : 'Create user'}
      size="md"
    >
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
            <Input id="user-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="user-name">Full name</Label>
          <Input id="user-name" type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
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
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      </form>
    </ModalScaffold>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalUser, setModalUser] = React.useState<User | null | undefined>(undefined);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

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

  // Filtered view
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (q && !u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
        return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'deactivated' && u.is_active) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const hasFilter = search || roleFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  React.useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, pageSize]);
  const pageItems = paginate(filtered, page, pageSize);

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    active: users.filter(u => u.is_active).length,
    deactivated: users.filter(u => !u.is_active).length,
  };

  return (
    <div className="space-y-7">
      {/* Editorial hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">administration · directory</div>
          <h1 className="display text-[32px] text-foreground leading-tight">Users</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Manage who has access to the console and what role they hold.
          </p>
        </div>
        <Button onClick={() => setModalUser(null)} size="lg">
          <Plus size={14} /> New user
        </Button>
      </div>

      {/* Summary ribbon */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <RibbonCell label="Total users" value={loading ? '—' : counts.all} />
          <RibbonCell label="Admins" value={loading ? '—' : counts.admin} subtitle="highest privilege" />
          <RibbonCell label="Managers" value={loading ? '—' : counts.manager} />
          <RibbonCell
            label="Deactivated"
            value={loading ? '—' : counts.deactivated}
            subtitle={counts.deactivated > 0 ? 'cannot sign in' : 'none'}
            trend={counts.deactivated > 0 ? 'neg' : undefined}
          />
        </div>
      </Card>

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow pl-1 pr-2 shrink-0">filters</span>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            shortcut="⌘K"
            className="flex-1 min-w-[220px]"
          />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-35">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-35">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
          )}
          <span className="ml-auto eyebrow">
            <span className="num text-foreground mr-1">{filtered.length}</span>
            {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </Card>

      {/* Table — person-forward rows */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead className="w-[130px]">Role</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                  Loading users…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16">
                  <div className="space-y-1.5">
                    <p className="text-[13px] text-muted-foreground">
                      {hasFilter ? 'No users match these filters.' : 'No users yet.'}
                    </p>
                    {hasFilter && (
                      <button onClick={clearFilters} className="text-[12px] text-primary font-medium hover:underline underline-offset-4">
                        Clear filters
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-md font-mono text-[12px] font-semibold flex items-center justify-center shrink-0 border',
                          user.is_active
                            ? 'bg-foreground text-primary-foreground border-foreground'
                            : 'bg-secondary text-muted-foreground border-border',
                        )}
                      >
                        {initials(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          'text-[14px] font-medium leading-tight truncate',
                          user.is_active ? 'text-foreground' : 'text-muted-foreground',
                        )}>
                          {user.full_name}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground truncate mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>{statusBadge(user.is_active)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
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
        {!loading && filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      {modalUser !== undefined && (
        <UserModal user={modalUser} onClose={() => setModalUser(undefined)} onSave={fetchUsers} />
      )}
    </div>
  );
}

function RibbonCell({
  label, value, subtitle, trend,
}: {
  label: string; value: React.ReactNode; subtitle?: string; trend?: 'pos' | 'neg';
}) {
  return (
    <div className="px-5 py-5 flex flex-col gap-1.5">
      <div className="eyebrow">{label}</div>
      <div className="num text-[26px] font-semibold text-foreground leading-none mt-1">{value}</div>
      {subtitle && (
        <div className="text-[11.5px] text-muted-foreground mt-1 flex items-center gap-1.5">
          {trend === 'pos' && <span className="h-1 w-1 rounded-full bg-emerald-600" aria-hidden />}
          {trend === 'neg' && <span className="h-1 w-1 rounded-full bg-amber-500" aria-hidden />}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
