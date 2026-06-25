import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { CheckCircle2, XCircle, RefreshCw, FileText, Search } from 'lucide-react';
import { PriorityBadge } from '../../components/Badges';

export default function PendingApprovals() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await API.get('/complaints');
      // Filter for complaints that need approval from Dept Head
      setComplaints(res.data.filter(c => c.status === 'Pending Review'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, actionType) => {
    setActionLoading(id);
    try {
      if (actionType === 'Approve') {
        await API.put(`/complaints/${id}/status`, { status: 'Resolved' });
      } else {
        // Reject or Request Rework
        const actionText = actionType === 'Reject' ? 'Resolution Rejected' : 'Rework Requested';
        // Add comment
        await API.post(`/complaints/${id}/comments`, { content: `[Department Head Action]: ${actionText}. Please review and update the resolution.` });
        // Change status back to In Progress
        await API.put(`/complaints/${id}/status`, { status: 'In Progress' });
      }
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing action');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.assigned_to?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
          <p className="text-gray-500 text-sm mt-1">Review resolutions submitted by your staff.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search approvals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No pending approvals at the moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <div key={c._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Link to={`/complaints/${c._id}`} className="font-bold text-gray-900 hover:text-[#0F766E] text-lg">
                        {c.title}
                      </Link>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-xs">
                      <p className="text-gray-500"><span className="font-semibold text-gray-700">Resolved by:</span> {c.assigned_to?.name || 'Unknown'}</p>
                      <p className="text-gray-500"><span className="font-semibold text-gray-700">Resolution Date:</span> {new Date(c.resolved_at || c.updatedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
                      <p className="text-xs font-bold text-teal-800 mb-1">Staff Resolution Notes:</p>
                      <p className="text-sm text-teal-900">{c.resolution_notes || 'No notes provided.'}</p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(c._id, 'Approve')} disabled={actionLoading === c._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button onClick={() => handleAction(c._id, 'Rework')} disabled={actionLoading === c._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                      <RefreshCw size={16} /> Request Rework
                    </button>
                    <button onClick={() => handleAction(c._id, 'Reject')} disabled={actionLoading === c._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
