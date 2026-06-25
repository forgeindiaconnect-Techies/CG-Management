import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { FileText, Clock, CheckCircle2, Plus, ArrowRight, RefreshCw, Star, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STEPS = ['New', 'Assigned', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

function ComplaintStatusBar({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-1">
          <div className={`h-1.5 w-full rounded-full transition-all ${i <= idx ? 'bg-[#14B8A6]' : 'bg-gray-100'}`} />
        </div>
      ))}
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const r = await API.get('/complaints');
      setComplaints(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const open = complaints.filter(c => c.status === 'New').length;
  const inProgress = complaints.filter(c => ['In Progress', 'Assigned'].includes(c.status)).length;
  const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const awaitingFeedback = complaints.filter(c => c.status === 'Closed' && !c.feedback_rating).length;

  const statusData = [
    { name: 'New', value: open, color: '#3B82F6' },
    { name: 'In Progress', value: inProgress, color: '#F59E0B' },
    { name: 'Resolved/Closed', value: resolved, color: '#10B981' },
  ].filter(d => d.value > 0);


  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-52" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}</div>
      <div className="h-72 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#0F766E] uppercase tracking-widest mb-0.5">Citizen Portal</p>
          <h2 className="text-2xl font-black text-gray-900">Hello, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage your submitted grievances</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchComplaints(true)} disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link to="/complaints/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}>
            <Plus size={16} /> New Complaint
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Submitted" value={complaints.length} icon={FileText} color="teal" to="/complaints" />
        <StatCard label="In Progress" value={inProgress} icon={Clock} color="amber" to="/complaints" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} color="green" to="/complaints" />
      </div>

      {/* Awaiting feedback nudge */}
      {awaitingFeedback > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-amber-200 bg-amber-50">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Star size={18} className="text-white fill-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              {awaitingFeedback} complaint{awaitingFeedback > 1 ? 's' : ''} awaiting your feedback!
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Your ratings help us improve our service.</p>
          </div>
          <Link to="/complaints" className="text-xs font-bold text-amber-700 hover:underline flex-shrink-0">
            Rate now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Overview Chart */}
        <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-[#0F766E]" /> Status Overview
          </h3>
          {statusData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600 font-medium">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Complaints Table */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent Complaints</h3>
            <Link to="/complaints" className="text-sm text-[#0F766E] font-bold hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>

        {complaints.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
              <FileText size={28} className="text-gray-200" />
            </div>
            <div>
              <p className="text-gray-700 font-bold">No complaints submitted yet</p>
              <p className="text-gray-400 text-sm mt-1">Submit your first grievance and we'll handle the rest.</p>
            </div>
            <Link to="/complaints/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}>
              <Plus size={15} /> Submit Complaint
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {complaints.slice(0, 8).map(c => (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                {/* Priority dot */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                  c.priority === 'High' ? 'bg-red-500' : c.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-[#0F766E] transition-colors truncate">
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.department_id?.name || 'Pending assignment'} · {timeAgo(c.createdAt)}
                  </p>
                  {/* Mini progress bar */}
                  <ComplaintStatusBar status={c.status} />
                  {/* Feedback nudge */}
                  {c.status === 'Closed' && !c.feedback_rating && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      <Star size={9} className="fill-amber-400 text-amber-400" /> Rate this resolution
                    </span>
                  )}
                  {c.feedback_rating && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= c.feedback_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
