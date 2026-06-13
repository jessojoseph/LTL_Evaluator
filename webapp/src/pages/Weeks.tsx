import { useEffect, useState } from 'react';
import { weekApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Week } from '../types';
import { Plus, Pencil, Copy, Search, X, Power, PowerOff, Calendar } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function Weeks() {
  const { hasPermission } = useAuth();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Week | null>(null);
  const [copyTarget, setCopyTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ weekName: '', startDate: '', endDate: '', workingDays: '5', hoursPerDay: '7.5', status: 'draft' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await weekApi.getAll();
      setWeeks(data.weeks);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const {
    paginatedData,
    totalItems,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    goToFirstPage,
  } = usePagination({
    data: weeks,
    pageSize: 10,
    searchFields: ['weekName'],
    searchQuery: search,
  });

  useEffect(() => { goToFirstPage(); }, [search]);

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

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', published: 'bg-emerald-50 text-emerald-700', closed: 'bg-blue-50 text-blue-700' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weeks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage weekly planning periods</p>
          </div>
        </div>
        {hasPermission('weeks:create') && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Create Week</button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-10" placeholder="Search weeks..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={9} />
          ) : (
            <table className="table-modern">
              <thead><tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">End</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hrs/Day</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((w) => {
                  const isInactive = w.isActive === false;
                  return (
                  <tr key={w._id} className={`hover:bg-primary-50/40 transition-all duration-150 ${isInactive ? 'opacity-60' : ''}`}>
                    <td className="font-semibold text-gray-900">{w.weekName}</td>
                    <td className="text-gray-600">{new Date(w.startDate).toLocaleDateString()}</td>
                    <td className="text-gray-600">{new Date(w.endDate).toLocaleDateString()}</td>
                    <td className="text-center text-gray-600">{w.workingDays}</td>
                    <td className="text-center text-gray-600">{w.hoursPerDay}</td>
                    <td className="text-center font-semibold text-gray-900">{w.weeklyCapacity} WH</td>
                    <td><span className={`badge ${statusColors[w.status]}`}>{w.status}</span></td>
                    <td>
                      <span className={`badge ${isInactive ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isInactive ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('weeks:update') && <button onClick={() => openEdit(w)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all"><Pencil className="w-4 h-4" /></button>}
                        {hasPermission('weeks:copy') && <button onClick={() => setCopyTarget(w._id)} className="p-2 text-gray-400 hover:text-green-600 rounded-xl hover:bg-green-50 transition-all"><Copy className="w-4 h-4" /></button>}
                        {hasPermission('weeks:update') && (
                          <button onClick={() => toggleStatus(w._id)}
                            className={`p-2 rounded-xl transition-all ${
                              w.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`} title={w.isActive !== false ? 'Deactivate' : 'Activate'}>
                            {w.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })}
                {paginatedData.length === 0 && !loading && <tr><td colSpan={9} className="text-center py-12 text-gray-400">No weeks created yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {copyTarget && (
        <div className="modal-overlay" onClick={() => setCopyTarget(null)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Copy from Previous Week</h2>
            <p className="text-sm text-gray-500 mb-4">Select a source week to copy allocations from:</p>
            <select className="input mb-4" value="" onChange={(e) => handleCopy(copyTarget)}>
              <option value="">Select source week...</option>
              {weeks.filter((w) => w._id !== copyTarget).map((w) => {
                const isInactive = w.isActive === false;
                return <option key={w._id} value={w._id}>{w.weekName}{isInactive ? ' (Inactive)' : ''}</option>;
              })}
            </select>
            <button onClick={() => setCopyTarget(null)} className="btn-secondary w-full">Cancel</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Week' : 'Create Week'}</h2><button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
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
