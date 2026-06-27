import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  LayoutDashboard, FileText, Plus, Users, Building2,
  Tag, LogOut, Menu, X, Bell, ChevronDown, ChevronRight,
  AlertTriangle, Clock, CheckCircle2, Settings, User,
  ClipboardList, BarChart2, Search, Paperclip, Star,
  History, Download, HelpCircle, ChevronRight as ChevronR,
  RefreshCw, TrendingUp, Shield, Database, Moon, Sun
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const navItems = {
  User: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints/new', icon: Plus,             label: 'Create Complaint' },
    { to: '/complaints',     icon: ClipboardList,    label: 'My Complaints' },
    { to: '/track',          icon: Search,           label: 'Track Complaint' },
    { to: '/attachments',    icon: Paperclip,        label: 'Attachments' },
    { to: '/notifications',  icon: Bell,             label: 'Notifications' },
    { to: '/feedback',       icon: Star,             label: 'Feedback & Ratings' },
    { to: '/history',        icon: History,          label: 'Complaint History' },
    { to: '/reports',        icon: Download,         label: 'Download Reports' },
    { to: '/profile',        icon: User,             label: 'My Profile' },
    { to: '/settings',       icon: Settings,         label: 'Settings' },
    { to: '/help',           icon: HelpCircle,       label: 'Help & Support' },
  ],
  Staff: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: ClipboardList, label: 'Assigned Complaints' },
    { to: '/status-management', icon: Clock, label: 'Status Management' },
    { to: '/resolution-management', icon: CheckCircle2, label: 'Resolution Management' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/reports', icon: BarChart2, label: 'Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  'Department Head': [
    { to: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dept/complaints',       icon: FileText,        label: 'All Complaints' },
    { to: '/dept/approvals/pending',icon: Clock,           label: 'Pending Approvals' },
    { to: '/dept/approvals/approved',icon: CheckCircle2,   label: 'Approved Resolutions' },
    { to: '/dept/assignment',       icon: Users,           label: 'Complaint Assignment' },
    { to: '/dept/staff',            icon: Building2,       label: 'Staff Management' },
    { to: '/dept/performance',      icon: BarChart2,       label: 'Performance Monitoring' },
    { to: '/reports',               icon: Download,        label: 'Analytics & Reports' },
    { to: '/notifications',         icon: Bell,            label: 'Notifications' },
    { to: '/dept/audit',            icon: History,         label: 'Audit Logs' },
    { to: '/feedback',              icon: Star,            label: 'Feedback & Ratings' },
    { to: '/profile',               icon: User,            label: 'Profile' },
    { to: '/settings',              icon: Settings,        label: 'Settings' },
  ],
  Admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: FileText, label: 'Complaint Management' },
    { to: '/admin/departments', icon: Building2, label: 'Department Management' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/staff', icon: Users, label: 'Staff Management' },
    { to: '/admin/deptheads', icon: Users, label: 'Department Head Management' },
    { to: '/admin/assignment', icon: RefreshCw, label: 'Complaint Assignment' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics Dashboard' },
    { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/support', icon: HelpCircle, label: 'Support Messages' },
    { to: '/feedback', icon: Star, label: 'Feedback Management' },
    { to: '/admin/audit', icon: History, label: 'Audit Logs' },
    { to: '/admin/settings', icon: Settings, label: 'System Settings' },
    { to: '/admin/roles', icon: Shield, label: 'Role & Permissions' },
    { to: '/admin/backup', icon: Database, label: 'Backup & Restore' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

const ROLE_COLORS = {
  Admin: 'bg-red-500',
  Staff: 'bg-blue-500',
  'Department Head': 'bg-purple-500',
  User: 'bg-green-500',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ status }) {
  if (status === 'Resolved' || status === 'Closed' || status === 'Replied' || status === 'Read') return <CheckCircle2 size={14} className="text-green-500" />;
  if (status === 'In Progress' || status === 'New') return <Clock size={14} className="text-amber-500" />;
  return <AlertTriangle size={14} className="text-blue-500" />;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Also try to update userSettings in localStorage if it exists
    try {
      const stored = localStorage.getItem('userSettings');
      let settings = stored ? JSON.parse(stored) : {};
      settings.theme = newDark ? 'dark' : 'light';
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch(e) {}
  };
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const items = navItems[user?.role] || navItems['User'];

  // Fetch notifications (recent complaint updates & support messages for admins)
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await API.get('/complaints');
        let allItems = res.data.map(c => ({
          id: c._id,
          title: c.title,
          status: c.status,
          priority: c.priority,
          updatedAt: c.updatedAt || c.createdAt,
          type: 'complaint'
        }));

        if (user?.role === 'Admin') {
          try {
            const supportRes = await API.get('/support');
            const supportItems = supportRes.data.map(s => ({
              id: s._id,
              title: `Support: ${s.name}`,
              status: s.status,
              priority: 'High',
              updatedAt: s.createdAt,
              type: 'support'
            }));
            allItems = [...allItems, ...supportItems];
          } catch (e) {}
        }

        const lastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
        const sorted = allItems
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 15)
          .map(item => {
            const time = new Date(item.updatedAt).getTime();
            return {
              ...item,
              isNew: (Date.now() - time) < 86400000 && time > lastRead,
            };
          });
        setNotifications(sorted);
        setUnreadCount(sorted.filter(n => n.isNew).length);
      } catch { /* silent */ }
    };
    
    const handleNotifsMarkedRead = () => {
      const lastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
      setNotifications(prev => {
        const updated = prev.map(n => {
          const time = new Date(n.updatedAt).getTime();
          return {
            ...n,
            isNew: (Date.now() - time) < 86400000 && time > lastRead,
          };
        });
        setUnreadCount(updated.filter(n => n.isNew).length);
        return updated;
      });
    };

    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    window.addEventListener('notifsMarkedRead', handleNotifsMarkedRead);
    return () => {
      clearInterval(iv);
      window.removeEventListener('notifsMarkedRead', handleNotifsMarkedRead);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F0FDFA] font-manrope overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col flex-shrink-0 overflow-hidden`}
        style={{ background: 'linear-gradient(180deg, #0c3a35 0%, #134e4a 60%, #0f766e 100%)' }}>

        {/* Logo row */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 min-h-[64px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">CG</span>
              </div>
              <div className="leading-tight">
                <p className="text-white font-bold text-sm">Grievance</p>
                <p className="text-teal-300 text-[10px] font-medium">Management Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white ml-auto"
          >
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto hide-scrollbar">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              end={true}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/55 hover:bg-white/8 hover:text-white/90'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center text-white text-xs font-black shadow">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#134e4a] ${ROLE_COLORS[user?.role] || 'bg-gray-500'}`} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-teal-300 truncate">{user?.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-white/40 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Bar ── */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <h1 className="text-sm font-bold text-gray-500 hidden sm:block">
            Complaint &amp; Grievance Management System
          </h1>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} className="text-gray-600" /> : <Moon size={18} className="text-gray-600" />}
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                id="notif-bell"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Bell size={18} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      <p className="text-[11px] text-gray-400">{unreadCount} new in last hour</p>
                    </div>
                    <button onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.filter(n => n.isNew).length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">No new notifications</p>
                    ) : notifications.filter(n => n.isNew).map(n => (
                      <Link
                        key={n.id}
                        to={n.type === 'support' ? '/admin/support' : `/complaints/${n.id}`}
                        onClick={(e) => { 
                          e.preventDefault();
                          const nTime = new Date(n.updatedAt).getTime();
                          const currentLastRead = parseInt(localStorage.getItem('lastReadNotifs') || '0', 10);
                          if (nTime > currentLastRead) {
                            localStorage.setItem('lastReadNotifs', nTime.toString());
                            window.dispatchEvent(new Event('notifsMarkedRead'));
                          }
                          // Optimistically clear badges instantly
                          setNotifications(prev => prev.map(notif => ({ ...notif, isNew: false })));
                          setUnreadCount(0);
                          navigate(n.type === 'support' ? '/admin/support' : `/complaints/${n.id}`);
                          setNotifOpen(false); 
                        }}
                        className={`block w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${n.isNew ? 'bg-teal-50/30' : ''}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <NotifIcon status={n.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            <span className={`font-bold ${
                              n.status === 'Resolved' ? 'text-green-600' :
                              n.status === 'In Progress' ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>{n.status}</span>
                            {' · '}{timeAgo(n.updatedAt)}
                          </p>
                        </div>
                        {n.isNew && <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />}
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <Link
                      to="/complaints"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/complaints');
                        setNotifOpen(false);
                      }}
                      className="block w-full text-xs font-bold text-[#0F766E] hover:underline text-center"
                    >
                      View all complaints →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                id="profile-btn"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-xs font-black shadow">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{user?.role}</p>
                </div>
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${ROLE_COLORS[user?.role] || 'bg-gray-500'}`}>
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard size={15} className="text-gray-400" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => { navigate('/complaints'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileText size={15} className="text-gray-400" />
                      My Complaints
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F0FDFA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
