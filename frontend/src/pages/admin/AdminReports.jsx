import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Download, FileSpreadsheet, Activity, CheckCircle2, Clock, Star, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line
} from 'recharts';

export default function AdminReports() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/complaints');
        setComplaints(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const response = await API.get('/exports/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF report.');
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
      link.setAttribute('download', `system_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to generate Excel report.');
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-[400px] bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed');
  
  // Calculate average resolution time
  let totalHours = 0;
  let timeTrackedCount = 0;
  resolvedComplaints.forEach(c => {
    if (c.resolved_at && c.createdAt) {
      totalHours += (new Date(c.resolved_at) - new Date(c.createdAt)) / 3600000;
      timeTrackedCount++;
    }
  });
  const avgResolutionTime = timeTrackedCount > 0 ? (totalHours / timeTrackedCount).toFixed(1) + ' hrs' : 'N/A';

  // Calculate average rating
  let totalRating = 0;
  let ratedCount = 0;
  resolvedComplaints.forEach(c => {
    if (c.feedback_rating) {
      totalRating += c.feedback_rating;
      ratedCount++;
    }
  });
  const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 'No Ratings';

  // Build chart data
  const categoryData = [];
  const catMap = {};
  complaints.forEach(c => {
    const cat = c.category_id?.name || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  Object.keys(catMap).forEach(key => {
    categoryData.push({ name: key, value: catMap[key] });
  });

  // Trend data (last 7 days resolved)
  const trendData = [];
  for(let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const count = resolvedComplaints.filter(c => c.resolved_at && new Date(c.resolved_at).toDateString() === d.toDateString()).length;
    trendData.push({ name: dateStr, resolved: count });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Reports</h2>
          <p className="text-gray-500 text-sm mt-0.5">Generate and download system reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 text-sm font-semibold rounded-xl bg-teal-50/30 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            <Download size={16} /> {exportingPDF ? 'Generating PDF...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#14B8A6] transition-colors shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> {exportingExcel ? 'Generating Excel...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Handled</p>
            <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-gray-900">{resolvedComplaints.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Avg Resolution</p>
            <p className="text-2xl font-bold text-gray-900">{avgResolutionTime}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">System Rating</p>
            <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Trend Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[#0F766E]" /> Resolution Trend (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip cursor={{ stroke: '#14B8A6', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="resolved" stroke="#0F766E" strokeWidth={3} dot={{ r: 4, fill: '#0F766E', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-[#0F766E]" /> Work by Category
          </h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#4b5563' }} width={100} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" fill="#14B8A6" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#14B8A6', '#0F766E', '#06B6D4', '#3B82F6'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No categorical data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
