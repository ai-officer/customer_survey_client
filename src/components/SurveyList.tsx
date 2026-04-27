import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Eye, Edit2, Trash2, AlertCircle, BarChart3, Copy, QrCode,
  CopyPlus, Mail, Bell, ChevronDown, ChevronUp, Archive,
} from '../lib/icons';
import { SearchBar } from './ui/SearchBar';
import { Survey, Department } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Pagination, paginate } from '@/components/ui/pagination';
import { DistributeModal } from '@/components/surveys/distribute-modal';
import { DeleteConfirmModal } from '@/components/surveys/delete-confirm-modal';
import { PreviewModal } from '@/components/surveys/preview-modal';
import { QrModal } from '@/components/surveys/qr-modal';

type Tab = 'active' | 'draft' | 'archived';
type SortKey = 'title' | 'createdAt' | 'responses';
type SortDir = 'asc' | 'desc';
type CreatedFilter = 'any' | '7d' | '30d' | '90d';

const CREATED_OPTIONS: { value: CreatedFilter; label: string; days?: number }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d',  label: 'Last 7 days',  days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
];

const TABS: { key: Tab; label: string; status: Survey['status'] }[] = [
  { key: 'active',   label: 'Active',   status: 'published' },
  { key: 'draft',    label: 'Drafts',   status: 'draft' },
  { key: 'archived', label: 'Archived', status: 'archived' },
];

const STATUS_VARIANT: Record<Survey['status'], 'primary' | 'outline' | 'default'> = {
  published: 'primary',
  draft: 'outline',
  archived: 'default',
};

// ── Overflow Menu ─────────────────────────────────────────────────────────────

interface OverflowMenuProps {
  survey: Survey;
  canEdit: boolean;
  onPreview: () => void;
  onCopyLink: () => void;
  onQR: () => void;
  onDuplicate: () => void;
  onReminders: () => void;
  onEdit: () => void;
  onDelete: () => void;
  copied: boolean;
}

function OverflowMenu(props: OverflowMenuProps) {
  const {
    survey, canEdit, onPreview, onCopyLink, onQR, onDuplicate, onReminders, onEdit, onDelete, copied,
  } = props;
  const [open, setOpen] = React.useState(false);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const positionMenu = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const MENU_WIDTH = 208;
    const MENU_HEIGHT_ESTIMATE = 360;
    const GAP = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const goUp = spaceBelow < MENU_HEIGHT_ESTIMATE && spaceAbove > spaceBelow;
    const style: React.CSSProperties = {
      position: 'fixed',
      width: MENU_WIDTH,
      right: Math.max(8, window.innerWidth - rect.right),
      zIndex: 60,
    };
    if (goUp) style.bottom = window.innerHeight - rect.top + GAP;
    else style.top = rect.bottom + GAP;
    setMenuStyle(style);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    positionMenu();
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const reposition = () => positionMenu();
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, positionMenu]);

  const item = 'w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors';
  const danger = 'w-full px-3 py-2 text-left text-[13px] text-destructive hover:bg-red-50 flex items-center gap-2.5 transition-colors';
  const iconCls = 'text-muted-foreground';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-expanded={open}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <span className="block leading-none text-lg select-none" aria-hidden>⋯</span>
      </button>
      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={menuStyle}
          className="bg-popover border border-border rounded-md shadow-pop overflow-hidden py-1"
        >
          <button onClick={() => { setOpen(false); onPreview(); }} className={item}>
            <Eye size={14} className={iconCls} /> Preview
          </button>
          <Link
            to={`/analytics/${survey.id}`}
            onClick={() => setOpen(false)}
            className={item}
          >
            <BarChart3 size={14} className={iconCls} /> View analytics
          </Link>
          <button onClick={() => { setOpen(false); onCopyLink(); }} className={item}>
            <Copy size={14} className={copied ? 'text-emerald-600' : iconCls} />
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <button onClick={() => { setOpen(false); onQR(); }} className={item}>
            <QrCode size={14} className={iconCls} /> QR code
          </button>
          {canEdit && (
            <>
              <div className="my-1 border-t border-border" />
              <button onClick={() => { setOpen(false); onDuplicate(); }} className={item}>
                <CopyPlus size={14} className={iconCls} /> Duplicate
              </button>
              {survey.status === 'published' && (
                <button onClick={() => { setOpen(false); onReminders(); }} className={item}>
                  <Bell size={14} className={iconCls} /> Send reminders
                </button>
              )}
              {survey.status !== 'draft' && (
                <button onClick={() => { setOpen(false); onEdit(); }} className={item}>
                  <Edit2 size={14} className={iconCls} /> Edit
                </button>
              )}
              <div className="my-1 border-t border-border" />
              <button onClick={() => { setOpen(false); onDelete(); }} className={danger}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SurveyList() {
  const { canEdit } = useAuth();
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<Tab>('active');
  const [sortKey, setSortKey] = React.useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [deptFilter, setDeptFilter] = React.useState<string>('all');
  const [createdFilter, setCreatedFilter] = React.useState<CreatedFilter>('any');
  const [allDepartments, setAllDepartments] = React.useState<Department[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [qrSurvey, setQrSurvey] = React.useState<Survey | null>(null);
  const [previewSurvey, setPreviewSurvey] = React.useState<Survey | null>(null);
  const [surveyToDelete, setSurveyToDelete] = React.useState<Survey | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [distributeSurvey, setDistributeSurvey] = React.useState<Survey | null>(null);

  React.useEffect(() => {
    api.get<Survey[]>('/surveys')
      .then(data => { setSurveys(data); setLoading(false); })
      .catch(() => setLoading(false));
    api.get<Department[]>('/departments')
      .then(setAllDepartments)
      .catch(() => setAllDepartments([]));
  }, []);

  const tabCounts = React.useMemo(() => ({
    active:   surveys.filter(s => s.status === 'published').length,
    draft:    surveys.filter(s => s.status === 'draft').length,
    archived: surveys.filter(s => s.status === 'archived').length,
  }), [surveys]);

  const tabStatus = TABS.find(t => t.key === activeTab)!.status;

  const filteredSurveys = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const createdDays = CREATED_OPTIONS.find(o => o.value === createdFilter)?.days;
    const cutoff = createdDays
      ? Date.now() - createdDays * 24 * 60 * 60 * 1000
      : null;

    const filtered = surveys
      .filter(s => s.status === tabStatus)
      .filter(s => {
        if (deptFilter === 'all') return true;
        if (deptFilter === 'unassigned') return !s.departmentId;
        return s.departmentId === deptFilter;
      })
      .filter(s => cutoff === null || new Date(s.createdAt).getTime() >= cutoff)
      .filter(s => !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.createdByName && s.createdByName.toLowerCase().includes(q)) ||
        (s.departmentName && s.departmentName.toLowerCase().includes(q)) ||
        (s.customer && s.customer.toLowerCase().includes(q))
      );
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortKey === 'responses') return ((a.responseCount ?? 0) - (b.responseCount ?? 0)) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
    return sorted;
  }, [surveys, tabStatus, deptFilter, createdFilter, searchQuery, sortKey, sortDir]);

  const totalResponses = React.useMemo(
    () => surveys.reduce((sum, s) => sum + (s.responseCount ?? 0), 0),
    [surveys],
  );

  const hasFilter = !!searchQuery || deptFilter !== 'all' || createdFilter !== 'any';
  const clearFilters = () => {
    setSearchQuery('');
    setDeptFilter('all');
    setCreatedFilter('any');
  };

  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, deptFilter, createdFilter, pageSize]);

  const pageItems = paginate<Survey>(filteredSurveys, page, pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'title' ? 'asc' : 'desc'); }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQR = (id: string, title: string) => {
    const svg = document.getElementById(`qr-code-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `QR-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = pngFile;
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const deleteSurvey = async () => {
    if (!surveyToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/surveys/${surveyToDelete.id}`);
      setSurveys(surveys.filter(s => s.id !== surveyToDelete.id));
      setSurveyToDelete(null);
    } catch (error) {
      console.error('Failed to delete survey:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const duplicateSurvey = async (survey: Survey) => {
    try {
      const newSurvey = await api.post<Survey>(`/surveys/${survey.id}/duplicate`);
      setSurveys([newSurvey, ...surveys]);
    } catch (error) {
      console.error('Failed to duplicate survey:', error);
    }
  };

  const sendReminders = async (survey: Survey) => {
    try {
      const res = await api.post<{ message: string }>(`/surveys/${survey.id}/remind`);
      alert(res.message);
    } catch (error: any) {
      alert(error.message || 'Failed to send reminders');
    }
  };

  const SortIndicator = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const sortHeader = (label: string, k: SortKey, align: 'left' | 'right' = 'left') => (
    <button
      type="button"
      onClick={() => handleSort(k)}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        align === 'right' && 'flex-row-reverse',
        sortKey === k ? 'text-foreground' : 'hover:text-foreground',
      )}
    >
      <span>{label}</span>
      <SortIndicator k={k} />
    </button>
  );

  return (
    <div className="space-y-7">
      {/* Editorial hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">workspace</div>
          <h1 className="display text-[32px] text-foreground leading-tight">Surveys</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-lg">
            Draft, publish, and distribute surveys. Review responses as they come in.
          </p>
        </div>
        {canEdit && (
          <Button asChild size="lg">
            <Link to="/surveys/new">
              <Plus size={14} /> New survey
            </Link>
          </Button>
        )}
      </div>

      {/* Summary ribbon */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <RibbonCell label="Active" value={loading ? '—' : tabCounts.active} subtitle="published" />
          <RibbonCell label="Drafts" value={loading ? '—' : tabCounts.draft} />
          <RibbonCell label="Archived" value={loading ? '—' : tabCounts.archived} />
          <RibbonCell
            label="Total responses"
            value={loading ? '—' : totalResponses}
            subtitle="across all surveys"
          />
        </div>
      </Card>

      {/* Status tabs + filter bar (sits inside a Card to unify) */}
      <Card className="p-0 overflow-hidden">
        {/* Tabs row */}
        <div className="px-3 pt-2 border-b border-border flex items-center gap-0.5">
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative px-3.5 py-2.5 text-[13px] transition-colors flex items-center gap-2',
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'num text-[10.5px] px-1.5 py-0.5 rounded',
                    active ? 'bg-primary/10 text-foreground' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {tabCounts[tab.key]}
                </span>
                {active && (
                  <motion.span
                    layoutId="survey-tab-underline"
                    className="absolute left-2 right-2 -bottom-[1px] h-[2px] rounded-full bg-primary"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter row */}
        <div className="p-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow pl-1 pr-2 shrink-0 self-center">filters</span>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search surveys…"
            shortcut="⌘K"
            className="w-72"
          />

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44" aria-label="Filter by department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {allDepartments.length > 0 && (
                <>
                  <div className="mx-2 my-1 h-px bg-border" />
                  {allDepartments
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={createdFilter} onValueChange={(v) => setCreatedFilter(v as CreatedFilter)}>
            <SelectTrigger className="w-40" aria-label="Filter by created date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREATED_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
          )}

          <span className="ml-auto eyebrow self-center">
            <span className="num text-foreground mr-1">{filteredSurveys.length}</span>
            {filteredSurveys.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </Card>

      {/* Desktop Table */}
      <Card className="overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{sortHeader('Survey', 'title')}</TableHead>
              <TableHead className="w-28">{sortHeader('Responses', 'responses')}</TableHead>
              <TableHead className="w-44">Department</TableHead>
              <TableHead className="w-36">{sortHeader('Created', 'createdAt')}</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  Loading surveys…
                </TableCell>
              </TableRow>
            ) : filteredSurveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2.5">
                    {activeTab === 'archived'
                      ? <Archive size={32} className="text-muted-foreground/50" />
                      : <AlertCircle size={32} className="text-muted-foreground/50" />}
                    <p className="text-[13px] text-muted-foreground">
                      {searchQuery || deptFilter !== 'all'
                        ? 'No surveys match these filters.'
                        : activeTab === 'active'
                          ? 'No published surveys yet.'
                          : activeTab === 'draft'
                            ? 'No drafts.'
                            : 'No archived surveys.'}
                    </p>
                    {(searchQuery || deptFilter !== 'all') ? (
                      <button onClick={clearFilters} className="text-[12px] text-primary font-medium hover:underline underline-offset-4">
                        Clear filters
                      </button>
                    ) : activeTab !== 'archived' && canEdit && (
                      <Button asChild variant="outline" size="sm" className="mt-1">
                        <Link to="/surveys/new"><Plus size={13} /> New survey</Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map(survey => {
                const responses = survey.responseCount ?? 0;
                return (
                  <TableRow key={survey.id}>
                    <TableCell className="py-3.5">
                      <Link
                        to={`/analytics/${survey.id}`}
                        className="group/title block min-w-0"
                      >
                        <div className="text-[14px] font-semibold text-foreground truncate leading-tight group-hover/title:text-primary transition-colors">
                          {survey.title || 'Untitled'}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={STATUS_VARIANT[survey.status]} className="normal-case tracking-normal">
                            {survey.status}
                          </Badge>
                          <span className="eyebrow">
                            <span className="num text-foreground/80 mr-1">{survey.questions.length}</span>
                            {survey.questions.length === 1 ? 'question' : 'questions'}
                          </span>
                          {survey.createdByName && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="eyebrow truncate max-w-[160px]">by {survey.createdByName}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="num text-[14px] font-semibold text-foreground leading-none">
                        {responses}
                      </div>
                      <div className="eyebrow mt-1">
                        {responses === 1 ? 'response' : 'responses'}
                      </div>
                    </TableCell>

                    <TableCell>
                      {survey.departmentName ? (
                        <div>
                          <div className="text-[13px] text-foreground truncate">{survey.departmentName}</div>
                          {survey.customer && (
                            <div className="eyebrow mt-1 truncate max-w-[160px]">for {survey.customer.toLowerCase()}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted-foreground/60 italic">unassigned</span>
                      )}
                    </TableCell>

                    <TableCell className="num text-[12.5px] text-muted-foreground">
                      {format(new Date(survey.createdAt), 'MMM d, yyyy')}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {survey.status === 'published' && canEdit && (
                          <Button size="sm" onClick={() => setDistributeSurvey(survey)}>
                            <Mail size={13} /> Distribute
                          </Button>
                        )}
                        {survey.status === 'draft' && canEdit && (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/surveys/edit/${survey.id}`}>
                              <Edit2 size={13} /> Edit
                            </Link>
                          </Button>
                        )}
                        {survey.status === 'archived' && (
                          <span className="eyebrow">archived</span>
                        )}
                        <OverflowMenu
                          survey={survey}
                          canEdit={canEdit}
                          onPreview={() => setPreviewSurvey(survey)}
                          onCopyLink={() => copyLink(survey.id)}
                          onQR={() => setQrSurvey(survey)}
                          onDuplicate={() => duplicateSurvey(survey)}
                          onReminders={() => sendReminders(survey)}
                          onEdit={() => { window.location.href = `/surveys/edit/${survey.id}`; }}
                          onDelete={() => setSurveyToDelete(survey)}
                          copied={copiedId === survey.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {!loading && filteredSurveys.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredSurveys.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      {/* Mobile Card View */}
      <Card className="md:hidden p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <AlertCircle size={28} className="text-muted-foreground/50 mx-auto" />
            <p className="text-[13px] text-muted-foreground">No surveys here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pageItems.map(survey => {
              const responses = survey.responseCount ?? 0;
              return (
                <li key={survey.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/analytics/${survey.id}`} className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-foreground truncate leading-tight">
                        {survey.title || 'Untitled'}
                      </div>
                      <div className="eyebrow mt-1.5 flex items-center gap-2">
                        <span>{format(new Date(survey.createdAt), 'MMM d')}</span>
                        {survey.departmentName && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="truncate">{survey.departmentName}</span>
                          </>
                        )}
                      </div>
                    </Link>
                    <OverflowMenu
                      survey={survey}
                      canEdit={canEdit}
                      onPreview={() => setPreviewSurvey(survey)}
                      onCopyLink={() => copyLink(survey.id)}
                      onQR={() => setQrSurvey(survey)}
                      onDuplicate={() => duplicateSurvey(survey)}
                      onReminders={() => sendReminders(survey)}
                      onEdit={() => { window.location.href = `/surveys/edit/${survey.id}`; }}
                      onDelete={() => setSurveyToDelete(survey)}
                      copied={copiedId === survey.id}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[survey.status]} className="normal-case tracking-normal">
                        {survey.status}
                      </Badge>
                      <span className="eyebrow">
                        <span className="num text-foreground mr-1">{responses}</span>
                        {responses === 1 ? 'response' : 'responses'}
                      </span>
                    </div>
                    {survey.status === 'published' && canEdit && (
                      <Button size="sm" onClick={() => setDistributeSurvey(survey)}>
                        <Mail size={13} /> Distribute
                      </Button>
                    )}
                    {survey.status === 'draft' && canEdit && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/surveys/edit/${survey.id}`}>
                          <Edit2 size={13} /> Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && filteredSurveys.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredSurveys.length}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Delete confirmation */}
      <AnimatePresence>
        {surveyToDelete && (
          <DeleteConfirmModal
            survey={surveyToDelete}
            isDeleting={isDeleting}
            onClose={() => setSurveyToDelete(null)}
            onConfirm={deleteSurvey}
          />
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {previewSurvey && (
          <PreviewModal
            survey={previewSurvey}
            onClose={() => setPreviewSurvey(null)}
          />
        )}
      </AnimatePresence>

      {/* Distribute */}
      <AnimatePresence>
        {distributeSurvey && (
          <DistributeModal
            survey={distributeSurvey}
            onClose={() => setDistributeSurvey(null)}
          />
        )}
      </AnimatePresence>

      {/* QR */}
      <AnimatePresence>
        {qrSurvey && (
          <QrModal
            survey={qrSurvey}
            copied={copiedId === qrSurvey.id}
            onClose={() => setQrSurvey(null)}
            onCopyLink={copyLink}
            onDownload={downloadQR}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RibbonCell({
  label, value, subtitle,
}: {
  label: string; value: React.ReactNode; subtitle?: string;
}) {
  return (
    <div className="px-5 py-5 flex flex-col gap-1.5">
      <div className="eyebrow">{label}</div>
      <div className="num text-[26px] font-semibold text-foreground leading-none mt-1">{value}</div>
      {subtitle && <div className="text-[11.5px] text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}
