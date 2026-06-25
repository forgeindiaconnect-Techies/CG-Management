import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { History, Search, Download } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await API.get('/complaints');
        const complaints = res.data;
        
        // Construct a pseudo-audit log from complaint updates
        // In a real production system, this would fetch from a dedicated Audit/Comment collection
        const constructedLogs = [];
        complaints.forEach(c => {
          if (c.createdAt !== c.updatedAt) {
            constructedLogs.push({
              id: `${c._id}-update`,
              complaintId: c._id,
              title: c.title,
              action: `Status changed to ${c.status}`,
              user: c.assigned_to?.name || 'System',
              timestamp: c.updatedAt
            });
          }
          if (c.status === 'Closed' && c.resolved_at) {
            constructedLogs.push({
              id: `${c._id}-approve`,
              complaintId: c._id,
              title: c.title,
              action: 'Resolution Approved & Closed',
              user: 'Department Head',
              timestamp: c.resolved_at
            });
          }
        });

        // Sort descending by timestamp
        constructedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(constructedLogs);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-500 text-sm mt-1">Track complaint actions, approvals, and system activity.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-xl transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Complaint</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#0F766E] truncate max-w-[250px]">{log.title}</p>
                    <p className="text-xs text-gray-400">ID: ...{log.complaintId.slice(-6)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
                      <History size={12} className="text-gray-400"/> {log.user}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
