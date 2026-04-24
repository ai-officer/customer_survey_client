import React from 'react';
import { Shield } from '../lib/icons';
import { format } from 'date-fns';
import { AuditLog } from '../types';
import { api } from '../lib/api';
import { SearchBar } from './ui/SearchBar';
import { Card } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">audit</div>
          <h2 className="heading text-[24px] font-semibold text-foreground mt-1 leading-tight">
            Audit Logs
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Complete trail of all user actions in the system.
          </p>
        </div>
        <Badge variant="primary" className="gap-1.5 shrink-0">
          <Shield size={12} />
          <span>Admin only</span>
        </Badge>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by action, user, or detail…"
        shortcut="⌘K"
        className="max-w-sm"
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[200px]">Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-[120px]">Resource</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="w-[140px]">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Loading audit logs…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? 'No logs match your search.' : 'No logs yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="num text-[12px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[log.action] ?? 'outline'} className="normal-case tracking-normal text-[10.5px]">
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
      </Card>
    </div>
  );
}
