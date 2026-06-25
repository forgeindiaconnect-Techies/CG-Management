import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Plus, Trash2, Loader2, X, Tag } from 'lucide-react';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCats = () => {
    API.get('/categories').then(r => setCategories(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetchCats, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/categories', form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      fetchCats();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await API.delete(`/categories/${id}`); fetchCats(); } catch (err) { console.error(err); }
  };

  const TAG_COLORS = ['from-[#0F766E] to-[#14B8A6]', 'from-[#06B6D4] to-[#0EA5E9]', 'from-[#8B5CF6] to-[#A78BFA]', 'from-[#F59E0B] to-[#FBBF24]', 'from-[#EF4444] to-[#F87171]', 'from-[#10B981] to-[#34D399]'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} complaint categories</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-sm font-semibold rounded-xl shadow hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">New Category</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
            <div className="flex gap-3">
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#0d6560] disabled:opacity-60 flex items-center gap-2">
                {submitting && <Loader2 size={14} className="animate-spin" />} Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)
        ) : categories.map((cat, i) => (
          <div key={cat._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${TAG_COLORS[i % TAG_COLORS.length]} flex items-center justify-center text-white flex-shrink-0`}>
              <Tag size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
              {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
            </div>
            <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400 text-sm">No categories created yet</div>
        )}
      </div>
    </div>
  );
}
