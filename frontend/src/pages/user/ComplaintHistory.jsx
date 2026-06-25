import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { History, Star, CheckCircle2, Download, FileText, Filter } from 'lucide-react';
import { StatusBadge } from '../../components/Badges';
import { Link } from 'react-router-dom';

function timeAgo(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ComplaintHistory() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/complaints');
        const history = res.data.filter(c => ['Resolved', 'Closed'].includes(c.status));
        setComplaints(history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);
  const totalResolved = complaints.filter(c => c.status === 'Resolved').length;
  const totalClosed = complaints.filter(c => c.status === 'Closed').length;
  const rated = complaints.filter(c => c.feedback_rating).length;
  const avgRating = rated > 0
    ? (complaints.filter(c => c.feedback_rating).reduce((s, c) => s + c.feedback_rating, 0) / rated).toFixed(1)
    : null;

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Complaint History</h2>
        <p className="text-gray-500 text-sm mt-1">All your resolved and closed complaints.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Resolved', value: totalResolved, icon: '✅' },
          { label: 'Total Closed', value: totalClosed, icon: '🔒' },
          { label: 'Rated', value: rated, icon: '⭐' },
          { label: 'Avg Rating', value: avgRating ? `${avgRating}/5` : '—', icon: '📊' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', 'Resolved', 'Closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filter === f ? 'bg-[#0F766E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <History size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="font-medium text-gray-600">No complaints in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.department_id?.name || 'Unassigned'} · {c.category_id?.name || 'Uncategorized'}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              {c.resolution_notes && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl mb-3">
                  <p className="text-[11px] font-bold text-green-700 mb-0.5">Resolution</p>
                  <p className="text-xs text-green-800 leading-relaxed">{c.resolution_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  {c.feedback_rating ? (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={13} className={s <= c.feedback_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({c.feedback_rating}/5)</span>
                    </div>
                  ) : (
                    <Link to="/feedback" className="text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1">
                      <Star size={12} className="text-amber-400" /> Rate now →
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Resolved: {timeAgo(c.resolved_at || c.updatedAt)}</span>
                  <Link to={`/complaints/${c._id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-[#0F766E] border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
