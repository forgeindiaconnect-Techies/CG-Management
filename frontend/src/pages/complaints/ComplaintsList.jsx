import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { Search, Filter, Plus, FileText, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';

const STATUSES = ['All', 'New', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function ComplaintsList() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const PER_PAGE = 10;

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const response = await API.get('/exports/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const response = await API.get('/exports/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to export Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleQuickClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this complaint?')) return;
    try {
      await API.put(`/complaints/${id}/status`, { status: 'Closed' });
      // Refresh complaints
      const r = await API.get('/complaints');
      setComplaints(r.data);
      let data = r.data;
      if (statusFilter !== 'All') data = data.filter(c => c.status === statusFilter);
      if (search) data = data.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.user_id?.name?.toLowerCase().includes(search.toLowerCase()));
      setFiltered(data);
    } catch (err) {
      console.error('Failed to close complaint:', err);
      alert('Failed to close complaint');
    }
  };

  useEffect(() => {
    API.get('/complaints').then(r => {
      setComplaints(r.data);
      setFiltered(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = complaints;
    if (statusFilter !== 'All') data = data.filter(c => c.status === statusFilter);
    if (search) data = data.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.user_id?.name?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(data);
    setPage(1);
  }, [search, statusFilter, complaints]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaints</h2>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} total complaints</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-teal-200 text-teal-700 text-xs font-semibold rounded-xl bg-teal-50/30 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> {exportingPDF ? 'PDF...' : 'PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-teal-200 text-teal-700 text-xs font-semibold rounded-xl bg-teal-50/30 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={14} /> {exportingExcel ? 'Excel...' : 'Excel'}
          </button>
          {user?.role === 'User' && (
            <Link to="/complaints/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-xs font-semibold rounded-xl shadow hover:opacity-90 transition-opacity">
              <Plus size={14} /> New Complaint
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-[#0F766E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No complaints found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">TITLE</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">USER</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">STATUS</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">PRIORITY</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">DATE</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0F766E] transition-colors max-w-xs truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.department_id?.name || 'Unassigned'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{c.user_id?.name || '—'}</td>
                      <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-4"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link to={`/complaints/${c._id}`} className="text-xs font-semibold text-[#0F766E] hover:underline">View →</Link>
                          {c.status === 'Resolved' && ['Admin', 'Department Head'].includes(user?.role) && (
                            <button
                              onClick={() => handleQuickClose(c._id)}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
