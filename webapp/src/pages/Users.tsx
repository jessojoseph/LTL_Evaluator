import { useEffect, useState } from 'react';
import { userApi, roleApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { LoginUser, Role } from '../types';
import { Plus, Pencil, Search, X, Power, PowerOff, UserCog } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function Users() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LoginUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', status: 'active' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([userApi.getAll(), roleApi.getAll()]);
      setUsers(uRes.data.users);
      setRoles(rRes.data.roles);
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
    data: users,
    pageSize: 10,
    searchFields: ['name', 'email'],
    searchQuery: search,
  });

  useEffect(() => { goToFirstPage(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', roleId: '', status: 'active' }); setShowModal(true); };
  const openEdit = (u: LoginUser) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', roleId: u.roleId?._id || '', status: u.status }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const payload: Record<string, unknown> = { name: form.name, email: form.email, roleId: form.roleId };
      if (form.password) payload.password = form.password;
      await userApi.update(editing._id, payload);
    } else {
      await userApi.create({ name: form.name, email: form.email, password: form.password, roleId: form.roleId });
    }
    setShowModal(false); load();
  };

  const toggleStatus = async (id: string) => {
    await userApi.toggleStatus(id);
    load();
  };

  const deactivate = async (id: string) => {
    if (confirm('Deactivate this user?')) {
      await userApi.remove(id);
      load();
    }
  };

  if (!hasPermission('users:read')) {
    return <div className="text-center py-12 text-gray-400">You don't have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage login users and role assignments</p>
          </div>
        </div>
        {hasPermission('users:create') && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add User</button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <table className="table-modern">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((u) => (
                  <tr key={u._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                    <td className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="text-gray-600">{u.email}</td>
                    <td><span className="badge bg-primary-50 text-primary-700">{u.roleId?.name || '-'}</span></td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('users:update') && (
                          <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all"><Pencil className="w-4 h-4" /></button>
                        )}
                        {hasPermission('users:update') && (
                          <button onClick={() => toggleStatus(u._id)}
                            className={`p-2 rounded-xl transition-all ${
                              u.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`} title={u.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {u.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        )}
                        {hasPermission('users:delete') && u.status === 'active' && (
                          <button onClick={() => deactivate(u._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && !loading && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>}
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
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div className="col-span-2">
                  <label className="label">{editing ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                  <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
                </div>
                <div className="col-span-2"><label className="label">Role</label>
                  <select className="input" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
                    <option value="">Select role</option>
                    {roles.filter((r) => r.status === 'active').map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
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
