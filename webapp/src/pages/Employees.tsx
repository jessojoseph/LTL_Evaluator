import { useEffect, useState } from 'react';
import { employeeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types';
import { Plus, Pencil, Search, X, Power, PowerOff } from 'lucide-react';

export default function Employees() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: '', department: '', isLead: false, defaultLeadId: '', status: 'active' });

  const load = () => {
    employeeApi.getAll({ search }).then(({ data }) => setEmployees(data.employees));
    employeeApi.getAll().then(({ data }) => setAllEmployees(data.employees));
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', designation: '', department: '', isLead: false, defaultLeadId: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '', designation: emp.designation || '',
      department: emp.department || '', isLead: emp.isLead || false, defaultLeadId: emp.defaultLeadId?._id || '', status: emp.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await employeeApi.update(editing._id, form);
    } else {
      await employeeApi.create(form);
    }
    setShowModal(false);
    load();
  };

  const toggleStatus = async (id: string) => {
    await employeeApi.toggleStatus(id);
    load();
  };

  const leads = allEmployees.filter((e) => e.isLead && e.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage employee records — toggle "Is Lead" to assign project lead permissions</p>
        </div>
        {hasPermission('employees:create') && (
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Employee</button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Designation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Lead</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reports To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.designation || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {emp.isLead ? (
                      <span className="badge bg-indigo-50 text-indigo-700">Lead</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.defaultLeadId?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${emp.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('employees:update') && (
                        <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('employees:update') && (
                        <button
                          onClick={() => toggleStatus(emp._id)}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                            emp.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {emp.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="label">Designation</label><input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                <div><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                <div>
                  <label className="label">Role</label>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
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
    </div>
  );
}
