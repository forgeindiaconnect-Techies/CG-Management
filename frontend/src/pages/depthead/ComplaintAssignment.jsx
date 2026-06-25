import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Users, Search, UserPlus, CheckCircle2 } from 'lucide-react';
import { PriorityBadge } from '../../components/Badges';

export default function ComplaintAssignment() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  const fetchData = async () => {
    try {
      const [compRes, staffRes] = await Promise.all([
        API.get('/complaints'),
        API.get('/users/staff')
      ]);
      // Only show complaints that can be assigned (New, Assigned, In Progress)
      setComplaints(compRes.data.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status)));
      setStaff(staffRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (complaintId, staffId) => {
    if (!staffId) return;
    setAssigningId(complaintId);
    try {
      await API.put(`/complaints/${complaintId}/assign`, { assigned_to: staffId });
      // Update local state to reflect assignment
      const assignedStaff = staff.find(s => s._id === staffId);
      setComplaints(prev => prev.map(c => 
        c._id === complaintId 
          ? { ...c, assigned_to: assignedStaff, status: c.status === 'New' ? 'Assigned' : c.status }
          : c
      ));
    } catch (err) {
      alert('Failed to assign complaint');
    } finally {
      setAssigningId(null);
    }
  };

  const filtered = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaint Assignment</h2>
          <p className="text-gray-500 text-sm mt-1">Assign or reassign active complaints to your staff.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Complaint Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status & Priority</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-72">Assign To Staff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(c.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 space-y-2">
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${
                    c.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    c.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {c.status}
                  </span>
                  <div>
                    <PriorityBadge priority={c.priority} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 bg-white border border-gray-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      value={c.assigned_to?._id || ''}
                      onChange={(e) => handleAssign(c._id, e.target.value)}
                      disabled={assigningId === c._id}
                    >
                      <option value="" disabled>Select Staff Member</option>
                      {staff.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                    {assigningId === c._id ? (
                      <RefreshCw size={18} className="text-[#0F766E] animate-spin flex-shrink-0" />
                    ) : c.assigned_to ? (
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <UserPlus size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {c.assigned_to && (
                    <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Currently assigned to: <span className="font-semibold text-gray-600">{c.assigned_to.name}</span></p>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                  No complaints found needing assignment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
