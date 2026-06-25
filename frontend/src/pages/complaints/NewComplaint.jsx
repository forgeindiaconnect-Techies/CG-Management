import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, ChevronDown, ArrowLeft, FileText } from 'lucide-react';

const CHAR_LIMIT = 2000;
const MIN_CHARS = 30;

export default function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category_id: '', department_id: '' });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  useEffect(() => {
    Promise.all([API.get('/categories'), API.get('/departments')])
      .then(([cats, depts]) => {
        setCategories(cats.data);
        setDepartments(depts.data);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.description.trim().length < MIN_CHARS) {
      setError(`Please provide at least ${MIN_CHARS} characters in the description.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/complaints', form);
      setComplaintId(res.data._id);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const descProgress = Math.min((form.description.length / MIN_CHARS) * 100, 100);
  const isReady = form.title.trim() && form.description.trim().length >= MIN_CHARS;

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-200">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">Complaint Submitted!</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Your complaint has been received and our AI system is analyzing it to auto-assign it to the right department and staff.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#0F766E] font-bold bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl">
            <Sparkles size={13} /> AI Analysis in progress…
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/complaints')}
              className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              View All Complaints
            </button>
            {complaintId && (
              <button
                onClick={() => navigate(`/complaints/${complaintId}`)}
                className="flex-1 py-2.5 text-white font-bold text-sm rounded-xl shadow-md transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
              >
                Track This Complaint
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Submit a Complaint</h2>
          <p className="text-gray-500 text-sm mt-0.5">Describe your issue — our AI will route it to the right department</p>
        </div>
      </div>

      {/* AI Info Banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center flex-shrink-0 shadow">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0F766E]">AI-Powered Routing</p>
          <p className="text-xs text-teal-700 mt-0.5">
            After submission, our AI will automatically categorize, set priority, suggest a resolution, and assign your complaint to the right department.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              id="complaint-title"
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Road pothole near Main Street causing accidents"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-gray-50 focus:bg-white transition-all"
            />
            <p className="text-xs text-gray-400 mt-1.5">Be specific — a good title helps with faster resolution.</p>
          </div>

          {/* Category & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="complaint-category"
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] appearance-none bg-gray-50 focus:bg-white transition-all"
                >
                  <option value="">Auto-detect by AI</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="complaint-dept"
                  value={form.department_id}
                  onChange={e => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] appearance-none bg-gray-50 focus:bg-white transition-all"
                >
                  <option value="">Auto-assign by AI</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-medium ${form.description.length > CHAR_LIMIT * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
                {form.description.length}/{CHAR_LIMIT}
              </span>
            </div>
            <textarea
              id="complaint-desc"
              required
              rows={7}
              maxLength={CHAR_LIMIT}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide a detailed description of your complaint. Include:&#10;• When did this happen?&#10;• Where did it happen?&#10;• Who is affected?&#10;• What outcome are you expecting?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none bg-gray-50 focus:bg-white transition-all leading-relaxed"
            />
            {/* Description progress */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${descProgress}%`,
                    background: descProgress >= 100 ? '#10B981' : descProgress > 60 ? '#F59E0B' : '#14B8A6'
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {form.description.length < MIN_CHARS
                  ? `${MIN_CHARS - form.description.length} more chars needed`
                  : '✓ Minimum met'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="complaint-submit"
              type="submit"
              disabled={loading || !isReady}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting &amp; Analyzing…
                </>
              ) : (
                <>
                  <FileText size={15} />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
