const express = require('express');
const { getAllUsers, updateUser, deleteUser, getStaffUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);
router.get('/staff', protect, authorize('Admin', 'Department Head'), getStaffUsers);
router.put('/:id', protect, authorize('Admin'), updateUser);
router.delete('/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
