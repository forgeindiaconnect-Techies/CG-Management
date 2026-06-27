import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import DeptHeadDashboard from './pages/depthead/DeptHeadDashboard';
import UserDashboard from './pages/user/UserDashboard';
import ComplaintsList from './pages/complaints/ComplaintsList';
import ComplaintDetail from './pages/complaints/ComplaintDetail';
import NewComplaint from './pages/complaints/NewComplaint';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCategories from './pages/admin/ManageCategories';
import StaffManagementAdmin from './pages/admin/StaffManagement';
import DeptHeadManagementAdmin from './pages/admin/DeptHeadManagement';
import ComplaintAssignmentAdmin from './pages/admin/ComplaintAssignmentAdmin';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminReports from './pages/admin/AdminReports';
import SystemSettings from './pages/admin/SystemSettings';
import RolesPermissions from './pages/admin/RolesPermissions';
import BackupRestore from './pages/admin/BackupRestore';
import NotFound from './pages/NotFound';

import NotificationsPage from './pages/NotificationsPage';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import StatusManagement from './pages/staff/StatusManagement';
import ResolutionManagement from './pages/staff/ResolutionManagement';

import TrackComplaint from './pages/user/TrackComplaint';
import AttachmentsPage from './pages/user/AttachmentsPage';
import FeedbackRatings from './pages/user/FeedbackRatings';
import ComplaintHistory from './pages/user/ComplaintHistory';
import Settings from './pages/user/Settings';
import HelpSupport from './pages/user/HelpSupport';

import AssignedComplaints from './pages/staff/AssignedComplaints';

import PendingApprovals from './pages/depthead/PendingApprovals';
import ApprovedResolutions from './pages/depthead/ApprovedResolutions';
import ComplaintAssignment from './pages/depthead/ComplaintAssignment';
import StaffManagement from './pages/depthead/StaffManagement';
import PerformanceMonitoring from './pages/depthead/PerformanceMonitoring';
import AuditLogs from './pages/depthead/AuditLogs';

// Route guard by role
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function RoleComplaints() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'Staff') return <AssignedComplaints />;
  return <ComplaintsList />;
}

import { SocketProvider } from './context/SocketContext';

function App() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (e) {}
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            {/* Role-based dashboards */}
            <Route path="dashboard" element={<RoleDashboard />} />

            {/* Complaints */}
            <Route path="complaints" element={<RoleComplaints />} />
            <Route path="complaints/new" element={<NewComplaint />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            
            {/* Additional Staff / Shared Pages */}
            <Route path="status-management" element={<RoleRoute roles={['Staff', 'Admin', 'Department Head']}><StatusManagement /></RoleRoute>} />
            <Route path="resolution-management" element={<RoleRoute roles={['Staff', 'Admin', 'Department Head']}><ResolutionManagement /></RoleRoute>} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />

            {/* User only */}
            <Route path="track" element={<TrackComplaint />} />
            <Route path="attachments" element={<AttachmentsPage />} />
            <Route path="feedback" element={<FeedbackRatings />} />
            <Route path="history" element={<ComplaintHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<HelpSupport />} />

            {/* Department Head only */}
            <Route path="dept/complaints" element={<RoleRoute roles={['Department Head']}><ComplaintsList /></RoleRoute>} />
            <Route path="dept/approvals/pending" element={<RoleRoute roles={['Department Head']}><PendingApprovals /></RoleRoute>} />
            <Route path="dept/approvals/approved" element={<RoleRoute roles={['Department Head']}><ApprovedResolutions /></RoleRoute>} />
            <Route path="dept/assignment" element={<RoleRoute roles={['Department Head']}><ComplaintAssignment /></RoleRoute>} />
            <Route path="dept/staff" element={<RoleRoute roles={['Department Head']}><StaffManagement /></RoleRoute>} />
            <Route path="dept/performance" element={<RoleRoute roles={['Department Head']}><PerformanceMonitoring /></RoleRoute>} />
            <Route path="dept/audit" element={<RoleRoute roles={['Department Head']}><AuditLogs /></RoleRoute>} />

            {/* Admin only */}
            <Route path="admin/users" element={<RoleRoute roles={['Admin']}><ManageUsers /></RoleRoute>} />
            <Route path="admin/departments" element={<RoleRoute roles={['Admin']}><ManageDepartments /></RoleRoute>} />
            <Route path="admin/categories" element={<RoleRoute roles={['Admin']}><ManageCategories /></RoleRoute>} />
            <Route path="admin/staff" element={<RoleRoute roles={['Admin']}><StaffManagementAdmin /></RoleRoute>} />
            <Route path="admin/deptheads" element={<RoleRoute roles={['Admin']}><DeptHeadManagementAdmin /></RoleRoute>} />
            <Route path="admin/assignment" element={<RoleRoute roles={['Admin']}><ComplaintAssignmentAdmin /></RoleRoute>} />
            <Route path="admin/analytics" element={<RoleRoute roles={['Admin']}><AnalyticsDashboard /></RoleRoute>} />
            <Route path="admin/reports" element={<RoleRoute roles={['Admin']}><AdminReports /></RoleRoute>} />
            <Route path="admin/settings" element={<RoleRoute roles={['Admin']}><SystemSettings /></RoleRoute>} />
            <Route path="admin/roles" element={<RoleRoute roles={['Admin']}><RolesPermissions /></RoleRoute>} />
            <Route path="admin/backup" element={<RoleRoute roles={['Admin']}><BackupRestore /></RoleRoute>} />
            <Route path="admin/audit" element={<RoleRoute roles={['Admin']}><AuditLogs /></RoleRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

// Renders the correct dashboard based on role
function RoleDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'Admin': return <AdminDashboard />;
    case 'Staff': return <StaffDashboard />;
    case 'Department Head': return <DeptHeadDashboard />;
    default: return <UserDashboard />;
  }
}

export default App;
