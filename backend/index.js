const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl) or if origin is in allowed list / localhost regex
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for dev flexibility
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin: true, // Reflect request origin to allow any dev port
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection status middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api')) {
    return res.status(500).json({ 
      message: 'Database Connection Error: Could not connect to MongoDB Atlas. Please check your MONGO_URI environment variable on Render and allow IP access (0.0.0.0/0) in MongoDB Atlas.',
      readyState: mongoose.connection.readyState
    });
  }
  next();
});

// Attach io to requests so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected to Remote Atlas');
  } catch (err) {
    console.error('Atlas connection failed:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/cg_management');
        console.log('MongoDB Connected to Local Database (mongodb://127.0.0.1:27017/cg_management)');
      } catch (localErr) {
        console.error('Local MongoDB connection error:', localErr.message);
      }
    }
  }
};
connectDB();

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
const backupRoutes = require('./routes/backupRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/backup', backupRoutes);

app.get('/', (req, res) => {
  res.send('Complaint Management API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
