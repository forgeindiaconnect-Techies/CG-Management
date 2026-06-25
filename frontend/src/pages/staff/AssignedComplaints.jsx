import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import {
  Search, ChevronDown, FileText, AlertTriangle, Play, CheckCircle2,
  MessageSquare, Eye, X, Send
} from 'lucide-react';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ────────────────────────── Quick Action Modal ──────────────────────────
function QuickActionModal({ complaint, onClose, onRefresh }) {
  const [tab, setTab] = useState('status');
  const [resolution, setResolution] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const act = async (fn) => {
    setLoading(true); setError(''); setSuccess('');
    try { await fn(); setSuccess('Done!'); setTimeout(() => { onRefresh(); onClose(); }, 800); }
    catch (e) { setError(e.response?.data?.message || 'Action failed'); }
    finally { setLoading(false); }
  };

  const handleStartWork = () => act(() => API.put(`/complaints/${complaint._id}/status`, { status: 'In Progress' }));
  const handleResolve = () => {
    if (!resolution.trim()) { setError('Resolution notes are required.'); return; }
    act(() => API.put(`/complaints/${complaint._id}/status`, { status: 'Resolved', resolution_notes: resolution }));
  };
  const handleEscalate = () => act(() => API.put(`/complaints/${complaint._id}/escalate`));
  const handleComment = () => {
    if (!comment.trim()) { setError('Comment cannot be empty.'); return; }
    act(() => API.post(`/complaints/${complaint._id}/comments`, { content: comment }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-bold text-[#0F766E] uppercase tracking-widest mb-0.5">Quick Action</p>
            <h3 className="font-bold text-gray-900 truncate">{complaint.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 gap-1 pt-1">
          {['status', 'comment', 'escalate'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors capitalize ${tab === t ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-gray-400 hover:text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'status' && (
            <div className="space-y-3">
              {complaint.status === 'Assigned' && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Start Working</p>
                    <p className="text-xs text-purple-600 mt-0.5">Mark this ticket as In Progress</p>
                  </div>
                  <button onClick={handleStartWork} disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                    <Play size={12} /> Start Work
                  </button>
                </div>
              )}
              {complaint.status === 'In Progress' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-600">Resolution Notes <span className="text-red-500">*</span></label>
                  <textarea rows={4} value={resolution} onChange={e => setResolution(e.target.value)}
                    placeholder="Describe the steps taken to resolve this issue…"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                  <button onClick={handleResolve} disabled={loading || !resolution.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                    <CheckCircle2 size={15} /> {loading ? 'Submitting…' : 'Mark as Resolved'}
                  </button>
                </div>
              )}
              {(complaint.status === 'New' || complaint.status === 'Closed' || complaint.status === 'Resolved') && (
                <p className="text-sm text-gray-400 text-center py-4">No status actions available for this complaint.</p>
              )}
            </div>
          )}

          {tab === 'comment' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600">Add Internal Note / Comment</label>
              <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Write your comment or internal note here…"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
              <button onClick={handleComment} disabled={loading || !comment.trim()}
                className="w-full py-2.5 bg-[#0F766E] text-white text-sm font-bold rounded-xl hover:bg-[#0d6560] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Send size={14} /> {loading ? 'Sending…' : 'Post Comment'}
              </button>
            </div>
          )}

          {tab === 'escalate' && (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5"><AlertTriangle size={14} /> Escalate Complaint</p>
                <p className="text-xs text-red-600 mt-1.5">Escalating will increase the priority to <strong>High</strong> and notify the Department Head.</p>
                {complaint.escalation_level > 0 && (
                  <p className="text-xs text-red-500 mt-1">Current escalation level: <strong>Level {complaint.escalation_level}</strong></p>
                )}
              </div>
              {complaint.escalation_level >= 3 ? (
                <p className="text-xs text-gray-400 text-center">Maximum escalation level (3) reached.</p>
              ) : (
                <button onClick={handleEscalate} disabled={loading}
                  className="w-full py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  <AlertTriangle size={14} /> {loading ? 'Escalating…' : 'Escalate Now'}
                </button>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle2 size={12} /> {success}</p>}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────── Main Component ──────────────────────────
export default function AssignedComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await API.get('/complaints');
        setComplaints(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [refreshKey]);

  // ── filtered list ──
  const filteredComplaints = complaints
    .filter(c => statusFilter === 'All' || c.status === statusFilter)
    .filter(c => priorityFilter === 'All' || c.priority === priorityFilter)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.user_id?.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      return 0;
    });

  if (loading) return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-8 bg-gray-200 rounded-xl w-56" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick-Action Modal */}
      {selectedComplaint && (
        <QuickActionModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onRefresh={refresh}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Assigned Complaints</h2>
        <p className="text-gray-500 text-sm mt-0.5">Manage and track complaints assigned to you.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints or user name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {['All', 'New', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === s ? 'bg-[#0F766E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s}
              </button>
            ))}
          </div>
          {/* Priority filter */}
          <div className="relative">
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white text-gray-600">
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Sort */}
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white text-gray-600">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">By Priority</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <p className="text-xs text-gray-400">{filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''} found</p>

        {/* Complaint Cards */}
        <div className="space-y-3">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No complaints match your filters</p>
            </div>
          ) : filteredComplaints.map(c => (
            <div key={c._id}
              className={`rounded-xl border p-4 hover:shadow-sm transition-all ${
                c.priority === 'High' && !['Resolved', 'Closed'].includes(c.status)
                  ? 'border-red-200 bg-red-50/20'
                  : 'border-gray-100 bg-white'
              }`}>
              <div className="flex items-start gap-3">
                {/* Priority dot */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                  c.priority === 'High' ? 'bg-red-500' : c.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Submitted by <span className="font-semibold">{c.user_id?.name || 'Unknown'}</span>
                        {c.department_id?.name && <> · {c.department_id.name}</>}
                        <> · {timeAgo(c.createdAt)}</>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {/* SLA / escalation indicators */}
                  <div className="flex items-center gap-2 mt-2">
                    {c.sla_breach && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={9} /> SLA Breached
                      </span>
                    )}
                    {c.escalation_level > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        🔺 Level {c.escalation_level} Escalation
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Link to={`/complaints/${c._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                      <Eye size={12} /> View Details
                    </Link>

                    {c.status === 'Assigned' && (
                      <button onClick={() => setSelectedComplaint(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors">
                        <Play size={12} /> Start Work
                      </button>
                    )}
                    {c.status === 'In Progress' && (
                      <button onClick={() => setSelectedComplaint(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle2 size={12} /> Resolve
                      </button>
                    )}
                    <button onClick={() => setSelectedComplaint(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageSquare size={12} /> Comment
                    </button>
                    {!['Resolved', 'Closed'].includes(c.status) && c.escalation_level < 3 && (
                      <button onClick={() => setSelectedComplaint(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                        <AlertTriangle size={12} /> Escalate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
