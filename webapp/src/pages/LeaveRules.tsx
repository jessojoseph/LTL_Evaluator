import { useEffect, useState } from 'react';
import { leaveRuleApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { LeaveRule } from '../types';
import { Plus, Pencil, Search, X, Scale, Trash2 } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
  probation: 'Probation',
};

const leaveTypeLabels: Record<string, string> = {
  casual: 'Casual',
  medical: 'Medical',
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
  other: 'Other',
};

const periodTypeLabels: Record<string, string> = {
  yearly: 'Yearly',
  half_yearly: 'Half-Yearly',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
};

export default function LeaveRules() {
  const { hasPermission } = useAuth();
  const [rules, setRules] = useState<LeaveRule[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveRule | null>(null);
  const [form, setForm] = useState({
    name: '',
    employmentType: 'full_time',
    leaveType: 'casual' as LeaveRule['leaveType'],
    periodType: 'yearly' as LeaveRule['periodType'],
    maxPerPeriod: 0,
    annualAllocation: 0,
    carryOver: false,
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leaveRuleApi.getAll();
      setRules(data.rules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredRules = rules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.employmentType.toLowerCase().includes(q) ||
      r.leaveType.toLowerCase().includes(q)
    );
  });

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
    data: filteredRules,
    pageSize: 10,
    searchFields: ['name'],
    searchQuery: search,
  });

  useEffect(() => { goToFirstPage(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      employmentType: 'full_time',
      leaveType: 'casual',
      periodType: 'yearly',
      maxPerPeriod: 0,
      annualAllocation: 0,
      carryOver: false,
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (r: LeaveRule) => {
    setEditing(r);
    setForm({
      name: r.name,
      employmentType: r.employmentType,
      leaveType: r.leaveType,
      periodType: r.periodType,
      maxPerPeriod: r.maxPerPeriod,
      annualAllocation: r.annualAllocation,
      carryOver: r.carryOver,
      description: r.description || '',
      isActive: r.isActive,
    });
    setShowModal(true);
  };

  const [formError, setFormError] = useState('');

  const handleDelete = async (id: string) => {
    await leaveRuleApi.remove(id);
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.maxPerPeriod > form.annualAllocation) {
      setFormError('Max per period cannot exceed annual allocation');
      return;
    }

    if (editing) {
      await leaveRuleApi.update(editing._id, form);
    } else {
      await leaveRuleApi.create(form);
    }
    setShowModal(false);
    load();
  };

  const periodColors: Record<string, string> = {
    yearly: 'bg-blue-50 text-blue-700',
    half_yearly: 'bg-purple-50 text-purple-700',
    quarterly: 'bg-orange-50 text-orange-700',
    monthly: 'bg-cyan-50 text-cyan-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Rules</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure leave allocation rules per employment type
            </p>
          </div>
        </div>
        {hasPermission('leave_rules:create') && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <table className="table-modern">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Per Period</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Annual</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((r) => (
                  <tr key={r._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-gray-100 text-gray-700">
                        {employmentTypeLabels[r.employmentType] || r.employmentType}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary-50 text-primary-700">
                        {leaveTypeLabels[r.leaveType] || r.leaveType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${periodColors[r.periodType]}`}>
                        {periodTypeLabels[r.periodType] || r.periodType}
                      </span>
                    </td>
                    <td className="text-center font-semibold text-gray-900 text-sm">{r.maxPerPeriod}</td>
                    <td className="text-center font-semibold text-gray-900 text-sm">
                      {r.annualAllocation}
                      {r.carryOver && <span className="text-xs text-gray-400 ml-1">(+CO)</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('leave_rules:update') && (
                          <button
                            onClick={() => openEdit(r)}
                            className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('leave_rules:delete') && (
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No leave rules configured
                    </td>
                  </tr>
                )}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Leave Rule' : 'Add Leave Rule'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                  {formError}
                </div>
              )}
              <div>
                <label className="label">Rule Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Full-time Casual Leave"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Employment Type</label>
                  <select
                    className="input"
                    value={form.employmentType}
                    onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                    required
                  >
                    {Object.entries(employmentTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Leave Type</label>
                  <select
                    className="input"
                    value={form.leaveType}
                    onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveRule['leaveType'] })}
                    required
                  >
                    {Object.entries(leaveTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Period Type</label>
                  <select
                    className="input"
                    value={form.periodType}
                    onChange={(e) => setForm({ ...form, periodType: e.target.value as LeaveRule['periodType'] })}
                    required
                  >
                    {Object.entries(periodTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Max Per Period</label>
                  <input
                    type="number"
                    className="input"
                    value={form.maxPerPeriod}
                    onChange={(e) => setForm({ ...form, maxPerPeriod: Number(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Annual Allocation</label>
                  <input
                    type="number"
                    className="input"
                    value={form.annualAllocation}
                    onChange={(e) => setForm({ ...form, annualAllocation: Number(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={form.carryOver}
                      onChange={(e) => setForm({ ...form, carryOver: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Carry Over</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[60px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
