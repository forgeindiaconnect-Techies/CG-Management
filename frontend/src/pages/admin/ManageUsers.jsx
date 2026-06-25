import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Trash2, Edit2, Check, X, Search, UserPlus } from 'lucide-react';

const ROLES = ['User', 'Staff', 'Department Head', 'Admin'];

const ROLE_COLORS = {
  'Admin': 'bg-purple-100 text-purple-700',
  'Staff': 'bg-blue-100 text-blue-700',
  'Department Head': 'bg-amber-100 text-amber-700',
  'User': 'bg-emerald-100 text-emerald-700',
};

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', department_id: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      API.get('/users'),
      API.get('/departments'),
    ])
      .then(([usersRes, deptsRes]) => {
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditForm({ role: u.role, department_id: u.department_id?._id || '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({ role: '', department_id: '' }); };

  const saveEdit = async (userId) => {
    setSaving(true);
    try {
      const res = await API.put(`/users/${userId}`, editForm);
      setUsers(prev => prev.map(u => u._id === userId ? res.data : u));
      cancelEdit();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await API.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} total accounts registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">USER</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">EMAIL</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ROLE</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">DEPARTMENT</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">JOINED</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${u._id === currentUser?._id ? 'bg-teal-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {u.name}
                            {u._id === currentUser?._id && <span className="ml-1.5 text-xs text-teal-600 font-medium">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400">ID: {u._id.substring(18)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{u.email}</td>

                    {/* Role — editable */}
                    <td className="px-4 py-4">
                      {editingId === u._id ? (
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* Department — editable */}
                    <td className="px-4 py-4">
                      {editingId === u._id ? (
                        <select
                          value={editForm.department_id}
                          onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
                        >
                          <option value="">No Department</option>
                          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-500">{u.department_id?.name || '—'}</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === u._id ? (
                          <>
                            <button
                              onClick={() => saveEdit(u._id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg bg-[#0F766E] text-white hover:bg-[#14B8A6] transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            {u._id !== currentUser?._id && (
                              <>
                                <button
                                  onClick={() => startEdit(u)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0F766E] transition-colors"
                                  title="Edit role/department"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => deleteUser(u._id, u.name)}
                                  disabled={deletingId === u._id}
                                  className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                  title="Delete user"
                                >
                                  {deletingId === u._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 text-sm py-12">
                      {search ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ROLE_COLORS[role]}`}>
              {role}: {count}
            </div>
          );
        })}
      </div>
    </div>
  );
}
