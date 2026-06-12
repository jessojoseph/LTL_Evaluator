import { useEffect, useState } from 'react';
import { allocationApi, weekApi, employeeApi, projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Allocation, Week, Employee, Project } from '../types';
import { Plus, Pencil, AlertTriangle, X, Power, PowerOff, FileSpreadsheet } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Allocations() {
  const { hasPermission } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [warning, setWarning] = useState('');
  const [form, setForm] = useState({ weekId: '', projectLeadId: '', projectId: '', employeeId: '', allocatedDays: '0', extraHours: '0', remarks: '' });

  const years = [...new Set(weeks.map((w) => new Date(w.startDate).getFullYear()))].sort((a, b) => b - a);
  const monthsInYear = selectedYear
    ? [...new Set(weeks
        .filter((w) => new Date(w.startDate).getFullYear() === Number(selectedYear))
        .map((w) => new Date(w.startDate).getMonth()))]
        .sort((a, b) => a - b)
    : [];
  const filteredWeeks = weeks.filter((w) => {
    if (w.isActive === false) return false;
    const d = new Date(w.startDate);
    if (selectedYear && d.getFullYear() !== Number(selectedYear)) return false;
    if (selectedMonth && d.getMonth() !== Number(selectedMonth)) return false;
    return true;
  });

  useEffect(() => {
    if (weeks.length > 0) {
      if (!selectedYear) {
        const newest = weeks[0];
        const d = new Date(newest.startDate);
        setSelectedYear(String(d.getFullYear()));
        setSelectedMonth(String(d.getMonth()));
        setSelectedWeek(newest._id);
      }
    }
  }, [weeks]);

  const load = async () => {
    const wRes = await weekApi.getAll();
    setWeeks(wRes.data.weeks);
    const [eRes, lRes, pRes] = await Promise.all([
      employeeApi.getAll({ status: 'active' }),
      employeeApi.getAll({ isLead: 'true', status: 'active' }),
      projectApi.getAll({ status: 'active' }),
    ]);
    setEmployees(eRes.data.employees);
    setLeads(lRes.data.employees);
    setProjects(pRes.data.projects);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedWeek) {
      allocationApi.getAll({ weekId: selectedWeek }).then(({ data }) => setAllocations(data.allocations));
    }
  }, [selectedWeek]);

  const openCreate = () => {
    setEditing(null);
    setWarning('');
    setForm({ weekId: selectedWeek, projectLeadId: '', projectId: '', employeeId: '', allocatedDays: '0', extraHours: '0', remarks: '' });
    setShowModal(true);
  };

  const openEdit = (a: Allocation) => {
    setEditing(a);
    setWarning('');
    setForm({
      weekId: a.weekId._id, projectLeadId: a.projectLeadId._id, projectId: a.projectId._id,
      employeeId: a.employeeId._id, allocatedDays: String(a.allocatedDays), extraHours: String(a.extraHours), remarks: a.remarks || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');
    const data = { ...form, allocatedDays: Number(form.allocatedDays), extraHours: Number(form.extraHours) };
    try {
      if (editing) {
        const { data: res } = await allocationApi.update(editing._id, data);
        if (res.warning) setWarning(res.warning);
      } else {
        const { data: res } = await allocationApi.create(data);
        if (res.warning) setWarning(res.warning);
      }
      setShowModal(false);
      allocationApi.getAll({ weekId: selectedWeek }).then(({ data }) => setAllocations(data.allocations));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error saving allocation';
      setWarning(msg);
    }
  };

  const toggleStatus = async (id: string) => {
    await allocationApi.toggleStatus(id);
    allocationApi.getAll({ weekId: selectedWeek }).then(({ data }) => setAllocations(data.allocations));
  };

  const filteredProjects = projects.filter((p) => !form.projectLeadId || p.projectLeadId._id === form.projectLeadId);
  const week = weeks.find((w) => w._id === selectedWeek);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Allocations</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage weekly resource allocations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select className="input w-auto text-sm" value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); }}>
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="input w-auto text-sm" value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); }}>
              <option value="">All Months</option>
              {monthsInYear.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
            </select>
            <select className="input w-auto text-sm min-w-[180px]" value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}>
              <option value="">Select week...</option>
              {filteredWeeks.map((w) => {
                const d = new Date(w.startDate);
                return <option key={w._id} value={w._id}>{w.weekName} — {d.toLocaleDateString()} ({w.weeklyCapacity} WH)</option>;
              })}
            </select>
          </div>
          {hasPermission('allocations:create') && selectedWeek && (
            <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Allocation</button>
          )}
        </div>
      </div>

      {warning && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-4 py-3 animate-slide-down">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {warning}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Extra Hrs</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">WH</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.map((a) => (
                <tr key={a._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                  <td className="text-gray-900 font-medium">{a.projectLeadId?.name}</td>
                  <td className="text-gray-900">{a.projectId?.name}</td>
                  <td className="text-gray-900">{a.employeeId?.name}</td>
                  <td className="text-center text-gray-600">{a.allocatedDays}</td>
                  <td className="text-center text-gray-600">{a.extraHours}</td>
                  <td className="text-center font-semibold text-primary-700">{a.allocatedWH}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission('allocations:update') && (
                        <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all duration-200">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('allocations:update') && (
                        <button onClick={() => toggleStatus(a._id)}
                          className={`p-2 rounded-xl transition-all duration-200 ${
                            a.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={a.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {a.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {allocations.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{selectedWeek ? 'No allocations for this week' : 'Select a week to view allocations'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {week && (
        <div className="card p-4 text-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">Week Capacity:</span> {week.weeklyCapacity} WH
              <span className="text-gray-400 ml-1">({week.workingDays} days × {week.hoursPerDay} hrs)</span>
            </span>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">Total Allocated:</span>{' '}
              <span className="text-primary-700 font-semibold">{allocations.reduce((s, a) => s + a.allocatedWH, 0)} WH</span>
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Allocation' : 'Add Allocation'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Project Lead</label>
                  <select className="input" value={form.projectLeadId} onChange={(e) => setForm({ ...form, projectLeadId: e.target.value, projectId: '' })} required>
                    <option value="">Select lead</option>
                    {leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Project</label>
                  <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                    <option value="">Select project</option>
                    {filteredProjects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Employee</label>
                  <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                    <option value="">Select employee</option>
                    {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Days</label>
                  <input type="number" className="input" value={form.allocatedDays} onChange={(e) => setForm({ ...form, allocatedDays: e.target.value })} min="0" step="0.5" required />
                </div>
                <div>
                  <label className="label">Extra Hours</label>
                  <input type="number" className="input" value={form.extraHours} onChange={(e) => setForm({ ...form, extraHours: e.target.value })} min="0" step="0.5" />
                </div>
                <div className="col-span-2">
                  <label className="label">Remarks</label>
                  <textarea className="input" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
                </div>
              </div>
              {week && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  Calculated WH: <span className="font-semibold text-primary-700">{Number(form.allocatedDays) * week.hoursPerDay + Number(form.extraHours)}</span>
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
