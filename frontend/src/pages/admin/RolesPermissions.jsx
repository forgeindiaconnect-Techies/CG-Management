import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Shield, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  'view_complaints',
  'create_complaints',
  'assign_complaints',
  'resolve_complaints',
  'manage_users',
  'manage_departments',
  'view_reports',
  'manage_system'
];

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/roles');
      // If DB is empty, mock the 4 base roles visually
      if (res.data.length === 0) {
        setRoles([
          { _id: '1', name: 'Admin', isCustom: false, permissions: AVAILABLE_PERMISSIONS },
          { _id: '2', name: 'Department Head', isCustom: false, permissions: ['view_complaints', 'assign_complaints', 'resolve_complaints', 'view_reports'] },
          { _id: '3', name: 'Staff', isCustom: false, permissions: ['view_complaints', 'resolve_complaints'] },
          { _id: '4', name: 'User', isCustom: false, permissions: ['create_complaints', 'view_complaints'] }
        ]);
      } else {
        setRoles(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (perm) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/roles', formData);
      setShowModal(false);
      fetchRoles();
      setFormData({ name: '', description: '', permissions: [] });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom role?')) return;
    try {
      await API.delete(`/roles/${id}`);
      fetchRoles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage access control and define custom roles</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#14B8A6] transition-colors shadow-sm"
        >
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Shield size={18} className="text-[#0F766E]" /> Permissions Matrix
          </h3>
          <p className="text-xs text-gray-500 mt-1">Check which role has access to specific system modules.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 w-1/4">Role / Module</th>
                {AVAILABLE_PERMISSIONS.map(p => (
                  <th key={p} className="px-4 py-4 font-semibold text-gray-500 text-xs text-center uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    {p.replace('_', ' ')}
                  </th>
                ))}
                <th className="px-6 py-4 text-right font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={AVAILABLE_PERMISSIONS.length + 2} className="p-8 text-center text-gray-400">Loading roles...</td>
                </tr>
              ) : roles.map(role => (
                <tr key={role._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{role.isCustom === false ? 'System Default' : 'Custom Role'}</div>
                  </td>
                  {AVAILABLE_PERMISSIONS.map(p => (
                    <td key={p} className="px-4 py-4 text-center">
                      {role.permissions?.includes(p) ? (
                        <CheckCircle2 size={18} className="text-green-500 mx-auto" />
                      ) : (
                        <XCircle size={18} className="text-red-200 mx-auto" />
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    {role.isCustom !== false && (
                      <button 
                        onClick={() => handleDelete(role._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Custom Role"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Create Custom Role</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Role Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Support Lead"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Assign Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handleTogglePermission(perm)}
                        className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <span className="text-sm text-gray-700 capitalize">{perm.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#14B8A6] transition-colors shadow-sm"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
