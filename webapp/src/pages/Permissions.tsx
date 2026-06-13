import { useEffect, useState } from 'react';
import { permissionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Permission } from '../types';
import { Key, Search, Plus, Pencil, X, Power, PowerOff } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

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
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await permissionApi.getAll();
      setPermissions(data.permissions);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const modules = [...new Set(permissions.map((p) => p.module))].sort();

  const filtered = permissions.filter((p) => {
    const matchesSearch = !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesModule = !filterModule || p.module === filterModule;
    return matchesSearch && matchesModule;
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
    data: filtered,
    pageSize: 12,
  });

  useEffect(() => { goToFirstPage(); }, [search, filterModule]);

  const openCreate = () => { setEditing(null); setForm({ name: '', label: '', description: '', module: 'Employees', status: 'active' }); setShowModal(true); };
  const openEdit = (p: Permission) => { setEditing(p); setForm({ name: p.name, label: p.label, description: p.description || '', module: p.module, status: p.status }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await permissionApi.update(editing._id, form);
    else await permissionApi.create(form);
    setShowModal(false); load();
  };

  const toggleStatus = async (id: string) => {
    await permissionApi.toggleStatus(id);
    load();
  };

  if (!hasPermission('permissions:read')) {
    return <div className="text-center py-12 text-gray-400">You don't have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Permissions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage system permissions organized by module</p>
          </div>
        </div>
        {hasPermission('permissions:create') && (
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Permission</button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((perm) => (
              <div key={perm._id} className={`card-hover p-4 ${perm.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Key className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{perm.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{perm.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{perm.description}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        <span className="badge bg-gray-100 text-gray-600 text-[10px]">{perm.module}</span>
                        {perm.isSystem && <span className="badge bg-purple-50 text-purple-700 text-[10px]">System</span>}
                        <span className={`badge text-[10px] ${perm.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{perm.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {hasPermission('permissions:update') && !perm.isSystem && (
                      <button onClick={() => openEdit(perm)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {hasPermission('permissions:update') && (
                      <button onClick={() => toggleStatus(perm._id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          perm.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={perm.status === 'active' ? 'Deactivate' : 'Activate'}
                        disabled={perm.isSystem && perm.status === 'active'}>
                        {perm.status === 'active' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {paginatedData.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">No permissions found</div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Permission' : 'Add Permission'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
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
