const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Optional, since non-logged in users could theoretically submit, but here it's typically for logged in users
  },
  status: {
    type: String,
    enum: ['New', 'Read', 'Replied'],
    default: 'New',
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
