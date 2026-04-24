import React from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Department } from '../types';
import { api } from '../lib/api';

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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Title strip */}
      <div className="flex items-end justify-between gap-6 border-b border-line pb-4 rise">
        <div>
          <div className="label" style={{ fontSize: '10px' }}>
            Configuration · GCGC Departments
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink tracking-tight">
            Departments
          </h1>
          <p className="mt-2 text-muted text-sm">
            Manage the department list available when creating surveys.
          </p>
        </div>
        <div className="label hidden sm:block">
          {departments.length} {departments.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Add-department form */}
      <form
        onSubmit={addDepartment}
        className="rise bg-surface border border-line p-4 flex gap-2"
        style={{ animationDelay: '60ms' }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a new department (e.g. Legal)"
          className="flex-1 border border-line bg-surface focus:border-accent outline-none px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="bg-accent hover:bg-accent-2 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-2 border-negative text-negative px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Department list */}
      <div className="rise bg-surface border border-line" style={{ animationDelay: '120ms' }}>
        {loading ? (
          <div className="label py-10 text-center">Loading departments…</div>
        ) : departments.length === 0 ? (
          <div className="label py-10 text-center">
            No departments yet — add your first one above.
          </div>
        ) : (
          departments.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-accent-soft/40 transition-colors"
            >
              {editingId === d.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 border border-line bg-surface focus:border-accent outline-none px-3 py-1.5 text-sm text-ink"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(d.id)}
                    className="p-2 text-muted hover:text-positive transition-colors"
                    aria-label="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-muted hover:text-accent transition-colors"
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-ink font-medium">{d.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(d)}
                      className="p-2 text-muted hover:text-accent transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => removeDepartment(d.id, d.name)}
                      className="p-2 text-muted hover:text-negative transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
