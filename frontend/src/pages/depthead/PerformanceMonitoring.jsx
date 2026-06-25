import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import StatCard from '../../components/StatCard';

const COLORS = ['#0F766E', '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6'];

export default function PerformanceMonitoring() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [compRes, staffRes] = await Promise.all([
          API.get('/complaints'),
          API.get('/users/staff')
        ]);
        
        const complaints = compRes.data;
        const staff = staffRes.data;

        // Calculate performance metrics
        const staffPerformance = staff.map(member => {
          const theirComplaints = complaints.filter(c => c.assigned_to?._id === member._id);
          const resolved = theirComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status));
          const total = theirComplaints.length;
          const rate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
          
          let totalTime = 0;
          resolved.forEach(c => {
            const timeDiff = new Date(c.resolved_at || c.updatedAt).getTime() - new Date(c.createdAt).getTime();
            totalTime += timeDiff / (1000 * 3600 * 24); // in days
          });
          const avgTime = resolved.length > 0 ? (totalTime / resolved.length).toFixed(1) : 0;

          const breaches = theirComplaints.filter(c => c.sla_breach).length;

          return {
            name: member.name.split(' ')[0], // First name for chart
            ResolutionRate: rate,
            AvgDays: parseFloat(avgTime),
            SLABreaches: breaches,
            resolvedCount: resolved.length
          };
        }).filter(s => s.total !== 0); // Only staff who had complaints assigned

        const totalResolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
        const totalBreaches = complaints.filter(c => c.sla_breach).length;
        const deptCompliance = complaints.length > 0 ? Math.round(((complaints.length - totalBreaches) / complaints.length) * 100) : 100;

        // Priority breakdown of resolved
        const priorityData = [
          { name: 'High', value: complaints.filter(c => c.priority === 'High').length },
          { name: 'Medium', value: complaints.filter(c => c.priority === 'Medium').length },
          { name: 'Low', value: complaints.filter(c => c.priority === 'Low').length },
        ].filter(d => d.value > 0);

        setMetrics({ staffPerformance, totalResolved, deptCompliance, priorityData });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
        <p className="text-gray-500 text-sm mt-1">Track resolution rates, SLA compliance, and staff efficiency.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Dept SLA Compliance" value={`${metrics?.deptCompliance || 0}%`} icon={CheckCircle2} color="teal" />
        <StatCard label="Total Resolved" value={metrics?.totalResolved || 0} icon={TrendingUp} color="blue" />
        <StatCard label="Avg Resolution Time" value={metrics?.staffPerformance?.length > 0 ? (metrics.staffPerformance.reduce((acc, curr) => acc + curr.AvgDays, 0) / metrics.staffPerformance.length).toFixed(1) + ' Days' : 'N/A'} icon={Clock} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Resolution Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Staff Resolution Rate (%)</h3>
          {metrics?.staffPerformance?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="ResolutionRate" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-16">No staff performance data</p>}
        </div>

        {/* Staff SLA Breaches */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6">SLA Breaches by Staff</h3>
          {metrics?.staffPerformance?.some(s => s.SLABreaches > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.staffPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="SLABreaches" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
              <CheckCircle2 size={32} className="text-green-300 mb-2" />
              <p className="font-medium text-gray-600">Perfect SLA Compliance</p>
              <p className="text-xs mt-1">No SLA breaches recorded for any staff member.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
