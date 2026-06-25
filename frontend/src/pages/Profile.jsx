import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  User, Mail, Lock, Shield, Building2, CheckCircle2,
  AlertCircle, Eye, EyeOff, LogOut, Edit3, Save, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = {
  Admin: { bg: 'bg-red-100', text: 'text-red-700', icon: '👑' },
  Staff: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '🧑‍💼' },
  'Department Head': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🏛️' },
  User: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👤' },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/auth/profile');
        setProfile(res.data);
        setName(res.data.name);
        setEmail(res.data.email);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, email };
      if (newPassword) payload.password = newPassword;

      const res = await API.put('/auth/profile', payload);

      // Update the local profile state
      setProfile(prev => ({ ...prev, name: res.data.name, email: res.data.email }));
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Update stored token if a new one was returned
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto space-y-6">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const roleStyle = ROLE_COLORS[profile?.role] || ROLE_COLORS['User'];
  const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and security settings.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Top Banner */}
        <div className="h-24 bg-gradient-to-r from-[#0F766E] to-[#14B8A6]" />

        {/* Avatar & Name */}
        <div className="px-6 pb-6 -mt-12 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="pb-1">
              <h3 className="text-xl font-bold text-gray-900">{profile?.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                  {roleStyle.icon} {profile?.role}
                </span>
                {profile?.department_id?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Building2 size={11} /> {profile.department_id.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Edit Form / Info View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <User size={16} className="text-[#0F766E]" /> Account Information
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">Full Name</label>
            {editMode ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-shadow"
                placeholder="Enter your name"
              />
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <User size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800 font-medium">{profile?.name}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">Email Address</label>
            {editMode ? (
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-shadow"
                placeholder="Enter your email"
              />
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800 font-medium">{profile?.email}</span>
              </div>
            )}
          </div>

          {/* Role (read-only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">Role</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <Shield size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-800 font-medium">{profile?.role}</span>
              <span className="ml-auto text-[10px] text-gray-400 italic">Cannot be changed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password (only in edit mode) */}
      {editMode && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Lock size={16} className="text-[#0F766E]" /> Change Password
            <span className="ml-1 text-xs text-gray-400 font-normal">(leave blank to keep current)</span>
          </h3>

          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-shadow"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-shadow"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle size={11} /> Passwords do not match
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {editMode ? (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <X size={15} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name || !email}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-semibold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <LogOut size={16} className="text-red-500" /> Danger Zone
          </h3>
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-red-800">Sign out of your account</p>
              <p className="text-xs text-red-600 mt-0.5">You will be redirected to the login page.</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
