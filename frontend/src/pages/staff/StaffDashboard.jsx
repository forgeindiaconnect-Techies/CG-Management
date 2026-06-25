import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import StatCard from '../../components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Search, RefreshCw, ArrowRight, Play, Send, X, ChevronDown,
  Bell, MessageSquare, Filter, SortAsc, Eye, Zap, Shield,
  FileText, Star, Activity, BarChart2, List,
} from 'lucide-react';

const PRIORITY_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };
const TAB_ICONS = { overview: BarChart2, complaints: List, notifications: Bell };

// ────────────────────────── helpers ──────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function actionColor(action) {
  const map = {
    'Status Changed': 'bg-blue-100 text-blue-700',
    'Comment Added': 'bg-gray-100 text-gray-600',
    'Complaint Assigned': 'bg-purple-100 text-purple-700',
    'Complaint Escalated': 'bg-red-100 text-red-700',
    'Complaint Created': 'bg-teal-100 text-teal-700',
    'Feedback Submitted': 'bg-amber-100 text-amber-700',
    'AI Re-analysis': 'bg-indigo-100 text-indigo-700',
  };
  return map[action] || 'bg-gray-100 text-gray-600';
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
export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
        const [statsRes, complaintsRes] = await Promise.all([
          API.get('/complaints/stats'),
          API.get('/complaints'),
        ]);
        setStats(statsRes.data);
        const data = complaintsRes.data;
        setComplaints(data);
        // Build notifications from recent activity across complaints
        const lastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
        const recent = data
          .filter(c => c.updatedAt)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 20)
          .map(c => {
            const time = new Date(c.updatedAt).getTime();
            return {
              id: c._id,
              title: c.title,
              status: c.status,
              priority: c.priority,
              updatedAt: c.updatedAt,
              department: c.department_id?.name || 'Unassigned',
              isNew: (Date.now() - time) < 86400000 && time > lastRead,
            };
          });
        setNotifications(recent);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [refreshKey]);

  // ── derived stats ──
  const resolvedToday = complaints.filter(c =>
    c.status === 'Resolved' && new Date(c.resolved_at).toDateString() === new Date().toDateString()
  ).length;
  const highPriority = complaints.filter(c => c.priority === 'High' && !['Resolved', 'Closed'].includes(c.status)).length;
  const escalated = complaints.filter(c => c.escalation_level > 0).length;
  const avgResolutionDays = (() => {
    const resolved = complaints.filter(c => c.resolved_at && c.createdAt);
    if (!resolved.length) return '—';
    const avg = resolved.reduce((sum, c) =>
      sum + (new Date(c.resolved_at) - new Date(c.createdAt)) / 86400000, 0) / resolved.length;
    return avg < 1 ? `${Math.round(avg * 24)}h` : `${avg.toFixed(1)}d`;
  })();

  // ── chart data ──
  const priorityData = (stats?.priorityStats || []).map(p => ({ name: p._id, value: p.count, fill: PRIORITY_COLORS[p._id] || '#8B5CF6' }));
  const statusData = [
    { name: 'New', value: complaints.filter(c => c.status === 'New').length, fill: '#6366F1' },
    { name: 'Assigned', value: complaints.filter(c => c.status === 'Assigned').length, fill: '#8B5CF6' },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length, fill: '#F59E0B' },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, fill: '#10B981' },
    { name: 'Closed', value: complaints.filter(c => c.status === 'Closed').length, fill: '#6B7280' },
  ].filter(d => d.value > 0);

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

  const unreadCount = notifications.filter(n => n.isNew).length;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-56" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
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

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#0F766E] uppercase tracking-widest mb-0.5">Staff Portal</p>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-500 text-sm mt-0.5">Here's an overview of your assigned work today.</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assigned" value={stats?.total ?? 0} icon={ClipboardList} color="teal" to="/complaints" />
        <StatCard label="In Progress" value={stats?.inProgress ?? 0} icon={Clock} color="amber" to="/complaints" />
        <StatCard label="High Priority" value={highPriority} icon={AlertTriangle} color="red" to="/complaints" />
        <StatCard label="Resolved Today" value={resolvedToday} icon={CheckCircle2} color="green" to="/complaints" />
      </div>

      {/* Secondary metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Resolved', value: stats?.resolved ?? 0, icon: '✅' },
          { label: 'SLA Breached', value: stats?.slaBreached ?? 0, icon: '⚠️' },
          { label: 'Escalated', value: escalated, icon: '🔺' },
          { label: 'Avg Resolution Time', value: avgResolutionDays, icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── OVERVIEW CONTENT ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-[#0F766E]" /> Priority Breakdown
          </h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Complaints']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-16">No complaints assigned yet</p>}
        </div>

        {/* Status Pie Chart */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[#0F766E]" /> Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-16">No data yet</p>}
        </div>

        {/* High Priority Alerts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Requires Immediate Attention
            </h3>
            <Link to="/complaints" className="text-xs text-[#0F766E] font-semibold hover:underline flex items-center gap-1">
              View All Complaints <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {complaints
              .filter(c => c.priority === 'High' && !['Resolved', 'Closed'].includes(c.status))
              .slice(0, 5)
              .map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/40 group">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.department_id?.name || 'Unassigned'} · {timeAgo(c.createdAt)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedComplaint(c)}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                      Act
                    </button>
                    <Link to={`/complaints/${c._id}`}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                      <Eye size={13} className="text-gray-500" />
                    </Link>
                  </div>
                </div>
              ))}
            {highPriority === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Shield size={32} className="mx-auto mb-2 text-green-400" />
                No high-priority complaints — great work! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-[#0F766E]" /> Recent Activity
            </h3>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {complaints.slice(0, 8).map(c => (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  c.priority === 'High' ? 'bg-red-500' : c.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#0F766E] transition-colors">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.user_id?.name} · {timeAgo(c.updatedAt || c.createdAt)}</p>
                </div>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </Link>
            ))}
            {complaints.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No complaints assigned to you yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
