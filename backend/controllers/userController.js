const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('department_id', 'name')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user details (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  const { name, email, role, department_id, isActive } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department_id !== undefined) user.department_id = department_id || null;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // If the user is made Department Head, update the department
    if (role === 'Department Head' && department_id) {
      await Department.findByIdAndUpdate(department_id, { head_id: user._id });
    }

    const updated = await User.findById(user._id).select('-password').populate('department_id', 'name');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all staff users (for assignment dropdowns)
// @route   GET /api/users/staff
// @access  Private (Admin, Dept Head)
const getStaffUsers = async (req, res) => {
  try {
    const query = { role: { $in: ['Staff', 'Department Head'] } };
    
    // Dept Heads only see staff in their own department
    if (req.user.role === 'Department Head' && req.user.department_id) {
      query.department_id = req.user.department_id;
    }

    const staff = await User.find(query)
      .select('-password')
      .populate('department_id', 'name');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser, getStaffUsers };
