import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Plus, Trash2, Loader2, X, Building2 } from 'lucide-react';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', head_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepts = () => {
    API.get('/departments').then(r => setDepartments(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetchDepts, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/departments', form);
      setForm({ name: '', head_id: '' });
      setShowForm(false);
      fetchDepts();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await API.delete(`/departments/${id}`);
      fetchDepts();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Departments</h2>
          <p className="text-gray-500 text-sm mt-0.5">{departments.length} departments configured</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-sm font-semibold rounded-xl shadow hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">New Department</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Department name"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#0d6560] disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />} Create
            </button>
          </form>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)
        ) : departments.map(d => (
          <div key={d._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400">Head: {d.head_id?.name || 'Not assigned'}</p>
            </div>
            <button onClick={() => handleDelete(d._id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!loading && departments.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400 text-sm">No departments created yet</div>
        )}
      </div>
    </div>
  );
}
