import { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          API.get('/complaints/stats'),
          API.get('/complaints')
        ]);
        setStats(statsRes.data);
        setComplaints(complaintsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const monthlyChartData = stats?.monthlyTrend?.map((m) => ({
    name: MONTHS[m._id.month - 1],
    Complaints: m.count,
  })) || [];

  const deptChartData = stats?.departmentStats?.map((d) => ({
    name: d.name?.length > 12 ? d.name.slice(0, 12) + '…' : (d.name || 'Unassigned'),
    Complaints: d.count,
  })) || [];

  const resolutionData = [
    { name: 'Resolved/Closed', value: stats?.resolved || 0 },
    { name: 'In Progress/Pending', value: stats?.inProgress || 0 },
    { name: 'Open/New', value: stats?.open || 0 },
  ].filter(d => d.value > 0);

  // Calculate satisfaction
  const ratingsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  complaints.forEach(c => {
    if (c.feedback_rating) {
      ratingsCount[c.feedback_rating] = (ratingsCount[c.feedback_rating] || 0) + 1;
    }
  });
  const satisfactionData = Object.entries(ratingsCount)
    .map(([rating, count]) => ({ name: `${rating} Star`, count }))
    .reverse();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-500 text-sm mt-0.5">Detailed system analytics and metrics</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Complaint Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="font-bold text-gray-800 mb-6">Complaint Trends</h3>
          <div className="flex-1">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="gradTeal2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="Complaints" stroke="#0F766E" fill="url(#gradTeal2)" strokeWidth={3} dot={{ fill: '#0F766E', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center"><p className="text-gray-400 text-sm">No data available</p></div>}
          </div>
        </div>

        {/* Resolution Rates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="font-bold text-gray-800 mb-6">Resolution Rates</h3>
          <div className="flex-1">
            {resolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resolutionData} cx="50%" cy="45%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {resolutionData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center"><p className="text-gray-400 text-sm">No data available</p></div>}
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="font-bold text-gray-800 mb-6">Department Performance</h3>
          <div className="flex-1">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 500 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} />
                  <Bar dataKey="Complaints" fill="#06B6D4" radius={[0, 6, 6, 0]} barSize={24}>
                    {deptChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0F766E', '#14B8A6', '#06B6D4', '#3B82F6'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center"><p className="text-gray-400 text-sm">No data available</p></div>}
          </div>
        </div>

        {/* User Satisfaction Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="font-bold text-gray-800 mb-6">User Satisfaction Ratings</h3>
          <div className="flex-1">
            {satisfactionData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={40} name="Total Ratings">
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#34D399', '#FCD34D', '#F87171', '#EF4444'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center"><p className="text-gray-400 text-sm">No ratings yet</p></div>}
          </div>
        </div>

      </div>
    </div>
  );
}
