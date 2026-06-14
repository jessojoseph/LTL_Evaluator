import { useEffect, useState } from 'react';
import { employeeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types';
import { Plus, Pencil, Search, X, Power, PowerOff, Users as UsersIcon, LogOut, BadgeCheck, Briefcase, Code, Calendar } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'probation', label: 'Probation' },
] as const;

const RESIGNATION_REASONS = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'moved_city', label: 'Moved City' },
  { value: 'career_change', label: 'Career Change' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'termination', label: 'Termination' },
  { value: 'other', label: 'Other' },
] as const;

export default function Employees() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', designation: '', department: '',
    isLead: false, defaultLeadId: '', status: 'active',
    employeeCode: '', employmentType: 'full_time' as string,
    skills: '' as string, joinDate: '',
  });
  const [resignForm, setResignForm] = useState({ resignationDate: '', resignationReason: '', resignationNotes: '' });
  const [createdPassword, setCreatedPassword] = useState<{ email: string; pass: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, allRes] = await Promise.all([
        employeeApi.getAll({ search }),
        employeeApi.getAll(),
      ]);
      setEmployees(empRes.data.employees);
      setAllEmployees(allRes.data.employees);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

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
    data: employees,
    pageSize: 10,
  });

  useEffect(() => { goToFirstPage(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', designation: '', department: '', isLead: false, defaultLeadId: '', status: 'active', employeeCode: '', employmentType: 'full_time', skills: '', joinDate: '' });
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '', designation: emp.designation || '',
      department: emp.department || '', isLead: emp.isLead || false, defaultLeadId: emp.defaultLeadId?._id || '', status: emp.status,
      employeeCode: emp.employeeCode || '', employmentType: emp.employmentType || 'full_time',
      skills: (emp.skills || []).join(', '), joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const openResign = (emp: Employee) => {
    setShowResignModal(emp);
    setResignForm({ resignationDate: new Date().toISOString().split('T')[0], resignationReason: '', resignationNotes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...form,
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      joinDate: form.joinDate || undefined,
      employeeCode: form.employeeCode || undefined,
    };
    if (editing) {
      await employeeApi.update(editing._id, payload);
      setShowModal(false);
    } else {
      const response = await employeeApi.create(payload);
      setShowModal(false);
      if (response.data.tempPassword) {
        setCreatedPassword({ email: form.email, pass: response.data.tempPassword });
      }
    }
    load();
  };

  const handleResign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResignModal) return;
    await employeeApi.resign(showResignModal._id, resignForm);
    setShowResignModal(null);
    load();
  };

  const toggleStatus = async (id: string) => {
    await employeeApi.toggleStatus(id);
    load();
  };

  const leads = allEmployees.filter((e) => e.isLead && e.status === 'active');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <UsersIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage employee records</p>
          </div>
        </div>
        {hasPermission('employees:create') && (
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Employee</button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={8} />
          ) : (
            <table className="table-modern">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reports To</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((emp) => (
                  <tr key={emp._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                    <td className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">{emp.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {emp.employeeCode ? (
                        <span className="font-mono text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{emp.employeeCode}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-gray-600">{emp.designation || '-'}</td>
                    <td className="text-gray-600">{emp.department || '-'}</td>
                    <td>
                      {emp.employmentType ? (
                        <span className="badge bg-gray-50 text-gray-600">
                          {EMPLOYMENT_TYPES.find(t => t.value === emp.employmentType)?.label || emp.employmentType}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-gray-600">{emp.defaultLeadId?.name || '-'}</td>
                    <td>
                      {emp.status === 'resigned' ? (
                        <span className="badge bg-red-50 text-red-700" title={emp.resignationReason ? `Reason: ${RESIGNATION_REASONS.find(r => r.value === emp.resignationReason)?.label || emp.resignationReason}` : undefined}>
                          Resigned
                        </span>
                      ) : emp.status === 'active' ? (
                        <span className="badge bg-emerald-50 text-emerald-700">Active</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600">Inactive</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('employees:update') && emp.status !== 'resigned' && (
                          <button onClick={() => openEdit(emp)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('employees:update') && emp.status === 'active' && (
                          <button onClick={() => openResign(emp)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                            title="Mark as Resigned">
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('employees:update') && emp.status !== 'resigned' && (
                          <button onClick={() => toggleStatus(emp._id)}
                            className={`p-2 rounded-xl transition-all ${
                              emp.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={emp.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {emp.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && !loading && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No employees found</td></tr>
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
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Employee Code</label>
                  <input className="input" placeholder="e.g. EMP001" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
                </div>
                <div>
                  <label className="label">Employment Type</label>
                  <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Join Date</label>
                  <input type="date" className="input" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Skills (comma-separated)</label>
                  <input className="input" placeholder="e.g. React, Node.js, MongoDB" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isLead} onChange={(e) => setForm({ ...form, isLead: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-700">{form.isLead ? 'Project Lead' : 'Employee'}</span>
                  </label>
                </div>
                <div>
                  <label className="label">Reports To</label>
                  <select className="input" value={form.defaultLeadId} onChange={(e) => setForm({ ...form, defaultLeadId: e.target.value })}>
                    <option value="">None</option>
                    {leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdPassword && (
        <div className="modal-overlay" onClick={() => setCreatedPassword(null)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <span className="text-xl">🔑</span>
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-2">Login Credentials Generated</h3>
              <p className="text-sm text-gray-500 mb-6">
                A user login account has been automatically created for this employee.
              </p>
              
              <div className="space-y-3 bg-gray-50 border border-gray-150 rounded-2xl p-5 text-left mb-6 font-medium text-sm">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">EMAIL</span>
                  <span className="text-gray-800 break-all select-all font-semibold">{createdPassword.email}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">TEMPORARY PASSWORD</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono select-all font-bold text-base">{createdPassword.pass}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-6 font-semibold">
                Please copy and share these details with the employee. They will be able to reset this password.
              </p>

              <button onClick={() => setCreatedPassword(null)} className="btn-primary w-full py-3">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showResignModal && (
        <div className="modal-overlay" onClick={() => setShowResignModal(null)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mark as Resigned</h2>
              <button onClick={() => setShowResignModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800 font-medium">
                You are about to mark <strong>{showResignModal.name}</strong> as resigned.
                Their user account will be deactivated and they will no longer be assignable to projects.
              </p>
            </div>
            <form onSubmit={handleResign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Resignation Date</label>
                  <input type="date" className="input" value={resignForm.resignationDate} onChange={(e) => setResignForm({ ...resignForm, resignationDate: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="label">Reason</label>
                  <select className="input" value={resignForm.resignationReason} onChange={(e) => setResignForm({ ...resignForm, resignationReason: e.target.value })}>
                    <option value="">Select reason...</option>
                    {RESIGNATION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input" rows={3} value={resignForm.resignationNotes} onChange={(e) => setResignForm({ ...resignForm, resignationNotes: e.target.value })} placeholder="Optional notes about the resignation..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResignModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700">Confirm Resignation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
