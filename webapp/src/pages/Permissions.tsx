import { useEffect, useState } from 'react';
import { permissionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Permission } from '../types';
import { Key, Search, Plus, Pencil, X, Power, PowerOff } from 'lucide-react';

const PERMISSION_MODULES = [
  'Employees', 'Project Leads', 'Projects', 'Weeks',
  'Allocations', 'Reports', 'Export', 'Roles', 'Permissions', 'Users',
];

export default function Permissions() {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [form, setForm] = useState({ name: '', label: '', description: '', module: 'Employees', status: 'active' });

  const load = () => { permissionApi.getAll().then(({ data }) => setPermissions(data.permissions)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', label: '', description: '', module: 'Employees', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (p: Permission) => {
    setEditing(p);
    setForm({ name: p.name, label: p.label, description: p.description || '', module: p.module, status: p.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await permissionApi.update(editing._id, form);
    else await permissionApi.create(form);
    setShowModal(false);
    load();
  };

  const toggleStatus = async (id: string) => {
    await permissionApi.toggleStatus(id);
    load();
  };

  const modules = [...new Set(permissions.map((p) => p.module))].sort();

  const filtered = permissions.filter((p) => {
    const matchesSearch = !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesModule = !filterModule || p.module === filterModule;
    return matchesSearch && matchesModule;
  });

  if (!hasPermission('permissions:read')) {
    return <div className="text-center py-12 text-gray-400">You don't have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-500 mt-1">Manage system permissions organized by module</p>
        </div>
        {hasPermission('permissions:create') && (
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Permission</button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((perm) => (
          <div key={perm._id} className={`card p-4 ${perm.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">{perm.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{perm.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{perm.description}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="badge bg-gray-100 text-gray-600 text-[10px]">{perm.module}</span>
                    {perm.isSystem && <span className="badge bg-purple-50 text-purple-700 text-[10px]">System</span>}
                    <span className={`badge text-[10px] ${perm.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{perm.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {hasPermission('permissions:update') && !perm.isSystem && (
                  <button onClick={() => openEdit(perm)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {hasPermission('permissions:update') && (
                  <button
                    onClick={() => toggleStatus(perm._id)}
                    className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                      perm.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={perm.status === 'active' ? 'Deactivate' : 'Activate'}
                    disabled={perm.isSystem && perm.status === 'active'}
                  >
                    {perm.status === 'active' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">No permissions found</div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Permission' : 'Add Permission'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Name <span className="text-xs text-gray-400">(e.g. employees:create)</span></label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="module:action" required />
                </div>
                <div className="col-span-2"><label className="label">Label</label><input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Create Employees" required /></div>
                <div className="col-span-2"><label className="label">Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Create new employee records" rows={2} /></div>
                <div><label className="label">Module</label>
                  <select className="input" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} required>
                    {PERMISSION_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
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
