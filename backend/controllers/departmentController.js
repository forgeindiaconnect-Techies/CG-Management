const Department = require('../models/Department');
const User = require('../models/User');

// GET all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('head_id', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST create department
const createDepartment = async (req, res) => {
  const { name, head_id } = req.body;
  try {
    const dept = await Department.create({ name, head_id: head_id || null });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT update department
const updateDepartment = async (req, res) => {
  const { name, head_id } = req.body;
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { name, head_id },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE department
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET all staff users
const getStaffUsers = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['Staff', 'Department Head'] } }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, getStaffUsers };
