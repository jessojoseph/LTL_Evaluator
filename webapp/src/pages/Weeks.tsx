import { useEffect, useState } from 'react';
import { weekApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Week } from '../types';
import { Plus, Pencil, Copy, X, Power, PowerOff } from 'lucide-react';

export default function Weeks() {
  const { hasPermission } = useAuth();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Week | null>(null);
  const [copyTarget, setCopyTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ weekName: '', startDate: '', endDate: '', workingDays: '5', hoursPerDay: '7.5', status: 'draft' });

  const load = () => { weekApi.getAll().then(({ data }) => setWeeks(data.weeks)); };
  useEffect(() => { load(); }, []);

  const toggleStatus = async (id: string) => {
    await weekApi.toggleStatus(id);
    load();
  };

  const openCreate = () => { setEditing(null); setForm({ weekName: '', startDate: '', endDate: '', workingDays: '5', hoursPerDay: '7.5', status: 'draft' }); setShowModal(true); };
  const openEdit = (w: Week) => { setEditing(w); setForm({ weekName: w.weekName, startDate: w.startDate.split('T')[0], endDate: w.endDate.split('T')[0], workingDays: String(w.workingDays), hoursPerDay: String(w.hoursPerDay), status: w.status }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, workingDays: Number(form.workingDays), hoursPerDay: Number(form.hoursPerDay) };
    if (editing) await weekApi.update(editing._id, data);
    else await weekApi.create(data);
    setShowModal(false); load();
  };

  const handleCopy = async (targetId: string) => {
    if (!copyTarget) return;
    await weekApi.copyFromPrevious(targetId, copyTarget);
    setCopyTarget(null); load();
  };

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', published: 'bg-green-50 text-green-700', closed: 'bg-blue-50 text-blue-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Weeks</h1><p className="text-gray-500 mt-1">Manage weekly planning periods</p></div>
        {hasPermission('weeks:create') && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Create Week</button>}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-4 py-3 font-medium text-gray-600">Week</th><th className="text-left px-4 py-3 font-medium text-gray-600">Start</th><th className="text-left px-4 py-3 font-medium text-gray-600">End</th><th className="text-center px-4 py-3 font-medium text-gray-600">Days</th><th className="text-center px-4 py-3 font-medium text-gray-600">Hrs/Day</th><th className="text-center px-4 py-3 font-medium text-gray-600">Capacity</th><th className="text-left px-4 py-3 font-medium text-gray-600">Status</th><th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {weeks.map((w) => (
                <tr key={w._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{w.weekName}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(w.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(w.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{w.workingDays}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{w.hoursPerDay}</td>
                  <td className="px-4 py-3 text-center font-medium">{w.weeklyCapacity} WH</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[w.status]}`}>{w.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('weeks:update') && <button onClick={() => openEdit(w)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>}
                      {hasPermission('weeks:copy') && <button onClick={() => setCopyTarget(w._id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-100"><Copy className="w-4 h-4" /></button>}
                      {hasPermission('weeks:update') && (
                        <button
                          onClick={() => toggleStatus(w._id)}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                            w.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={w.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {w.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {weeks.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No weeks created yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy from previous week modal */}
      {copyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCopyTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Copy from Previous Week</h2>
            <p className="text-sm text-gray-600 mb-4">Select a source week to copy allocations from:</p>
            <select className="input mb-4" value="" onChange={(e) => handleCopy(copyTarget)}>
              <option value="">Select source week...</option>
              {weeks.filter((w) => w._id !== copyTarget).map((w) => <option key={w._id} value={w._id}>{w.weekName}</option>)}
            </select>
            <button onClick={() => setCopyTarget(null)} className="btn-secondary w-full">Cancel</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">{editing ? 'Edit Week' : 'Create Week'}</h2><button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Week Name</label><input className="input" value={form.weekName} onChange={(e) => setForm({ ...form, weekName: e.target.value })} placeholder="e.g. Week 25" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></div>
                <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>
                <div><label className="label">Working Days</label><input type="number" className="input" value={form.workingDays} onChange={(e) => setForm({ ...form, workingDays: e.target.value })} min="1" max="7" required /></div>
                <div><label className="label">Hours Per Day</label><input type="number" className="input" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} min="0.5" step="0.5" required /></div>
              </div>
              {editing && <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></div>}
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
