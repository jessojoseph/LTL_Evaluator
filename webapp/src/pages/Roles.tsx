import { useEffect, useState } from 'react';
import { roleApi, permissionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Role, Permission } from '../types';
import { Plus, Pencil, Search, Shield, X, Power, PowerOff } from 'lucide-react';
import { CardSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function Roles() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[], status: 'active' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([roleApi.getAll(), permissionApi.getAll()]);
      setRoles(rRes.data.roles);
      setPermissions(pRes.data.permissions);
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
    data: roles,
    pageSize: 9,
    searchFields: ['name', 'description'],
    searchQuery: search,
  });

  useEffect(() => { goToFirstPage(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', permissions: [], status: 'active' }); setShowModal(true); };
  const openEdit = (r: Role) => { setEditing(r); setForm({ name: r.name, description: r.description, permissions: r.permissions, status: r.status }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await roleApi.update(editing._id, form);
    else await roleApi.create(form);
    setShowModal(false); load();
  };

  const toggleStatus = async (id: string) => {
    await roleApi.toggleStatus(id);
    load();
  };

  const togglePermission = (permName: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter((p) => p !== permName)
        : [...prev.permissions, permName],
    }));
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Roles</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage roles and their permissions</p>
          </div>
        </div>
        {hasPermission('roles:create') && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Role</button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-10" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((role) => (
              <div key={role._id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-xs text-gray-500">{role.description}</p>
                      <div className="mt-1.5">
                        <span className={`badge ${role.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{role.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasPermission('roles:update') && (
                      <button onClick={() => openEdit(role)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all"><Pencil className="w-4 h-4" /></button>
                    )}
                    {hasPermission('roles:update') && (
                      <button onClick={() => toggleStatus(role._id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          role.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={role.status === 'active' ? 'Deactivate' : 'Activate'} disabled={role.isSystem && role.status === 'active'}>
                        {role.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 8).map((p) => (
                    <span key={p} className="badge bg-gray-100 text-gray-600">{p.split(':')[1] || p}</span>
                  ))}
                  {role.permissions.length > 8 && (
                    <span className="badge bg-gray-100 text-gray-500">+{role.permissions.length - 8} more</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span className={`badge ${role.isSystem ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {role.isSystem ? 'System' : 'Custom'}
                  </span>
                  <span>{role.permissions.length} permissions</span>
                </div>
              </div>
            ))}
          </div>
          {paginatedData.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">No roles found</div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-scale-in border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Role' : 'Add Role'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                <div className="col-span-2"><label className="label">Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              </div>
              <div><label className="label">Permissions</label>
                <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-4">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label key={perm._id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input type="checkbox" checked={form.permissions.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
