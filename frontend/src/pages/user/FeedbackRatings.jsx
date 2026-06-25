import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Star, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/Badges';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StarRating({ value, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => !readOnly && onChange?.(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          disabled={readOnly}
          className={`transition-transform ${!readOnly ? 'hover:scale-110' : ''}`}>
          <Star size={readOnly ? 16 : 24}
            className={s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackRatings() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [success, setSuccess] = useState({});

  const fetchData = async () => {
    try {
      const res = await API.get('/complaints');
      const closed = res.data.filter(c => ['Resolved', 'Closed'].includes(c.status));
      setComplaints(closed);
      // Pre-fill existing ratings
      const existingRatings = {};
      closed.forEach(c => { if (c.feedback_rating) existingRatings[c._id] = c.feedback_rating; });
      setRatings(existingRatings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (complaintId) => {
    if (!ratings[complaintId]) return;
    setSubmitting(prev => ({ ...prev, [complaintId]: true }));
    try {
      await API.put(`/complaints/${complaintId}/feedback`, {
        rating: ratings[complaintId],
        comments: comments[complaintId] || '',
      });
      setSuccess(prev => ({ ...prev, [complaintId]: true }));
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  const pendingFeedback = complaints.filter(c => !c.feedback_rating);
  const rated = complaints.filter(c => c.feedback_rating);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feedback & Ratings</h2>
        <p className="text-gray-500 text-sm mt-1">Rate your resolved complaints to help us improve our service.</p>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Star size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No resolved complaints yet</p>
          <p className="text-gray-500 text-sm mt-1">Once your complaints are resolved, you can rate them here.</p>
        </div>
      ) : (
        <>
          {/* Pending ratings */}
          {pendingFeedback.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <Star size={16} className="text-amber-400" />
                Awaiting Your Feedback ({pendingFeedback.length})
              </h3>
              {pendingFeedback.map(c => (
                <div key={c._id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Resolved {timeAgo(c.resolved_at || c.updatedAt)} · {c.department_id?.name}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  
                  {c.resolution_notes && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                      <p className="text-sm text-green-800">{c.resolution_notes}</p>
                    </div>
                  )}

                  {success[c._id] ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm font-semibold p-3 bg-green-50 rounded-xl">
                      <CheckCircle2 size={18} /> Thank you for your feedback!
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">How would you rate this resolution?</p>
                        <StarRating value={ratings[c._id] || 0} onChange={val => setRatings(prev => ({ ...prev, [c._id]: val }))} />
                      </div>
                      <textarea rows={2} value={comments[c._id] || ''}
                        onChange={e => setComments(prev => ({ ...prev, [c._id]: e.target.value }))}
                        placeholder="Add a comment (optional)..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
                      <button onClick={() => handleSubmit(c._id)}
                        disabled={!ratings[c._id] || submitting[c._id]}
                        className="w-full py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Send size={14} /> {submitting[c._id] ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Already rated */}
          {rated.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" /> Rated Complaints ({rated.length})
              </h3>
              {rated.map(c => (
                <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.department_id?.name} · {timeAgo(c.updatedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StarRating value={c.feedback_rating} readOnly />
                    <span className="text-xs text-gray-400">{c.feedback_rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
