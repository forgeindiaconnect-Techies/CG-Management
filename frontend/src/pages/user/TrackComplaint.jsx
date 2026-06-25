import { useState } from 'react';
import API from '../../api/axios';
import { Search, Clock, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Building2, User } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../../components/Badges';

const STATUS_STEPS = ['New', 'Assigned', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TrackComplaint() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Try by exact ID first
      const res = await API.get(`/complaints/${query.trim()}`);
      setResult(res.data.complaint || res.data);
    } catch {
      // If not found by ID, search by title keyword or short ID
      try {
        const searchQ = query.trim().toLowerCase();
        const res = await API.get('/complaints');
        const match = res.data.find(c =>
          c._id.toLowerCase().includes(searchQ) ||
          c.title.toLowerCase().includes(searchQ)
        );
        if (match) setResult(match);
        else setError('No complaint found with that ID or keyword. Please check and try again.');
      } catch {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Track Complaint</h2>
        <p className="text-gray-500 text-sm mt-1">Enter your Complaint ID or keyword to track its current status.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Complaint ID or Keyword</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. ABC12345 or 'water leakage'"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Track
          </button>
        </div>
        {error && <p className="text-sm text-red-600 font-medium mt-3 flex items-center gap-1.5"><AlertTriangle size={14} />{error}</p>}
      </form>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F766E]/5 to-[#14B8A6]/5 px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 mb-1">ID: {result._id?.slice(-10).toUpperCase()}</p>
                <h3 className="text-lg font-bold text-gray-900">{result.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted {timeAgo(result.createdAt)} · {result.category_id?.name || 'Uncategorized'}
                </p>
              </div>
              <div className="flex gap-2">
                <PriorityBadge priority={result.priority} />
                <StatusBadge status={result.status} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress Timeline */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4">Complaint Timeline</h4>
              <div className="relative">
                <div className="flex items-center justify-between relative">
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i < currentStep || (i === currentStep && result.status === 'Closed');
                    const isCurrent = i === currentStep && result.status !== 'Closed';
                    
                    return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 relative ${
                        isCompleted ? 'bg-[#0F766E] border-[#0F766E] text-white' :
                        isCurrent ? 'bg-white border-[#14B8A6] text-[#14B8A6] shadow-md shadow-teal-100' :
                        'bg-white border-gray-200 text-gray-300'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : isCurrent ? <Clock size={14} className="animate-pulse" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />}
                      </div>
                      <p className={`text-[10px] font-semibold mt-2 text-center ${
                        isCompleted || isCurrent ? 'text-[#0F766E]' : 'text-gray-400'
                      }`}>{step}</p>
                      {/* Connector line */}
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`absolute top-4 h-0.5 transition-all ${
                          i < currentStep ? 'bg-[#0F766E]' : 'bg-gray-200'
                        }`}
                          style={{
                            left: `calc(${(i + 0.5) * (100 / STATUS_STEPS.length)}%)`,
                            width: `${100 / STATUS_STEPS.length}%`,
                          }}
                        />
                      )}
                    </div>
                  )})}
                </div>
              </div>
            </div>

            {/* Assigned Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} className="text-[#0F766E]" />
                  <span className="text-xs font-bold text-gray-600">Assigned Department</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{result.department_id?.name || 'Not yet assigned'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-[#0F766E]" />
                  <span className="text-xs font-bold text-gray-600">Assigned Staff</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{result.assigned_to?.name || 'Pending assignment'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">{result.description}</p>
            </div>

            {result.resolution_notes && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-bold text-green-700 mb-1">✅ Resolution Notes</p>
                <p className="text-sm text-green-800">{result.resolution_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
