import React from 'react';
import { Plus, Trash2, Edit2, Check, X, Building2 } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Building2 size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">GCGC Departments</h2>
          <p className="text-sm text-gray-500">Manage the department list available when creating surveys.</p>
        </div>
      </div>

      <form onSubmit={addDepartment} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a new department (e.g. Legal)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading departments…</div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            No departments yet. Add your first one above.
          </div>
        ) : (
          departments.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              {editingId === d.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(d.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-900 font-medium">{d.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(d)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => removeDepartment(d.id, d.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
