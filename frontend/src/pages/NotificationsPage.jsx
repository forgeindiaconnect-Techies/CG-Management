import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, AlertTriangle, CheckCheck, Trash2 } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../components/Badges';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await API.get('/complaints');
        // Extract recent updates to simulate notifications
        let relevant = res.data;
        if (user.role === 'Staff') {
          relevant = relevant.filter(c => c.assigned_to?._id === user._id || c.assigned_to === user._id);
        } else if (user.role === 'User') {
          relevant = relevant.filter(c => c.user_id?._id === user._id || c.user_id === user._id);
        }
        
        const lastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
        
        const sorted = relevant
          .filter(c => c.updatedAt)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .map(c => {
            const time = new Date(c.updatedAt).getTime();
            return {
              id: c._id,
              title: c.title,
              status: c.status,
              priority: c.priority,
              updatedAt: c.updatedAt,
              isNew: (Date.now() - time) < 86400000 && time > lastRead,
              department: c.department_id?.name || 'Unassigned',
              type: c.status === 'New' ? 'alert' : 'update',
              message: c.status === 'New' ? 'New complaint assigned' : `Status changed to ${c.status}`,
            };
          });
          
        setNotifications(sorted);
      } catch (err) { 
        console.error(err); 
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [user]);

  const markAllAsRead = () => {
    localStorage.setItem('lastReadNotifs', Date.now().toString());
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    // Dispatch a custom event so other components can update
    window.dispatchEvent(new Event('notifsMarkedRead'));
  };

  const clearNotifications = () => {
    if(window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-[600px] bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.isNew).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
          <button 
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-1">There are no new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <Link 
                key={n.id} 
                to={`/complaints/${n.id}`}
                onClick={() => {
                  const nTime = new Date(n.updatedAt).getTime();
                  const currentLastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
                  if (nTime > currentLastRead) {
                    localStorage.setItem('lastReadNotifs', nTime.toString());
                    window.dispatchEvent(new Event('notifsMarkedRead'));
                  }
                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isNew: false } : item));
                }}
                className={`block p-5 transition-colors hover:bg-gray-50 group ${n.isNew ? 'bg-teal-50/20' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {n.type === 'alert' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <p className={`text-sm ${n.isNew ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {n.message}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.updatedAt)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">{n.title}</p>
                    
                    <div className="flex items-center gap-2">
                      <StatusBadge status={n.status} />
                      <PriorityBadge priority={n.priority} />
                      <span className="ml-auto text-xs font-semibold text-[#0F766E] group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
