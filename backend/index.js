const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to requests so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start SLA checker
const { startSLAChecker } = require('./utils/slaChecker');
startSLAChecker(io);

// Routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const exportRoutes = require('./routes/exportRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const supportRoutes = require('./routes/supportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/support', supportRoutes);

app.get('/', (req, res) => {
  res.send('Complaint Management API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
