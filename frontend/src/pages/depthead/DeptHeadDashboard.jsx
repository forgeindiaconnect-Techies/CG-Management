import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatCard from '../../components/StatCard';
import { StatusBadge } from '../../components/Badges';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, AlertTriangle, Users, RefreshCw, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DeptHeadDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket } = useSocket() || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          API.get('/complaints/stats'),
          API.get('/complaints'),
        ]);
        setStats(statsRes.data);
        setComplaints(complaintsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    
    const handleNewComplaint = (newComplaint) => {
      // Only add to dashboard if it belongs to this department
      if (newComplaint.department_id && newComplaint.department_id._id === user.department_id) {
        setComplaints((prev) => [newComplaint, ...prev]);
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total: (prev.total || 0) + 1,
            open: (prev.open || 0) + 1
          };
        });
      }
    };

    socket.on('newComplaint', handleNewComplaint);
    return () => socket.off('newComplaint', handleNewComplaint);
  }, [socket, user]);

  const handleQuickClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this complaint?')) return;
    try {
      await API.put(`/complaints/${id}/status`, { status: 'Closed' });
      // Refresh complaints
      const [statsRes, complaintsRes] = await Promise.all([
        API.get('/complaints/stats'),
        API.get('/complaints'),
      ]);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      console.error('Failed to close complaint:', err);
      alert('Failed to close complaint');
    }
  };

  const reassigned = complaints.filter(c => c.escalation_level > 0).length;
  const resolutionRate = stats?.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const trendData = stats?.monthlyTrend?.map(m => ({
    name: MONTHS[m._id.month - 1],
    Complaints: m.count,
  })) || [];

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-56" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-28 bg-gray-200 rounded-2xl"/>)}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Department Head Dashboard</h2>
        <p className="text-gray-500 text-sm mt-0.5">Monitor your department's grievance performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Dept Complaints" value={stats?.total} icon={FileText} color="teal" to="/dept/complaints" />
        <StatCard label="SLA Violations" value={stats?.slaBreached} icon={AlertTriangle} color="red" to="/dept/complaints" />
        <StatCard label="Reassigned Tickets" value={reassigned} icon={RefreshCw} color="purple" to="/dept/complaints" />
        <StatCard label="Open" value={stats?.open} icon={FileText} color="cyan" to="/dept/complaints" />
        <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle2} color="green" to="/dept/complaints" />
        <StatCard label="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Department Trend Analysis</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Complaints" stroke="#0F766E" strokeWidth={2} dot={{ fill: '#0F766E', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-16">No trend data yet</p>}
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Department Complaints</h3>
            <Link to="/dept/complaints" className="text-sm text-[#0F766E] font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {complaints.slice(0, 7).map(c => (
              <Link key={c._id} to={`/complaints/${c._id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#0F766E]">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.user_id?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  {c.status === 'Resolved' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // prevent Link navigation
                        handleQuickClose(c._id);
                      }}
                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </Link>
            ))}
            {complaints.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No complaints in your department</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
