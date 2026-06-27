const express = require('express');
const router = express.Router();
const { createBackup, restoreBackup } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/download', protect, authorize('Admin'), createBackup);
router.post('/restore', protect, authorize('Admin'), restoreBackup);

module.exports = router;
