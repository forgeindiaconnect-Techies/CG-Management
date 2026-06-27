const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  updateMessageStatus,
} = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public or User route (we can use protect but let's allow it to be optional by just using protect for now, since it's in the user dashboard)
router.post('/', protect, createMessage);

// Admin routes
router.get('/', protect, authorize('Admin'), getMessages);
router.put('/:id/status', protect, authorize('Admin'), updateMessageStatus);

module.exports = router;
