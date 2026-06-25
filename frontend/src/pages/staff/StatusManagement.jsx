import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { PriorityBadge } from '../../components/Badges';
import { Clock, CheckCircle2, Play, Users, AlertTriangle, ChevronRight, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLUMNS = [
  { id: 'Assigned', title: 'To Do', icon: Clock, color: 'border-gray-200 bg-gray-50' },
  { id: 'In Progress', title: 'In Progress', icon: Play, color: 'border-purple-200 bg-purple-50' },
  { id: 'Pending', title: 'Pending Info', icon: AlertTriangle, color: 'border-amber-200 bg-amber-50' },
  { id: 'Resolved', title: 'Resolved', icon: CheckCircle2, color: 'border-green-200 bg-green-50' },
];

export default function StatusManagement() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get('/complaints');
      // For staff, they'll usually only get their own or we can filter here
      const filtered = user.role === 'Staff' 
        ? res.data.filter(c => c.assigned_to?._id === user._id || c.assigned_to === user._id)
        : res.data;
      setComplaints(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.put(`/complaints/${id}/status`, { status: newStatus, resolution_notes: newStatus === 'Pending Review' ? 'Resolved via Kanban board' : undefined });
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Group complaints by status (map 'New' to 'Assigned' for Staff)
  const grouped = {
    'Assigned': complaints.filter(c => ['New', 'Assigned'].includes(c.status)),
    'In Progress': complaints.filter(c => c.status === 'In Progress'),
    'Pending': complaints.filter(c => c.status === 'Pending'),
    'Resolved': complaints.filter(c => ['Pending Review', 'Resolved', 'Closed'].includes(c.status)),
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Status Management Board</h2>
        <p className="text-gray-500 text-sm mt-1">Track and update complaint progress via Kanban board.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {COLUMNS.map(col => (
            <div key={col.id} className={`w-80 rounded-2xl border ${col.color} flex flex-col max-h-[calc(100vh-200px)]`}>
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <col.icon size={16} className="text-gray-700" />
                  <h3 className="font-bold text-gray-800 text-sm">{col.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-gray-600 text-xs font-bold shadow-sm border border-gray-100">
                  {grouped[col.id].length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {grouped[col.id].map(c => (
                  <div key={c._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-semibold text-gray-400">#{c._id.slice(-6).toUpperCase()}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">{c.title}</p>
                    <p className="text-xs text-gray-500 mb-3 truncate">{c.user_id?.name || 'Unknown User'}</p>
                    
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <Link to={`/complaints/${c._id}`} className="text-xs font-semibold text-gray-500 hover:text-[#0F766E] flex items-center gap-1">
                        <MessageSquare size={12} /> Details
                      </Link>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.id === 'Assigned' && (
                          <button onClick={() => handleUpdateStatus(c._id, 'In Progress')} className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                            Start
                          </button>
                        )}
                        {col.id === 'In Progress' && (
                          <>
                            <button onClick={() => handleUpdateStatus(c._id, 'Pending')} className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                              Wait
                            </button>
                            <button onClick={() => handleUpdateStatus(c._id, 'Pending Review')} className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded hover:bg-green-200">
                              Submit for Review
                            </button>
                          </>
                        )}
                        {col.id === 'Pending' && (
                          <button onClick={() => handleUpdateStatus(c._id, 'In Progress')} className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                            Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {grouped[col.id].length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-medium">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
