const Role = require('../models/Role');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin)
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (Admin)
const createRole = async (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Role already exists' });

    const role = await Role.create({
      name,
      description,
      isCustom: true,
      permissions: permissions || []
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private (Admin)
const updateRole = async (req, res) => {
  const { permissions } = req.body;
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // We only allow updating permissions for simplicity
    role.permissions = permissions;
    await role.save();

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a custom role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    
    if (!role.isCustom) {
      return res.status(400).json({ message: 'Cannot delete system roles' });
    }

    await role.deleteOne();
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRoles, createRole, updateRole, deleteRole };
