import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Paperclip, Download, FileText, Image, File } from 'lucide-react';

function getFileIcon(filename) {
  if (!filename) return File;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return Image;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
  return File;
}

export default function AttachmentsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/complaints');
        // Filter only complaints that have attachments
        setComplaints(res.data.filter(c => c.attachments?.length > 0));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      {[1,2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  const totalAttachments = complaints.reduce((sum, c) => sum + (c.attachments?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attachments</h2>
        <p className="text-gray-500 text-sm mt-1">
          {totalAttachments} file{totalAttachments !== 1 ? 's' : ''} across {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <Paperclip size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Attachments Found</h3>
          <p className="text-gray-500 text-sm mt-1">You haven't uploaded any files to your complaints yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <div key={complaint._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{complaint.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {complaint.attachments.length} attachment{complaint.attachments.length !== 1 ? 's' : ''} ·
                    {complaint.status}
                  </p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complaint.attachments.map((att, i) => {
                  const FileIcon = getFileIcon(att.filename || att);
                  const filename = att.filename || att.name || `Attachment ${i + 1}`;
                  const url = att.url || att;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-teal-200 hover:bg-teal-50/20 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <FileIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{filename}</p>
                        <p className="text-xs text-gray-400">Uploaded with complaint</p>
                      </div>
                      <a href={url} download target="_blank" rel="noreferrer"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E] transition-colors opacity-0 group-hover:opacity-100">
                        <Download size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
