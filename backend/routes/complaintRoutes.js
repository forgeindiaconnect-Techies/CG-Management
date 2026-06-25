const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  escalateComplaint,
  addComment,
  getDashboardStats,
  reAnalyzeComplaint,
  submitFeedback,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/', protect, getComplaints);
router.post('/', protect, authorize('User'), createComplaint);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, authorize('Staff', 'Department Head', 'Admin'), updateComplaintStatus);
router.put('/:id/assign', protect, authorize('Admin', 'Department Head'), assignComplaint);
router.put('/:id/escalate', protect, authorize('Staff', 'Department Head'), escalateComplaint);
router.post('/:id/comments', protect, addComment);
router.post('/:id/ai-analyze', protect, authorize('Staff', 'Department Head', 'Admin'), reAnalyzeComplaint);
router.put('/:id/feedback', protect, authorize('User'), submitFeedback);

module.exports = router;
