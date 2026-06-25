const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  attachments: [{
    type: String, // URLs or paths to files
  }],
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Pending Review', 'Resolved', 'Closed'],
    default: 'New',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resolution_notes: {
    type: String,
  },
  escalation_level: {
    type: Number,
    default: 0,
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral',
  },
  sla_breach: {
    type: Boolean,
    default: false,
  },
  suggested_resolution: {
    type: String,
  },
  suggested_reply: {
    type: String,
  },
  resolved_at: {
    type: Date,
  },
  feedback_rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  feedback_comments: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
