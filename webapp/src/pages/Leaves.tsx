import { useEffect, useState } from 'react';
import { leaveApi, employeeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Leave, Employee } from '../types';
import { Plus, Pencil, Search, X, CheckCircle, XCircle, CalendarCheck, Ban, RotateCcw } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function Leaves() {
  const { user, hasPermission } = useAuth();
  const canReadAll = hasPermission('leaves:read');
  const canCreateAny = hasPermission('leaves:create');
  const canSelfServe = hasPermission('leaves:self');
  const canApprove = hasPermission('leaves:approve');

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Leave | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    type: 'annual' as Leave['type'],
    reason: '',
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      if (canReadAll) {
        const [lRes, eRes] = await Promise.all([
          leaveApi.getAll(params),
          employeeApi.getAll({ status: 'active' }),
        ]);
        setLeaves(lRes.data.leaves);
        setEmployees(eRes.data.employees);
      } else if (canSelfServe) {
        const { data } = await leaveApi.getSelf(params);
        setLeaves(data.leaves);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, typeFilter]);

  // Client-side search by employee name/code (admin view only)
  const filteredLeaves = leaves.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.employeeId?.name?.toLowerCase().includes(q) ||
      l.employeeId?.employeeCode?.toLowerCase().includes(q)
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
    data: filteredLeaves,
    pageSize: 10,
  });

  useEffect(() => { goToFirstPage(); }, [search, statusFilter, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ employeeId: '', startDate: '', endDate: '', type: 'annual', reason: '' });
    setShowModal(true);
  };

  const openEdit = (l: Leave) => {
    setEditing(l);
    setForm({
      employeeId: typeof l.employeeId === 'object' ? l.employeeId._id : '',
      startDate: l.startDate.split('T')[0],
      endDate: l.endDate.split('T')[0],
      type: l.type,
      reason: l.reason || '',
    });
    setShowModal(true);
  };

  const [formError, setFormError] = useState('');
  const [lopWarning, setLopWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (new Date(form.startDate) > new Date(form.endDate)) {
      setFormError('End date must be on or after start date');
      return;
    }

    if (editing) {
      await leaveApi.update(editing._id, form);
    } else if (canCreateAny) {
      const { data } = await leaveApi.create(form);
      if (data.lopWarning) setLopWarning(data.lopWarning);
    } else {
      // Self-service: don't send employeeId
      const { data } = await leaveApi.createSelf({
        startDate: form.startDate,
        endDate: form.endDate,
        type: form.type,
        reason: form.reason,
      });
      if (data.lopWarning) setLopWarning(data.lopWarning);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await leaveApi.remove(id);
    load();
  };

  const handleApprove = async (id: string) => {
    if (!user?.id) return;
    await leaveApi.approve(id, user.id);
    load();
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;
    await leaveApi.reject(id, user.id);
    load();
  };

  const handleCancelSelf = async (id: string) => {
    await leaveApi.cancelSelf(id);
    load();
  };

  const handleRevoke = async (id: string) => {
    await leaveApi.revoke(id);
    load();
  };

  const typeColors: Record<string, string> = {
    annual: 'bg-blue-50 text-blue-700',
    sick: 'bg-red-50 text-red-700',
    personal: 'bg-purple-50 text-purple-700',
    other: 'bg-gray-100 text-gray-600',
    casual: 'bg-teal-50 text-teal-700',
    medical: 'bg-rose-50 text-rose-700',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-200 text-gray-600',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {canReadAll ? 'Leave Requests' : 'My Leaves'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {canReadAll ? 'Manage employee leave requests' : 'View and manage your leave requests'}
            </p>
          </div>
        </div>
        {(canCreateAny || canSelfServe) && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        )}
      </div>

      {/* LOP Warning Banner */}
      {lopWarning && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Loss of Pay (LOP) Applied</p>
            <p className="text-xs text-orange-700 mt-0.5">{lopWarning}</p>
          </div>
          <button
            onClick={() => setLopWarning(null)}
            className="p-1 text-orange-400 hover:text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {canReadAll && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search by employee name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        <select
          className="input w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="input w-40"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="personal">Personal</option>
          <option value="casual">Casual</option>
          <option value="medical">Medical</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={canReadAll ? 9 : 7} />
          ) : (
            <table className="table-modern">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {canReadAll && (
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  )}
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">LOP</th>
                  {canReadAll && (
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved By</th>
                  )}
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((l) => {
                  const empName = typeof l.employeeId === 'object' ? l.employeeId?.name || '—' : '—';
                  const empCode = typeof l.employeeId === 'object' ? l.employeeId?.employeeCode : '';
                  const approverName = l.approvedBy?.name || '—';
                  const days = Math.max(1, Math.round((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

                  return (
                    <tr key={l._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                      {canReadAll && (
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {empName.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{empName}</p>
                              {empCode && <p className="text-xs text-gray-400">{empCode}</p>}
                            </div>
                          </div>
                        </td>
                      )}
                      <td><span className={`badge ${typeColors[l.type]}`}>{l.type}</span></td>
                      <td className="text-gray-600 text-sm">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="text-gray-600 text-sm">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="text-gray-900 font-semibold text-sm">{days}d</td>
                      <td><span className={`badge ${statusColors[l.status]}`}>{l.status}</span></td>
                      <td>
                        {l.isLop ? (
                          <span className="badge bg-orange-50 text-orange-700" title={l.lopReason}>
                            LOP
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      {canReadAll && (
                        <td className="text-gray-600 text-sm">{approverName}</td>
                      )}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {l.status === 'pending' && canApprove && (
                            <>
                              <button
                                onClick={() => handleApprove(l._id)}
                                className="p-2 text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(l._id)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {l.status === 'pending' && !canReadAll && canSelfServe && (
                            <button
                              onClick={() => handleCancelSelf(l._id)}
                              className="p-2 text-gray-400 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-all"
                              title="Cancel Request"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {l.status === 'approved' && canApprove && (
                            <button
                              onClick={() => handleRevoke(l._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                              title="Revoke Approval"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('leaves:update') && (
                            <button
                              onClick={() => openEdit(l)}
                              className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('leaves:delete') && (
                            <button
                              onClick={() => handleDelete(l._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={canReadAll ? 9 : 7} className="text-center py-12 text-gray-400">
                      {canReadAll ? 'No leave requests found' : 'You have no leave requests'}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Leave Request' : 'New Leave Request'}
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
              {canCreateAny ? (
                <div>
                  <label className="label">Employee</label>
                  <select
                    className="input"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    required
                    disabled={!!editing}
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-primary-50/50 rounded-xl px-4 py-3">
                  <p className="text-sm text-primary-700 font-medium">
                    You are applying leave for yourself
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Leave Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Leave['type'] })}
                  required
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="casual">Casual</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Optional reason for leave..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
