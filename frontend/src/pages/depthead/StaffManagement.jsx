import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Users, Mail, Activity, CheckCircle2, AlertTriangle, Briefcase } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const [staffRes, compRes] = await Promise.all([
          API.get('/users/staff'),
          API.get('/complaints')
        ]);
        
        const allComplaints = compRes.data;
        
        // Enrich staff data with their current metrics
        const enrichedStaff = staffRes.data.map(member => {
          const theirComplaints = allComplaints.filter(c => c.assigned_to?._id === member._id);
          const active = theirComplaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
          const resolved = theirComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
          const breaches = theirComplaints.filter(c => c.sla_breach).length;

          return { ...member, active, resolved, breaches, total: theirComplaints.length };
        });

        setStaff(enrichedStaff);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStaffData();
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        <p className="text-gray-500 text-sm mt-1">View staff members and monitor their current workload.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <div key={member._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-xl font-black shadow-sm">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{member.name}</h3>
                <p className="text-sm text-[#0F766E] font-medium">{member.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 bg-gray-50 px-3 py-2 rounded-xl">
              <Mail size={14} className="text-gray-400" /> {member.email}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Briefcase size={13} className="text-blue-500"/> Active</span>
                  <span className="font-bold text-gray-900">{member.active}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((member.active / 10) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-green-500"/> Resolved</span>
                  <span className="font-bold text-gray-900">{member.resolved}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((member.resolved / 50) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="col-span-2 pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Activity size={14} className="text-gray-400" /> Total Handled: {member.total}
                </div>
                {member.breaches > 0 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={12} /> {member.breaches} SLA Breaches
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {staff.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500">
            No staff members found in this department.
          </div>
        )}
      </div>
    </div>
  );
}
