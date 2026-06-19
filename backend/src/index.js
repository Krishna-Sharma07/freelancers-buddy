const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
require('dotenv').config();

const WebSocketService = require('./services/websocket');
const pdfScanWorker = require('./workers/pdfScanWorker');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const razorpayRoutes = require('./routes/razorpay');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Service
const wsService = new WebSocketService(server);
global.wsService = wsService; // Make available globally

// Initialize PDF Scan Worker
console.log('🤖 PDF Scan Worker initialized');

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
    environment: process.env.NODE_ENV,
    websocket: 'connected',
    jobQueue: 'ready'
  });
});

// ============ ROUTES ============

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/razorpay', razorpayRoutes);
// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    userId: req.userId,
  });
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
server.listen(PORT, 'localhost', () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`⚙️ Job Queue (BullMQ) ready`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}\n`);
});

// ============ GRACEFUL SHUTDOWN ============

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  
  try {
    await pdfScanWorker.close();
    console.log('✅ PDF Scan Worker closed');
  } catch (error) {
    console.error('❌ Error closing worker:', error);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  
  try {
    await pdfScanWorker.close();
    console.log('✅ PDF Scan Worker closed');
  } catch (error) {
    console.error('❌ Error closing worker:', error);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wsService };