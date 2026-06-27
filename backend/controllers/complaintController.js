const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Department = require('../models/Department');
const { analyzeComplaint } = require('../utils/aiService');
const {
  sendComplaintCreatedEmail,
  sendComplaintStatusUpdateEmail,
  sendComplaintAssignedEmail,
  sendComplaintEscalatedEmail
} = require('../utils/emailService');

// @desc    Create a complaint
// @route   POST /api/complaints
// @access  Private (User)
const createComplaint = async (req, res) => {
  const { title, description, category_id, department_id } = req.body;

  try {
    // Run AI analysis (categorization, priority, sentiment, resolution & reply suggestion)
    const aiAnalysis = await analyzeComplaint(title, description);

    const complaint = await Complaint.create({
      user_id: req.user._id,
      title,
      description,
      category_id: category_id || (aiAnalysis ? aiAnalysis.category_id : null),
      department_id: department_id || (aiAnalysis ? aiAnalysis.department_id : null),
      priority: (aiAnalysis ? aiAnalysis.priority : 'Low'),
      sentiment: (aiAnalysis ? aiAnalysis.sentiment : 'Neutral'),
      suggested_resolution: (aiAnalysis ? aiAnalysis.suggested_resolution : ''),
      suggested_reply: (aiAnalysis ? aiAnalysis.suggested_reply : ''),
    });

    // Log activity
    await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Complaint Created',
      content: `Complaint "${title}" was submitted.`,
    });

    // Send email notification to user (non-blocking)
    sendComplaintCreatedEmail(req.user, complaint).catch(console.error);

    // Populate complaint before emitting socket event
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('user_id', 'name email phone')
      .populate('category_id', 'name')
      .populate('department_id', 'name');

    if (req.io) {
      req.io.emit('newComplaint', populatedComplaint);
    }

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complaints (filtered by role)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'User') {
      query.user_id = req.user._id;
    } else if (req.user.role === 'Staff') {
      query.assigned_to = req.user._id;
    } else if (req.user.role === 'Department Head') {
      query.department_id = req.user.department_id;
    }
    // Admin gets all complaints (no filter)

    const complaints = await Complaint.find(query)
      .populate('user_id', 'name email phone')
      .populate('category_id', 'name')
      .populate('department_id', 'name')
      .populate('assigned_to', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const idParam = req.params.id;
    let complaint;

    if (idParam.length === 24) {
      complaint = await Complaint.findById(idParam)
        .populate('user_id', 'name email phone')
        .populate('category_id', 'name')
        .populate('department_id', 'name')
        .populate('assigned_to', 'name email');
    } else if (idParam.length === 8) {
      // Fallback for short tracking IDs (last 8 chars of ObjectId)
      const complaints = await Complaint.find()
        .populate('user_id', 'name email phone')
        .populate('category_id', 'name')
        .populate('department_id', 'name')
        .populate('assigned_to', 'name email');
      complaint = complaints.find(c => c._id.toString().toLowerCase().endsWith(idParam.toLowerCase()));
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const comments = await Comment.find({ complaint_id: complaint._id })
      .populate('user_id', 'name role')
      .sort({ createdAt: 1 });

    res.json({ complaint, comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Staff, Dept Head, Admin)
const updateComplaintStatus = async (req, res) => {
  const { status, resolution_notes } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role-based authorization for the specific ticket
    const isAdmin = req.user.role === 'Admin';
    const isDeptHead = req.user.role === 'Department Head' && 
                       complaint.department_id && 
                       complaint.department_id.toString() === req.user.department_id?.toString();
    const isAssignedStaff = req.user.role === 'Staff' && 
                            complaint.assigned_to && 
                            complaint.assigned_to.toString() === req.user._id.toString();

    if (!isAdmin && !isDeptHead && !isAssignedStaff) {
      return res.status(403).json({ message: 'Not authorized to update this complaint status' });
    }

    // Enforce workflow transitions
    if (status === 'In Progress') {
      if (complaint.status !== 'Assigned' && complaint.status !== 'New' && complaint.status !== 'Pending Review' && complaint.status !== 'Resolved') {
        return res.status(400).json({ message: 'Can only transition to In Progress from New, Assigned, Pending Review (Rework) or Resolved (Rework)' });
      }
    } else if (status === 'Pending Review') {
      if (complaint.status !== 'In Progress') {
        return res.status(400).json({ message: 'Can only submit for review complaints that are In Progress' });
      }
      if (!resolution_notes || !resolution_notes.trim()) {
        return res.status(400).json({ message: 'Resolution notes are required to submit for review' });
      }
    } else if (status === 'Resolved') {
      if (complaint.status !== 'Pending Review') {
        return res.status(400).json({ message: 'Can only resolve complaints that are Pending Review' });
      }
      if (!isAdmin && !isDeptHead) {
        return res.status(403).json({ message: 'Only Department Heads or Admins can approve and resolve complaints' });
      }
    } else if (status === 'Closed') {
      if (complaint.status !== 'Resolved') {
        return res.status(400).json({ message: 'Can only close complaints that are Resolved' });
      }
    } else if (status === 'Assigned') {
      if (complaint.status !== 'New') {
        return res.status(400).json({ message: 'Can only assign New complaints' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    if (resolution_notes) {
      complaint.resolution_notes = resolution_notes;
    }

    if (status === 'Resolved' || status === 'Closed') {
      complaint.resolved_at = new Date();
    }

    await complaint.save();

    // Log activity
    await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Status Changed',
      content: `Status changed from "${oldStatus}" to "${status}".`,
    });

    // Notify user of status change (non-blocking)
    User.findById(complaint.user_id)
      .then(user => {
        if (user) {
          sendComplaintStatusUpdateEmail(user, complaint, oldStatus, status).catch(console.error);
        }
      })
      .catch(console.error);

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign complaint to staff
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin, Dept Head)
const assignComplaint = async (req, res) => {
  const { assigned_to } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.assigned_to = assigned_to;
    complaint.status = 'Assigned';

    await complaint.save();

    await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Complaint Assigned',
      content: `Complaint assigned to staff member.`,
    });

    // Notify staff of assignment (non-blocking)
    User.findById(assigned_to)
      .then(staff => {
        if (staff) {
          sendComplaintAssignedEmail(staff, complaint).catch(console.error);
        }
      })
      .catch(console.error);

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Escalate complaint
// @route   PUT /api/complaints/:id/escalate
// @access  Private (Staff, Dept Head)
const escalateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.escalation_level = Math.min(complaint.escalation_level + 1, 3);
    complaint.priority = 'High';

    await complaint.save();

    await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Complaint Escalated',
      content: `Complaint escalated to level ${complaint.escalation_level}.`,
    });

    // Notify Department Head of escalation (non-blocking)
    if (complaint.department_id) {
      Department.findById(complaint.department_id)
        .populate('head_id')
        .then(dept => {
          if (dept && dept.head_id) {
            sendComplaintEscalatedEmail(dept.head_id, complaint).catch(console.error);
          }
        })
        .catch(console.error);
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comments
// @access  Private
const addComment = async (req, res) => {
  const { content } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const comment = await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Comment Added',
      content,
    });

    const populated = await comment.populate('user_id', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/complaints/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'Department Head') {
      filter.department_id = req.user.department_id;
    } else if (req.user.role === 'Staff') {
      filter.assigned_to = req.user._id;
    }

    const total = await Complaint.countDocuments(filter);
    const open = await Complaint.countDocuments({ ...filter, status: 'New' });
    const inProgress = await Complaint.countDocuments({ ...filter, status: { $in: ['In Progress', 'Pending Review'] } });
    const resolved = await Complaint.countDocuments({ ...filter, status: { $in: ['Resolved', 'Closed'] } });
    const slaBreached = await Complaint.countDocuments({ ...filter, sla_breach: true });

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Complaint.aggregate([
      { $match: { ...filter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Department wise
    const departmentStats = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$department_id', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$department.name', 'Unassigned'] }, count: 1 } },
    ]);

    // Priority breakdown
    const priorityStats = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ total, open, inProgress, resolved, slaBreached, monthlyTrend, departmentStats, priorityStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Re-run AI analysis on a complaint
// @route   POST /api/complaints/:id/ai-analyze
// @access  Private (Staff, Dept Head, Admin)
const reAnalyzeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const aiAnalysis = await analyzeComplaint(complaint.title, complaint.description);
    if (aiAnalysis) {
      complaint.priority = aiAnalysis.priority || complaint.priority;
      complaint.sentiment = aiAnalysis.sentiment || complaint.sentiment;
      complaint.suggested_resolution = aiAnalysis.suggested_resolution || complaint.suggested_resolution;
      complaint.suggested_reply = aiAnalysis.suggested_reply || complaint.suggested_reply;
      
      if (!complaint.category_id && aiAnalysis.category_id) {
        complaint.category_id = aiAnalysis.category_id;
      }
      if (!complaint.department_id && aiAnalysis.department_id) {
        complaint.department_id = aiAnalysis.department_id;
      }

      await complaint.save();

      // Log activity
      await Comment.create({
        complaint_id: complaint._id,
        user_id: req.user._id,
        action: 'AI Re-analysis',
        content: `AI analysis was re-run on this complaint.`,
      });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit feedback for closed complaint
// @route   PUT /api/complaints/:id/feedback
// @access  Private (User)
const submitFeedback = async (req, res) => {
  const { rating, comments } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Verify owner
    if (complaint.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this complaint' });
    }

    // Verify status is Closed
    if (complaint.status !== 'Closed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for Closed complaints' });
    }

    // Validate rating
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    complaint.feedback_rating = numRating;
    complaint.feedback_comments = comments || '';
    await complaint.save();

    // Log activity as comment
    await Comment.create({
      complaint_id: complaint._id,
      user_id: req.user._id,
      action: 'Feedback Submitted',
      content: `User submitted feedback. Rating: ${numRating}/5. Comments: ${comments || 'None'}`,
    });

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
