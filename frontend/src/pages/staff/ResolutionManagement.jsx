import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { PriorityBadge } from '../../components/Badges';
import { CheckCircle2, UploadCloud, FileText, X } from 'lucide-react';

export default function ResolutionManagement() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInProgress();
  }, []);

  const fetchInProgress = async () => {
    try {
      const res = await API.get('/complaints');
      // Staff only resolves their assigned tickets that are in progress
      const filtered = user.role === 'Staff' 
        ? res.data.filter(c => (c.assigned_to?._id === user._id || c.assigned_to === user._id) && c.status === 'In Progress')
        : res.data.filter(c => c.status === 'In Progress');
      setComplaints(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedId || !resolution.trim()) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      // In a real app, we'd handle file upload to S3 or a local server here
      await API.put(`/complaints/${selectedId}/status`, { 
        status: 'Resolved', 
        resolution_notes: resolution 
      });
      setSuccess(true);
      setResolution('');
      setSelectedId('');
      fetchInProgress();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit resolution', err);
      alert('Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const selectedComplaint = complaints.find(c => c._id === selectedId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resolution Management</h2>
        <p className="text-gray-500 text-sm mt-1">Finalize complaints and upload proof documents for approval.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 size={18} /> Resolution submitted for approval successfully!
          </div>
          <button onClick={() => setSuccess(false)} className="text-green-500 hover:text-green-700"><X size={16}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Select Ticket */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Select Ticket ({complaints.length})</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                  <CheckCircle2 size={32} className="mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No complaints currently in progress.</p>
                </div>
              ) : complaints.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedId(c._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedId === c._id 
                      ? 'bg-teal-50 border-teal-200' 
                      : 'bg-white border-gray-100 hover:border-teal-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-mono text-gray-500">#{c._id.slice(-6).toUpperCase()}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Resolution Form */}
        <div className="md:col-span-2">
          {selectedComplaint ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedComplaint.title}</h3>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Resolution Details <span className="text-red-500">*</span></label>
                  <textarea
                    rows={5}
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Proof Document / Image</label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <UploadCloud size={28} className="text-gray-400 group-hover:text-[#0F766E] transition-colors mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to upload resolution file</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => { setSelectedId(''); setResolution(''); }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={submitting || !resolution.trim()}
                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No Ticket Selected</p>
              <p className="text-sm mt-1">Select a ticket from the left panel to add a resolution.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
