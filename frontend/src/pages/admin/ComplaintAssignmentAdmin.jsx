import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Search, UserPlus, CheckCircle2, RefreshCw } from 'lucide-react';
import { PriorityBadge } from '../../components/Badges';

export default function ComplaintAssignmentAdmin() {
  const [activeTab, setActiveTab] = useState('auto'); // 'auto', 'manual', 'reassign'
  
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
      setComplaints(compRes.data);
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

  const getFilteredComplaints = () => {
    let filtered = complaints.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 'manual') {
      filtered = filtered.filter(c => c.status === 'New');
    } else if (activeTab === 'reassign') {
      filtered = filtered.filter(c => ['Assigned', 'In Progress'].includes(c.status));
    }
    return filtered;
  };

  const filtered = getFilteredComplaints();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Complaint Assignment</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage auto-assignment rules and manual assignments</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveTab('auto')}
          className={`text-left rounded-2xl p-6 shadow-sm border transition-colors ${activeTab === 'auto' ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-gray-100 hover:border-[#0F766E]/30'}`}
        >
          <h3 className={`font-bold mb-4 ${activeTab === 'auto' ? 'text-white' : 'text-gray-800'}`}>Auto Assignment Rules</h3>
          <p className={`text-sm ${activeTab === 'auto' ? 'text-teal-50' : 'text-gray-500'}`}>Configure rules for automatic routing of complaints.</p>
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`text-left rounded-2xl p-6 shadow-sm border transition-colors ${activeTab === 'manual' ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-gray-100 hover:border-[#0F766E]/30'}`}
        >
          <h3 className={`font-bold mb-4 ${activeTab === 'manual' ? 'text-white' : 'text-gray-800'}`}>Manual Assignment</h3>
          <p className={`text-sm ${activeTab === 'manual' ? 'text-teal-50' : 'text-gray-500'}`}>Assign New complaints to staff manually.</p>
        </button>
        <button 
          onClick={() => setActiveTab('reassign')}
          className={`text-left rounded-2xl p-6 shadow-sm border transition-colors ${activeTab === 'reassign' ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-gray-100 hover:border-[#0F766E]/30'}`}
        >
          <h3 className={`font-bold mb-4 ${activeTab === 'reassign' ? 'text-white' : 'text-gray-800'}`}>Reassignment</h3>
          <p className={`text-sm ${activeTab === 'reassign' ? 'text-teal-50' : 'text-gray-500'}`}>Reassign Active complaints to other staff members.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'auto' && (
           <div className="max-w-2xl">
             <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Auto Assignment</h3>
             <p className="text-gray-600 mb-4">
               The system currently uses an advanced AI engine (Gemini) to automatically route complaints to the correct department when they are created by a user.
             </p>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
               <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                 <li>When a complaint is submitted, the AI analyzes the Title and Description.</li>
                 <li>It cross-references the text with your existing Categories and Departments.</li>
                 <li>It assigns the best matching Department and Category automatically.</li>
                 <li>It also calculates the Priority (Low, Medium, High) based on urgency keywords.</li>
               </ul>
             </div>
             <p className="text-gray-500 text-sm mt-4 italic">
               Note: To modify where complaints are routed, ensure your Categories and Departments have clear, distinct names and descriptions in their respective management pages.
             </p>
           </div>
        )}

        {(activeTab === 'manual' || activeTab === 'reassign') && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {activeTab === 'manual' ? 'Manual Assignment (New Complaints)' : 'Reassignment (Active Complaints)'}
              </h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse h-64 bg-gray-50 rounded-xl" />
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Complaint</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status & Priority</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-72">Assign To Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(c => (
                      <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{c.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.description}</p>
                          <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(c.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 space-y-1.5">
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-lg border ${
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 bg-white border border-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                              value={c.assigned_to?._id || ''}
                              onChange={(e) => handleAssign(c._id, e.target.value)}
                              disabled={assigningId === c._id}
                            >
                              <option value="" disabled>Select Staff Member</option>
                              {staff.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.department_id?.name || 'No Dept'})</option>
                              ))}
                            </select>
                            {assigningId === c._id ? (
                              <RefreshCw size={16} className="text-[#0F766E] animate-spin flex-shrink-0" />
                            ) : c.assigned_to ? (
                              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <UserPlus size={16} className="text-gray-400 flex-shrink-0" />
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
                        <td colSpan="3" className="px-4 py-12 text-center text-gray-500">
                          No complaints found in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
