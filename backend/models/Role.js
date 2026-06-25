const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
  },
  isCustom: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
