const mongoose = require('mongoose');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Role = require('../models/Role');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

// @desc    Download a full database backup as JSON
// @route   GET /api/backup/download
// @access  Private (Admin)
const createBackup = async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        categories: await Category.find({}),
        comments: await Comment.find({}),
        complaints: await Complaint.find({}),
        departments: await Department.find({}),
        roles: await Role.find({}),
        supportMessages: await SupportMessage.find({}),
        users: await User.find({})
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cg-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

// @desc    Restore database from a JSON backup file
// @route   POST /api/backup/restore
// @access  Private (Admin)
const restoreBackup = async (req, res) => {
  try {
    const backupData = req.body;

    if (!backupData || !backupData.data) {
      return res.status(400).json({ message: 'Invalid backup file format.' });
    }

    const { data } = backupData;
    const adminUserId = req.user._id;

    // Start a session for transaction if replica set is available, but for standalone we just do it sequentially.
    // It's safer to clear collections except the current admin user to prevent lockout.

    // 1. Clear collections
    await Category.deleteMany({});
    await Comment.deleteMany({});
    await Complaint.deleteMany({});
    await Department.deleteMany({});
    await Role.deleteMany({});
    await SupportMessage.deleteMany({});
    await User.deleteMany({ _id: { $ne: adminUserId } }); // Delete all except current admin

    // 2. Insert new data
    if (data.categories && data.categories.length > 0) await Category.insertMany(data.categories);
    if (data.comments && data.comments.length > 0) await Comment.insertMany(data.comments);
    if (data.complaints && data.complaints.length > 0) await Complaint.insertMany(data.complaints);
    if (data.departments && data.departments.length > 0) await Department.insertMany(data.departments);
    if (data.roles && data.roles.length > 0) await Role.insertMany(data.roles);
    if (data.supportMessages && data.supportMessages.length > 0) await SupportMessage.insertMany(data.supportMessages);
    
    // For users, we need to be careful not to overwrite the current admin if they exist in the backup with a different password hash.
    if (data.users && data.users.length > 0) {
      // Filter out the current admin from the backup data if they exist, so we don't try to insert a duplicate key
      const usersToInsert = data.users.filter(u => u._id !== adminUserId.toString());
      if (usersToInsert.length > 0) {
        await User.insertMany(usersToInsert);
      }
    }

    res.json({ message: 'System restored successfully!' });
  } catch (error) {
    console.error('Restore Error:', error);
    res.status(500).json({ message: 'Failed to restore backup', error: error.message });
  }
};

module.exports = {
  createBackup,
  restoreBackup
};
