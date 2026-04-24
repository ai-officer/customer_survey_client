import React from 'react';
import { Plus, Trash2, Edit2, Check, X, Building2 } from '../lib/icons';
import { motion } from 'motion/react';
import { Department } from '../types';
import { api } from '../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DepartmentManagement() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newName, setNewName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [error, setError] = React.useState('');

  const load = () => {
    setLoading(true);
    api.get<Department[]>('/departments')
      .then(setDepartments)
      .catch((err: any) => setError(err?.message || 'Failed to load departments'))
      .finally(() => setLoading(false));
  };

  React.useEffect(load, []);

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await api.post<Department>('/departments', { name });
      setDepartments((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add department');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
  };

  const saveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      const updated = await api.put<Department>(`/departments/${id}`, { name });
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name))
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
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 size={18} />
        </div>
        <div>
          <div className="eyebrow">directory</div>
          <h2 className="heading text-[22px] font-semibold text-foreground mt-1 leading-tight">
            Departments
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage the department list available when creating surveys.
          </p>
        </div>
      </div>

      {/* Add form */}
      <Card className="p-3">
        <form onSubmit={addDepartment} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a new department (e.g. Legal)"
            className="flex-1"
          />
          <Button type="submit" disabled={submitting || !newName.trim()}>
            <Plus size={14} /> Add
          </Button>
        </form>
      </Card>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
          <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
          {error}
        </div>
      )}

      {/* List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading departments…</div>
        ) : departments.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No departments yet. Add your first one above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {departments.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015, duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                {editingId === d.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(d.id)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => saveEdit(d.id)} className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                      <Check size={15} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X size={15} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="num text-[11px] text-muted-foreground w-6 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-[14px] text-foreground font-medium">{d.name}</span>
                    <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(d)} aria-label="Edit">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeDepartment(d.id, d.name)}
                        aria-label="Delete"
                        className="hover:text-destructive hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
