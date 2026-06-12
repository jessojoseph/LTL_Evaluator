import { useEffect, useState } from 'react';
import { projectApi, employeeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Project, Employee } from '../types';
import { Plus, Pencil, Search, X, Power, PowerOff } from 'lucide-react';

export default function Projects() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', projectLeadId: '', clientName: '', projectType: '', status: 'active', priority: '' });

  const load = () => {
    projectApi.getAll({ search }).then(({ data }) => setProjects(data.projects));
    employeeApi.getAll({ isLead: 'true', status: 'active' }).then(({ data }) => setLeads(data.employees));
  };
  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', projectLeadId: '', clientName: '', projectType: '', status: 'active', priority: '' }); setShowModal(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ name: p.name, projectLeadId: p.projectLeadId._id, clientName: p.clientName || '', projectType: p.projectType || '', status: p.status, priority: p.priority || '' }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await projectApi.update(editing._id, form);
    else await projectApi.create(form);
    setShowModal(false); load();
  };

  const toggleStatus = async (id: string) => {
    await projectApi.toggleStatus(id);
    load();
  };

  const statusColors: Record<string, string> = { active: 'bg-green-50 text-green-700', on_hold: 'bg-yellow-50 text-yellow-700', completed: 'bg-blue-50 text-blue-700', no_work: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Projects</h1><p className="text-gray-500 mt-1">Manage projects</p></div>
        {hasPermission('projects:create') && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Project</button>}
      </div>
      <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input pl-9" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-4 py-3 font-medium text-gray-600">Name</th><th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th><th className="text-left px-4 py-3 font-medium text-gray-600">Client</th><th className="text-left px-4 py-3 font-medium text-gray-600">Type</th><th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th><th className="text-left px-4 py-3 font-medium text-gray-600">Status</th><th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.projectLeadId?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.clientName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.projectType || '-'}</td>
                  <td className="px-4 py-3"><span className={`badge ${p.priority === 'high' ? 'bg-red-50 text-red-700' : p.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{p.priority || '-'}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('projects:update') && <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>}
                      {hasPermission('projects:update') && (
                        <button
                          onClick={() => toggleStatus(p._id)}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                            p.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={p.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {p.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No projects found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">{editing ? 'Edit Project' : 'Add Project'}</h2><button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="col-span-2"><label className="label">Project Lead</label><select className="input" value={form.projectLeadId} onChange={(e) => setForm({ ...form, projectLeadId: e.target.value })} required><option value="">Select lead</option>{leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}</select></div>
                <div><label className="label">Client Name</label><input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
                <div><label className="label">Type</label><select className="input" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}><option value="">Select</option><option value="internal">Internal</option><option value="client">Client</option><option value="support">Support</option></select></div>
                <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="">Select</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="no_work">No Work</option></select></div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
