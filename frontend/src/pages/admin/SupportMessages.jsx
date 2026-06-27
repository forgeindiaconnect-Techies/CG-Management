import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Mail, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

export default function SupportMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await API.get('/support');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/support/${id}/status`, { status });
      setMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Support Messages</h2>
        <p className="text-gray-500 text-sm mt-0.5">Manage user inquiries and help requests.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No support messages found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg._id} className={`p-5 rounded-xl border ${msg.status === 'New' ? 'border-[#0F766E] bg-teal-50/20' : 'border-gray-100 bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {msg.name} <span className="text-sm font-normal text-gray-500">&lt;{msg.email}&gt;</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between min-w-[120px]">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      msg.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      msg.status === 'Replied' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {msg.status}
                    </span>
                    
                    <div className="flex gap-2 mt-4">
                      {msg.status === 'New' && (
                        <button onClick={() => updateStatus(msg._id, 'Read')} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Mark as Read">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {msg.status !== 'Replied' && (
                        <button onClick={() => updateStatus(msg._id, 'Replied')} className="px-3 py-1.5 bg-[#0F766E] text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors">
                          Mark Replied
                        </button>
                      )}
                    </div>
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
