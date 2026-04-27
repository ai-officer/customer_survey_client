import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, Check, X, Building2, ChevronRight, ExternalLink,
} from '../lib/icons';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Survey } from '../types';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RibbonCell } from '@/components/ui/ribbon-cell';
import { PageHero } from '@/components/ui/page-hero';

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newName, setNewName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [error, setError] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Department[]>('/departments'),
      api.get<Survey[]>('/surveys'),
    ])
      .then(([d, s]) => {
        const sorted = [...d].sort((a, b) => a.name.localeCompare(b.name));
        setDepartments(sorted);
        setSurveys(s);
        if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
      })
      .catch((err: any) => setError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  React.useEffect(load, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Aggregates
  const surveysByDept = React.useMemo(() => {
    const map = new Map<string, Survey[]>();
    for (const s of surveys) {
      if (!s.departmentId) continue;
      if (!map.has(s.departmentId)) map.set(s.departmentId, []);
      map.get(s.departmentId)!.push(s);
    }
    return map;
  }, [surveys]);

  const unassignedCount = surveys.filter(s => !s.departmentId).length;
  const totalResponses = surveys.reduce((sum, s) => sum + (s.responseCount ?? 0), 0);

  const selected = departments.find(d => d.id === selectedId) || null;
  const selectedSurveys = selected ? (surveysByDept.get(selected.id) ?? []) : [];

  // Actions
  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await api.post<Department>('/departments', { name });
      setDepartments(prev =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewName('');
      setShowAddForm(false);
      setSelectedId(created.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to add department');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const saveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      const updated = await api.put<Department>(`/departments/${id}`, { name });
      setDepartments(prev =>
        prev.map(d => (d.id === id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update department');
    }
  };

  const removeDepartment = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"? Surveys in this department will become unassigned.`)) return;
    try {
      await api.delete(`/departments/${id}`);
      setDepartments(prev => prev.filter(d => d.id !== id));
      if (selectedId === id) setSelectedId(departments.find(d => d.id !== id)?.id ?? null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="space-y-7">
      {/* Editorial hero */}
      <PageHero
        eyebrow="administration · directory"
        title="Departments"
        description="Manage the department list and see at-a-glance how each one is engaging with the survey programme."
        action={
          <Button
            onClick={() => setShowAddForm(v => !v)}
            variant={showAddForm ? 'outline' : 'default'}
            size="lg"
          >
            {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New department</>}
          </Button>
        }
      />

      {/* Summary ribbon */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <RibbonCell label="Departments" value={loading ? '—' : departments.length} />
          <RibbonCell label="Surveys assigned" value={loading ? '—' : surveys.length - unassignedCount} />
          <RibbonCell
            label="Unassigned"
            value={loading ? '—' : unassignedCount}
            subtitle={unassignedCount > 0 ? 'need a home' : 'all assigned'}
            trend={unassignedCount > 0 ? 'neg' : 'pos'}
          />
          <RibbonCell
            label="Responses across all"
            value={loading ? '—' : totalResponses}
            subtitle="this period"
          />
        </div>
      </Card>

      {/* Inline add form */}
      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <Card className="p-3">
              <form onSubmit={addDepartment} className="flex items-center gap-2">
                <span className="eyebrow pl-2 pr-1 shrink-0">new</span>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Department name (e.g. Legal, Revenue Management)"
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={submitting || !newName.trim()}>
                  <Plus size={14} /> Create
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
          <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
          {error}
        </div>
      )}

      {/* Workspace: list ↔ detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* Left: department list */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="eyebrow">all departments</div>
            <span className="num text-[11px] text-muted-foreground">{departments.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
            ) : departments.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                No departments yet. Add the first one above.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {departments.map((d, i) => {
                  const count = surveysByDept.get(d.id)?.length ?? 0;
                  const deptResponses = (surveysByDept.get(d.id) ?? [])
                    .reduce((s, sv) => s + (sv.responseCount ?? 0), 0);
                  const active = selectedId === d.id;
                  const editing = editingId === d.id;

                  return (
                    <li key={d.id}>
                      <motion.button
                        type="button"
                        onClick={() => !editing && setSelectedId(d.id)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.012, duration: 0.15 }}
                        className={cn(
                          'relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group',
                          active
                            ? 'bg-secondary/60'
                            : 'hover:bg-secondary/40',
                        )}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary"
                            aria-hidden
                          />
                        )}

                        <span
                          className={cn(
                            'h-9 w-9 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center border shrink-0',
                            active
                              ? 'bg-foreground text-primary-foreground border-foreground'
                              : 'bg-secondary text-foreground border-border',
                          )}
                        >
                          {initials(d.name)}
                        </span>

                        {editing ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') saveEdit(d.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); saveEdit(d.id); }}
                              className="h-8 w-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                              className="h-8 w-8"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-medium text-foreground truncate leading-tight">
                                {d.name}
                              </div>
                              <div className="eyebrow mt-1 flex items-center gap-2">
                                <span>
                                  <span className="num text-foreground/80 mr-0.5">{count}</span>
                                  {count === 1 ? 'survey' : 'surveys'}
                                </span>
                                {deptResponses > 0 && (
                                  <>
                                    <span className="text-muted-foreground/50">·</span>
                                    <span>
                                      <span className="num text-foreground/80 mr-0.5">{deptResponses}</span>
                                      {deptResponses === 1 ? 'response' : 'responses'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              size={14}
                              className={cn(
                                'shrink-0 transition-all',
                                active ? 'text-primary opacity-100 translate-x-0' : 'text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5',
                              )}
                            />
                          </>
                        )}
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Right: detail panel */}
        <Card className="lg:col-span-3 p-0 overflow-hidden flex flex-col min-h-[420px]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center p-10">
              <div className="space-y-2 max-w-xs">
                <div className="w-12 h-12 mx-auto rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Select a department to see its surveys and activity.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-6 pt-6 pb-5 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="h-11 w-11 rounded-md bg-foreground text-primary-foreground font-mono text-[13px] font-semibold flex items-center justify-center shrink-0">
                      {initials(selected.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="eyebrow">department</div>
                      <h2 className="display text-[24px] text-foreground leading-tight mt-0.5 truncate">
                        {selected.name}
                      </h2>
                      <div className="eyebrow mt-2 text-muted-foreground/80">
                        created {format(new Date(selected.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(selected)}
                      className="gap-1.5"
                    >
                      <Edit2 size={13} /> Rename
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDepartment(selected.id, selected.name)}
                      aria-label="Delete department"
                      className="hover:text-destructive hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {editingId === selected.id && (
                  <div className="mt-4 flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(selected.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={() => saveEdit(selected.id)}>
                      <Check size={14} /> Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                )}

                {/* Mini stats */}
                <div className="grid grid-cols-3 divide-x divide-border mt-6 -mx-6 -mb-5 border-t border-border">
                  <MiniStat
                    label="surveys"
                    value={selectedSurveys.length}
                  />
                  <MiniStat
                    label="published"
                    value={selectedSurveys.filter(s => s.status === 'published').length}
                  />
                  <MiniStat
                    label="responses"
                    value={selectedSurveys.reduce((s, sv) => s + (sv.responseCount ?? 0), 0)}
                  />
                </div>
              </div>

              {/* Surveys list */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="eyebrow">surveys in this department</div>
                  <span className="num text-[11px] text-muted-foreground">{selectedSurveys.length}</span>
                </div>

                {selectedSurveys.length === 0 ? (
                  <div className="px-6 pb-10 text-center">
                    <p className="text-[13px] text-muted-foreground italic">
                      No surveys yet in {selected.name}.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to="/surveys/new">
                        <Plus size={13} /> New survey
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border border-t border-border">
                    {selectedSurveys.map(s => (
                      <li key={s.id}>
                        <Link
                          to={`/analytics/${s.id}`}
                          className="group flex items-center gap-3 px-6 py-3 hover:bg-secondary/40 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-medium text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                              {s.title || 'Untitled'}
                            </div>
                            <div className="eyebrow mt-1.5 flex items-center gap-2">
                              {s.createdByName && <span>by {s.createdByName.toLowerCase()}</span>}
                              {s.createdAt && (
                                <>
                                  {s.createdByName && <span className="text-muted-foreground/50">·</span>}
                                  <span>{format(new Date(s.createdAt), 'MMM d, yyyy')}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <Badge variant={s.status === 'published' ? 'primary' : s.status === 'draft' ? 'outline' : 'default'}>
                            {s.status}
                          </Badge>

                          <div className="text-right w-16 shrink-0">
                            <div className="num text-[14px] font-semibold text-foreground leading-none">
                              {s.responseCount ?? 0}
                            </div>
                            <div className="eyebrow mt-1">responses</div>
                          </div>

                          <ExternalLink
                            size={13}
                            className="text-muted-foreground/60 group-hover:text-primary shrink-0 transition-colors"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="num mt-1 text-[18px] font-semibold leading-none">{value}</div>
    </div>
  );
}
