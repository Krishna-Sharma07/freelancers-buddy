const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// ============ MIDDLEWARE ============

app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

// ============ WEBSOCKET SETUP ============

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for job start event from frontend
  socket.on('job:start', (data) => {
    console.log('Job started:', data);
    // We'll handle this properly in Phase 5
  });

  // Listen for job updates from Python service
  socket.on('job:update', (data) => {
    console.log('Job update:', data);
    // Broadcast to frontend
    socket.emit('progress', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ============ PLACEHOLDER ROUTES (Will implement properly in Days 5-7) ============

app.post('/api/auth/signup', (req, res) => {
  res.json({ message: 'Signup route - coming soon' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login route - coming soon' });
});

app.post('/api/documents', (req, res) => {
  res.json({ message: 'Upload document - coming soon' });
});

app.post('/api/jobs', (req, res) => {
  res.json({ message: 'Create job - coming soon' });
});

app.get('/api/jobs/:jobId', (req, res) => {
  res.json({ message: 'Get job status - coming soon' });
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}\n`);
});

module.exports = { app, io };