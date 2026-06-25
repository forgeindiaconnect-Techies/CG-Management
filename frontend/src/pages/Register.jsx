import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2, User, Mail, Lock, Briefcase, Building2, ChevronDown } from 'lucide-react';

const ROLES = [
  { value: 'User', label: 'Citizen / User', desc: 'Submit and track your own complaints' },
  { value: 'Staff', label: 'Staff Member', desc: 'Handle assigned complaints in a department' },
  { value: 'Department Head', label: 'Department Head', desc: 'Oversee and approve department resolutions' },
  { value: 'Admin', label: 'System Admin', desc: 'Full access to manage all system data' },
];

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ characters', ok: password.length >= 6 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={`text-[10px] font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'User', department_id: '' });
  const [departments, setDepartments] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 2-step form
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.department_id) delete payload.department_id;
      const { data } = await API.post('/auth/register', payload);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const needsDept = ['Staff', 'Department Head'].includes(form.role);
  const canProceed = form.name.trim() && form.email.trim() && form.password.length >= 6;

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #064E3B 0%, #0F766E 40%, #14B8A6 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-black text-xl">CG</span>
          </div>
          <div>
            <p className="text-white font-bold leading-tight">Grievance Portal</p>
            <p className="text-teal-200 text-xs">v2.0 · AI-Powered</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-white leading-snug">
              Join thousands resolving<br />
              <span className="text-teal-200">issues faster than ever.</span>
            </h2>
            <p className="text-teal-100 mt-3 text-sm leading-relaxed">
              Create your account and get started in under 2 minutes. Your role determines what you can do in the system.
            </p>
          </div>

          {/* Step indicators */}
          <div className="space-y-3">
            {[
              { num: 1, label: 'Enter your personal details' },
              { num: 2, label: 'Choose your role & department' },
              { num: 3, label: 'Start using the portal' },
            ].map(({ num, label }) => (
              <div key={num} className={`flex items-center gap-3 ${step >= num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${step > num ? 'bg-green-400 text-white' : step === num ? 'bg-white text-[#0F766E]' : 'bg-white/20 text-white'}`}>
                  {step > num ? '✓' : num}
                </div>
                <span className="text-sm text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-teal-300 text-xs">© {new Date().getFullYear()} CG Grievance Portal</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-[#F0FDFA] to-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#06B6D4] flex items-center justify-center">
              <span className="text-white font-black">CG</span>
            </div>
            <span className="font-bold text-gray-800">Grievance Portal</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900">Create account</h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Step {step} of 2 — {step === 1 ? 'Personal Information' : 'Role & Access'}
            </p>
            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (canProceed) setStep(2); } : handleSubmit}
              className="space-y-5">

              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        autoFocus
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="reg-password"
                        type={showPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} />
                  </div>

                  <button
                    type="submit"
                    disabled={!canProceed}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 shadow-lg shadow-teal-500/20"
                    style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
                  >
                    Continue →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Role</label>
                    <div className="space-y-2">
                      {ROLES.map(({ value, label, desc }) => (
                        <label key={value}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${form.role === value ? 'border-[#14B8A6] bg-teal-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" name="role" value={value} checked={form.role === value}
                            onChange={() => setForm({ ...form, role: value })} className="sr-only" />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.role === value ? 'border-[#0F766E]' : 'border-gray-300'}`}>
                            {form.role === value && <div className="w-2 h-2 rounded-full bg-[#0F766E]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {needsDept && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          id="reg-dept"
                          value={form.department_id}
                          onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                          required={needsDept}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] appearance-none bg-gray-50 focus:bg-white"
                        >
                          <option value="">Select your department</option>
                          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                      ← Back
                    </button>
                    <button
                      id="reg-submit"
                      type="submit"
                      disabled={loading || (needsDept && !form.department_id)}
                      className="flex-2 flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                      style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
                    >
                      {loading && <Loader2 size={15} className="animate-spin" />}
                      {loading ? 'Creating…' : 'Create Account'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0F766E] font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
