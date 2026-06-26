import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { ArrowLeft, Send, AlertTriangle, RefreshCw, CheckCheck, Loader2, Sparkles, Copy, Star, Download, User as UserIcon, Mail, Phone, FileText } from 'lucide-react';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [rerunningAI, setRerunningAI] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && ['Admin', 'Department Head'].includes(user.role)) {
      API.get('/users/staff')
        .then(res => {
          const deptIdStr = (user.department_id?._id || user.department_id || '').toString();
          if (user.role === 'Department Head' && deptIdStr) {
            setStaffMembers(res.data.filter(s => {
              const staffDeptIdStr = (s.department_id?._id || s.department_id || '').toString();
              return staffDeptIdStr === deptIdStr;
            }));
          } else {
            setStaffMembers(res.data);
          }
        })
        .catch(err => console.error('Error fetching staff:', err));
    }
  }, [user]);

  const handleReRunAI = async () => {
    try {
      setRerunningAI(true);
      const res = await API.post(`/complaints/${id}/ai-analyze`);
      setData(prev => ({ ...prev, complaint: res.data }));
    } catch (err) {
      console.error('Failed to re-run AI analysis:', err);
    } finally {
      setRerunningAI(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await API.get(`/complaints/${id}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setActionLoading(true);
    try {
      await API.post(`/complaints/${id}/comments`, { content: comment });
      setComment('');
      fetchData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleStatusChange = async (status) => {
    setActionLoading(true);
    try {
      await API.put(`/complaints/${id}/status`, { status, resolution_notes: resolution });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleEscalate = async () => {
    setActionLoading(true);
    try {
      await API.put(`/complaints/${id}/escalate`);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) return;
    setActionLoading(true);
    try {
      await API.put(`/complaints/${id}/assign`, { assigned_to: selectedStaff });
      setSelectedStaff('');
      fetchData();
    } catch (err) {
      console.error('Failed to assign staff:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (feedbackRating < 1 || feedbackRating > 5) return;
    setSubmittingFeedback(true);
    try {
      await API.put(`/complaints/${id}/feedback`, { rating: feedbackRating, comments: feedbackComments });
      setFeedbackRating(0);
      setFeedbackComments('');
      fetchData();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  if (!data) return <p className="text-gray-500 text-center mt-12">Complaint not found.</p>;

  const { complaint, comments } = data;
  const canAct = ['Staff', 'Department Head', 'Admin'].includes(user?.role);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">{complaint.title}</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded border border-gray-200">
              ID: {complaint._id ? String(complaint._id).slice(-8).toUpperCase() : 'UNKNOWN'}
            </span>
          </div>
          <p className="text-xs text-gray-400">Submitted by {complaint.user_id?.name} on {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown Date'}</p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description & Attachments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
            </div>
            
            {/* Fake Attachments Section for demonstration */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Attachments</h3>
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">screenshot_error.png</p>
                  <p className="text-xs text-gray-400">1.2 MB</p>
                </div>
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-[#0F766E] hover:border-[#0F766E] text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            {complaint.resolution_notes && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-1">Resolution Notes</p>
                <p className="text-sm text-green-800">{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* AI Insights (Staff / Admin / Dept Head only) */}
          {canAct && (complaint.suggested_resolution || complaint.suggested_reply) && (
            <div className="bg-gradient-to-r from-teal-50 to-[#E0F2FE] rounded-2xl p-6 shadow-sm border border-teal-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold text-[#0F766E] flex items-center gap-2">
                  <Sparkles size={18} className="text-[#14B8A6]" /> AI Copilot Insights
                </h3>
                <button
                  onClick={handleReRunAI}
                  disabled={rerunningAI}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:text-[#14B8A6] disabled:opacity-50 transition-colors bg-white px-2 py-1 rounded-lg border border-teal-100 shadow-sm"
                >
                  <RefreshCw size={10} className={rerunningAI ? 'animate-spin' : ''} />
                  {rerunningAI ? 'Analyzing...' : 'Re-run AI'}
                </button>
              </div>
              
              {complaint.suggested_resolution && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-700">Suggested Resolution Steps</h4>
                  <p className="text-xs text-gray-600 bg-white/80 p-3 rounded-lg border border-teal-50/50 leading-relaxed">{complaint.suggested_resolution}</p>
                </div>
              )}

              {complaint.suggested_reply && user?.role !== 'Staff' && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-700">Suggested Email Response Draft</h4>
                  <div className="relative">
                    <pre className="text-xs text-gray-600 bg-white/80 p-3 rounded-lg border border-teal-50/50 leading-relaxed font-sans whitespace-pre-wrap">{complaint.suggested_reply}</pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(complaint.suggested_reply);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-[#0F766E] text-white rounded-lg hover:bg-[#14B8A6] transition-colors text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                    >
                      {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workflow actions (Visible to staff/depthead/admin) */}
          {canAct && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-800">Workflow Actions</h3>
              
              {/* Assignment (Dept Head / Admin only) */}
              {['New', 'Assigned'].includes(complaint.status) && ['Admin', 'Department Head'].includes(user?.role) && (
                <div className="space-y-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                  <h4 className="text-xs font-semibold text-[#0F766E]">Assign to Staff</h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedStaff}
                      onChange={e => setSelectedStaff(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffMembers.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.department_id?.name || 'No Dept'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignStaff}
                      disabled={actionLoading || !selectedStaff}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F766E] text-white hover:bg-[#14B8A6] transition-colors disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Start Work (Assigned -> In Progress) */}
              {complaint.status === 'Assigned' && (
                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100/50">
                  <div>
                    <h4 className="text-xs font-semibold text-purple-700">Ready to Start</h4>
                    <p className="text-xs text-gray-500 mt-1">Mark the ticket as "In Progress" to begin investigation.</p>
                  </div>
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Start Work
                  </button>
                </div>
              )}

              {/* Submit for Review (In Progress -> Pending Review) */}
              {complaint.status === 'In Progress' && (
                <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-700">Add Resolution</h4>
                    <p className="text-xs text-gray-500 mt-1">Describe the action taken to resolve this grievance. This field is required.</p>
                  </div>
                  <textarea
                    rows={3}
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    placeholder="Enter resolution notes here..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  />
                  <div className="flex justify-between items-center">
                    {complaint.escalation_level < 3 && (
                      <button
                        onClick={handleEscalate}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <AlertTriangle size={12} /> Escalate
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange('Pending Review')}
                      disabled={actionLoading || !resolution.trim()}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      Submit for Review
                    </button>
                  </div>
                </div>
              )}

              {/* Approve & Reject Review (Pending Review -> Resolved / In Progress) */}
              {complaint.status === 'Pending Review' && ['Admin', 'Department Head'].includes(user?.role) && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-700">Department Head Review</h4>
                    <p className="text-xs text-gray-500 mt-1">Review the resolution notes. You can approve to resolve this ticket, or reject it to send it back for rework.</p>
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <AlertTriangle size={14} /> Reject (Needs Rework)
                    </button>
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCheck size={14} /> Approve & Resolve
                    </button>
                  </div>
                </div>
              )}

              {/* Close Complaint (Resolved -> Closed) */}
              {complaint.status === 'Resolved' && ['Admin', 'Department Head'].includes(user?.role) && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700">Administrative Actions</h4>
                    <p className="text-xs text-gray-500 mt-1">This ticket is currently Resolved. If you have confirmed everything is finalized, you can officially close it.</p>
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <button
                      onClick={() => handleStatusChange('Closed')}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCheck size={14} /> Close Complaint
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback section (Visible when status is Closed) */}
          {complaint.status === 'Closed' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Star className="text-amber-500 fill-amber-500" size={20} />
                <h3 className="font-semibold text-gray-800">User Satisfaction Feedback</h3>
              </div>

              {complaint.feedback_rating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={20}
                        className={star <= complaint.feedback_rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}
                      />
                    ))}
                    <span className="text-sm font-semibold text-gray-700 ml-2">({complaint.feedback_rating}/5)</span>
                  </div>
                  {complaint.feedback_comments && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                      "{complaint.feedback_comments}"
                    </div>
                  )}
                </div>
              ) : (
                user?._id === complaint.user_id?._id ? (
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">How would you rate the resolution of your complaint?</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              size={28}
                              className={
                                star <= (hoverRating || feedbackRating)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Comments / Suggestions</label>
                      <textarea
                        rows={3}
                        value={feedbackComments}
                        onChange={e => setFeedbackComments(e.target.value)}
                        placeholder="Let us know how we did..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingFeedback || feedbackRating === 0}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-400 italic">No feedback provided yet by the user.</p>
                )
              )}
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Activity & Comments</h3>
            <div className="space-y-4 max-h-72 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No comments yet</p>
              ) : comments.map(c => (
                <div key={c._id} className={`flex gap-3 ${c.action && c.action !== 'Comment Added' ? 'opacity-70' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.user_id?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.user_id?.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      {c.action && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{c.action}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              />
              <button type="submit" disabled={actionLoading || !comment.trim()} className="px-4 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#0d6560] disabled:opacity-50 transition-colors">
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          {/* User Info Panel */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <UserIcon size={16} className="text-[#0F766E]" /> User Information
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center text-white font-bold">
                {complaint.user_id?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{complaint.user_id?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500 truncate">{complaint.user_id?.email || 'No email provided'}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <a href={`mailto:${complaint.user_id?.email || ''}`} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <Mail size={14} /> Email
              </a>
              <a href={complaint.user_id?.phone ? `tel:${complaint.user_id?.phone}` : '#'} onClick={(e) => { if(!complaint.user_id?.phone) { e.preventDefault(); alert('No phone number available for this user.'); } }} className="flex-1 px-3 py-2 bg-[#0F766E] text-white hover:bg-[#0d6560] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <Phone size={14} /> Contact
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Complaint Details</h3>
            <MetaRow label="Status" value={<StatusBadge status={complaint.status} />} />
            <MetaRow label="Priority" value={<PriorityBadge priority={complaint.priority} />} />
            <MetaRow label="Department" value={complaint.department_id?.name || 'Unassigned'} />
            <MetaRow label="Category" value={complaint.category_id?.name || 'Uncategorized'} />
            <MetaRow label="Assigned To" value={complaint.assigned_to?.name || 'Unassigned'} />
            <MetaRow label="Sentiment" value={complaint.sentiment} />
            {complaint.escalation_level > 0 && (
              <MetaRow label="Escalation" value={`Level ${complaint.escalation_level}`} className="text-red-600 font-semibold" />
            )}
            {complaint.sla_breach && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                <AlertTriangle size={12} /> SLA Breached
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, className }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium text-gray-800 ${className}`}>{value}</span>
    </div>
  );
}
