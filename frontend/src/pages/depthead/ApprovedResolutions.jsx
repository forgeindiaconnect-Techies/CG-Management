import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { CheckCircle2, Search, FileText } from 'lucide-react';

export default function ApprovedResolutions() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await API.get('/complaints');
        // Filter for closed complaints
        setComplaints(res.data.filter(c => c.status === 'Closed'));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchApproved();
  }, []);

  const filtered = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.assigned_to?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approved Resolutions</h2>
          <p className="text-gray-500 text-sm mt-1">View history of complaints approved by your department.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search history..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Closure History</h3>
          <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-bold rounded-full">
            Total: {filtered.length}
          </span>
        </div>
        
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No approved resolutions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <div key={c._id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                  <div>
                    <Link to={`/complaints/${c._id}`} className="font-bold text-gray-900 hover:text-[#0F766E]">
                      {c.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span><strong className="text-gray-700">Staff:</strong> {c.assigned_to?.name || 'N/A'}</span>
                      <span>•</span>
                      <span><strong className="text-gray-700">Closed:</strong> {new Date(c.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Link to={`/complaints/${c._id}`} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-teal-50 rounded-lg transition-colors">
                  <FileText size={18} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
