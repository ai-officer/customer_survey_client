import React from 'react';
import { Shield } from '../lib/icons';
import { format } from 'date-fns';
import { AuditLog } from '../types';
import { api } from '../lib/api';
import { SearchBar } from './ui/SearchBar';
import { Card } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Pagination, paginate } from '@/components/ui/pagination';
import { RibbonCell } from '@/components/ui/ribbon-cell';
import { PageHero } from '@/components/ui/page-hero';
import type { VariantProps } from 'class-variance-authority';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const ACTION_VARIANT: Record<string, BadgeVariant> = {
  LOGIN: 'outline',
  REGISTER: 'outline',
  CREATE_SURVEY: 'success',
  UPDATE_SURVEY: 'default',
  DELETE_SURVEY: 'destructive',
  DUPLICATE_SURVEY: 'default',
  DISTRIBUTE_SURVEY: 'primary',
  REMIND_NON_RESPONDENTS: 'primary',
  SUBMIT_RESPONSE: 'outline',
  CREATE_USER: 'success',
  UPDATE_USER: 'default',
  DEACTIVATE_USER: 'destructive',
};

type CategoryFilter = 'all' | 'surveys' | 'users' | 'auth' | 'destructive';

const CATEGORY_MATCH: Record<CategoryFilter, (action: string) => boolean> = {
  all: () => true,
  surveys: (a) => a.includes('SURVEY') || a === 'SUBMIT_RESPONSE' || a === 'REMIND_NON_RESPONDENTS',
  users: (a) => a.includes('USER'),
  auth: (a) => a === 'LOGIN' || a === 'REGISTER',
  destructive: (a) => a.startsWith('DELETE_') || a.startsWith('DEACTIVATE_'),
};

export default function AuditLogs() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  React.useEffect(() => {
    api.get<AuditLog[]>('/audit-logs?limit=200')
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchCategory = CATEGORY_MATCH[category];
    return logs.filter(log => {
      if (!matchCategory(log.action)) return false;
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        (log.user_email || '').toLowerCase().includes(q) ||
        (log.detail || '').toLowerCase().includes(q)
      );
    });
  }, [logs, search, category]);

  const hasFilter = search || category !== 'all';
  const clearFilters = () => { setSearch(''); setCategory('all'); };

  // Reset to first page whenever filter / page size changes
  React.useEffect(() => { setPage(1); }, [search, category, pageSize]);

  const pageItems = paginate(filtered, page, pageSize);

  // Summary stats
  const destructiveCount = logs.filter(l => CATEGORY_MATCH.destructive(l.action)).length;
  const uniqueActors = new Set(logs.map(l => l.user_email).filter(Boolean)).size;

  return (
    <div className="space-y-7">
      {/* Editorial hero */}
      <PageHero
        eyebrow="administration · audit"
        title="Audit Log"
        description="An immutable record of every privileged action. Used for compliance, investigation, and on-call review."
        action={
          <Badge variant="primary" className="gap-1.5 shrink-0 self-start">
            <Shield size={12} />
            <span>Admin only</span>
          </Badge>
        }
      />

      {/* Summary ribbon */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <RibbonCell label="Events (last 200)" value={loading ? '—' : logs.length} />
          <RibbonCell label="Unique actors" value={loading ? '—' : uniqueActors} />
          <RibbonCell
            label="Destructive"
            value={loading ? '—' : destructiveCount}
            subtitle={destructiveCount > 0 ? 'review carefully' : 'none'}
            trend={destructiveCount > 0 ? 'neg' : undefined}
          />
          <RibbonCell
            label="Currently showing"
            value={loading ? '—' : filtered.length}
            subtitle={hasFilter ? 'filtered' : 'no filter'}
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
            placeholder="Search by action, actor, or detail…"
            shortcut="⌘K"
            className="flex-1 min-w-[240px]"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="surveys">Surveys</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="destructive">Destructive actions</SelectItem>
            </SelectContent>
          </Select>
          {hasFilter && <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>}
          <span className="ml-auto eyebrow">
            <span className="num text-foreground mr-1">{filtered.length}</span>
            {filtered.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-45">Timestamp</TableHead>
              <TableHead className="w-50">Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-30">Resource</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="w-35">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  Loading audit logs…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="space-y-1.5">
                    <p className="text-[13px] text-muted-foreground">
                      {hasFilter ? 'No events match these filters.' : 'No events yet.'}
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
              pageItems.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="num text-[12px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ACTION_VARIANT[log.action] ?? 'outline'}
                      className="normal-case tracking-normal text-[10.5px]"
                    >
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {log.user_email ?? (
                      <span className="text-muted-foreground italic">anonymous</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground capitalize">
                    {log.resource}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground max-w-xs truncate">
                    {log.detail || '—'}
                  </TableCell>
                  <TableCell className="num text-[12px] text-muted-foreground">
                    {log.ip_address || '—'}
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
    </div>
  );
}

