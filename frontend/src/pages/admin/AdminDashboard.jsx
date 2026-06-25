import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatCard from '../../components/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FileText, Inbox, Clock, CheckCircle2, AlertTriangle, Users,
  Building2, TrendingUp, RefreshCw, ArrowRight, Shield, Star
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PRIORITY_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };
const PIE_COLORS = ['#0F766E', '#14B8A6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

import { useSocket } from '../../context/SocketContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket() || {};

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [statsRes, complaintsRes, usersRes] = await Promise.all([
        API.get('/complaints/stats'),
        API.get('/complaints'),
        API.get('/users/staff').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
      setUserCount(usersRes.data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this complaint?')) return;
    try {
      await API.put(`/complaints/${id}/status`, { status: 'Closed' });
      fetchData(); // Refresh to update list and stats
    } catch (err) {
      console.error('Failed to close complaint:', err);
      alert('Failed to close complaint');
    }
  };

  const handleQuickResolve = async (id) => {
    if (!window.confirm('Are you sure you want to approve and resolve this complaint?')) return;
    try {
      await API.put(`/complaints/${id}/status`, { status: 'Resolved' });
      fetchData(); // Refresh to update list and stats
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
      alert(err.response?.data?.message || 'Failed to resolve complaint');
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewComplaint = (newComplaint) => {
      setComplaints((prev) => [newComplaint, ...prev]);
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: (prev.total || 0) + 1,
          open: (prev.open || 0) + 1
        };
      });
    };

    socket.on('newComplaint', handleNewComplaint);
    return () => socket.off('newComplaint', handleNewComplaint);
  }, [socket]);

  const monthlyChartData = stats?.monthlyTrend?.map((m) => ({
    name: MONTHS[m._id.month - 1],
    Complaints: m.count,
  })) || [];

  const deptChartData = stats?.departmentStats?.map((d) => ({
    name: d.name?.length > 12 ? d.name.slice(0, 12) + '…' : (d.name || 'Unassigned'),
    value: d.count,
  })) || [];

  const priorityData = stats?.priorityStats?.map((p) => ({
    name: p._id || 'Unknown',
    value: p.count,
    fill: PRIORITY_COLORS[p._id] || '#8B5CF6',
  })) || [];

  const resolutionRate = stats?.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const slaRate = stats?.total ? Math.round(((stats.total - (stats.slaBreached || 0)) / stats.total) * 100) : 100;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#0F766E] uppercase tracking-widest mb-0.5">System Administration</p>
          <h2 className="text-2xl font-black text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-0.5">Complete overview of the complaint management system</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Admin Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Complaints" value={stats?.total ?? 0} icon={FileText} color="teal" to="/complaints" />
        <StatCard label="Total Users" value={"245"} icon={Users} color="blue" to="/admin/users" />
        <StatCard label="Total Staff" value={userCount ?? 0} icon={Building2} color="purple" to="/admin/staff" />
        <StatCard label="Total Departments" value={deptChartData.length} icon={Building2} color="indigo" to="/admin/departments" />
        
        <StatCard label="Pending Complaints" value={(stats?.open ?? 0) + (stats?.inProgress ?? 0)} icon={Clock} color="amber" to="/complaints" />
        <StatCard label="Resolved Complaints" value={stats?.resolved ?? 0} icon={CheckCircle2} color="green" to="/complaints" />
        <StatCard label="Escalated Complaints" value={stats?.slaBreached ?? 0} icon={AlertTriangle} color="red" to="/complaints" />
        <StatCard label="Average Rating" value={"4.8/5.0"} icon={Star} color="yellow" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Monthly Complaint Trend</h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="Complaints" stroke="#0F766E" fill="url(#gradTeal)" strokeWidth={2.5} dot={{ fill: '#0F766E', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Department Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Complaints by Department</h3>
            <Link to="/admin/departments" className="text-xs text-[#0F766E] font-bold hover:underline flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-5">Priority Distribution</h3>
          {priorityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {priorityData.map(({ name, value, fill }) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: fill }} />
                      <span className="text-gray-600 font-medium">{name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart />}
        </div>

        {/* Recent Complaints */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Recent Complaints</h3>
            <Link to="/complaints" className="text-xs text-[#0F766E] font-bold hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {complaints.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No complaints yet</p>
              </div>
            ) : complaints.slice(0, 6).map((c) => (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm">
                  {c.user_id?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#0F766E] transition-colors">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.user_id?.name} · {c.department_id?.name || 'Unassigned'} · {timeAgo(c.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                  {c.status === 'Pending Review' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // prevent Link navigation
                        handleQuickResolve(c._id);
                      }}
                      className="text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#14B8A6] px-2 py-1 rounded transition-colors ml-1 shadow-sm"
                    >
                      Resolve
                    </button>
                  )}
                  {c.status === 'Resolved' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // prevent Link navigation
                        handleQuickClose(c._id);
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors ml-1"
                    >
                      Close
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/users', icon: Users, label: 'Manage Users', desc: 'Add, edit, remove users', color: 'from-blue-500 to-indigo-500' },
          { to: '/admin/departments', icon: Building2, label: 'Departments', desc: 'Organize teams', color: 'from-purple-500 to-violet-500' },
          { to: '/admin/categories', icon: Tag, label: 'Categories', desc: 'Complaint categories', color: 'from-amber-500 to-orange-500' },
          { to: '/complaints', icon: Shield, label: 'All Complaints', desc: 'Full complaint list', color: 'from-[#0F766E] to-[#14B8A6]' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-800 group-hover:text-[#0F766E] transition-colors">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Missing import for Tag
function Tag({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-gray-300 space-y-2">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <TrendingUp size={18} className="text-gray-300" />
      </div>
      <p className="text-sm">No data available yet</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-52" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  );
}
