const SupportMessage = require('../models/SupportMessage');

// @desc    Create a new support message
// @route   POST /api/support
// @access  Public or Private (User)
const createMessage = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newMessage = await SupportMessage.create({
      name,
      email,
      message,
      user_id: req.user ? req.user._id : null,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all support messages
// @route   GET /api/support
// @access  Private (Admin)
const getMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update support message status
// @route   PUT /api/support/:id/status
// @access  Private (Admin)
const updateMessageStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!['New', 'Read', 'Replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    message.status = status;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createMessage,
  getMessages,
  updateMessageStatus,
};
