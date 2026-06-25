const express = require('express');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment, getStaffUsers } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getDepartments);
router.get('/staff', protect, authorize('Admin', 'Department Head'), getStaffUsers);
router.post('/', protect, authorize('Admin'), createDepartment);
router.put('/:id', protect, authorize('Admin'), updateDepartment);
router.delete('/:id', protect, authorize('Admin'), deleteDepartment);

module.exports = router;
