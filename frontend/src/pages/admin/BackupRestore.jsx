import { useState, useRef, useEffect } from 'react';
import API from '../../api/axios';
import { Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('backupHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {}
  }, []);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await API.get('/backup/download', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const filename = `cg-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      const newEntry = { filename, date: new Date().toISOString() };
      const newHistory = [newEntry, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('backupHistory', JSON.stringify(newHistory));

      setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to create backup.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSystem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("WARNING: This will overwrite the entire database with the uploaded backup. Are you sure you want to proceed?")) {
      e.target.value = '';
      return;
    }

    try {
      setRestoring(true);
      setMessage(null);
      
      const text = await file.text();
      const backupData = JSON.parse(text);

      await API.post('/backup/restore', backupData);
      
      setMessage({ type: 'success', text: 'System restored successfully!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to restore system from the provided file.' });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Backup & Restore</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage database backups</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Database Backup</h3>
          <p className="text-sm text-gray-500 mb-4">Create a new manual backup of the system database.</p>
          <button 
            onClick={handleCreateBackup}
            disabled={loading || restoring}
            className="px-4 py-2 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#14B8A6] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">System Restore</h3>
          <p className="text-sm text-gray-500 mb-4">Restore the database from a backup file.</p>
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            className="hidden" 
            onChange={handleRestoreSystem}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || restoring}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {restoring ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            {restoring ? 'Restoring...' : 'Restore System'}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Recent Local Backups</h3>
        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <p>List of previous backups downloaded in this browser will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h, i) => (
              <div key={i} className="py-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Download size={16} /></div>
                  <div>
                    <p className="font-semibold text-gray-800">{h.filename}</p>
                    <p className="text-xs text-gray-400">{new Date(h.date).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
