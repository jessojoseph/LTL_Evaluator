import { useEffect, useState } from 'react';
import { userApi, roleApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { LoginUser, Role } from '../types';
import { Plus, Pencil, X, Power, PowerOff, UserCog } from 'lucide-react';

export default function Users() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LoginUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', status: 'active' });

  const load = () => {
    userApi.getAll().then(({ data }) => setUsers(data.users));
    roleApi.getAll().then(({ data }) => setRoles(data.roles));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', roleId: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (u: LoginUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', roleId: u.roleId?._id || '', status: u.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const payload: Record<string, unknown> = { name: form.name, email: form.email, roleId: form.roleId };
      if (form.password) payload.password = form.password;
      await userApi.update(editing._id, payload);
    } else {
      await userApi.create({ name: form.name, email: form.email, password: form.password, roleId: form.roleId });
    }
    setShowModal(false);
    load();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage login users and role assignments</p>
        </div>
        {hasPermission('users:create') && (
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add User</button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-indigo-50 text-indigo-700">{u.roleId?.name || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('users:update') && (
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('users:update') && (
                        <button
                          onClick={() => toggleStatus(u._id)}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                            u.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {u.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                      {hasPermission('users:delete') && u.status === 'active' && (
                        <button onClick={() => deactivate(u._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
