const socketIO = require('socket.io');

class WebSocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? 'https://yourdomain.com' 
          : 'http://localhost:3001',
        methods: ['GET', 'POST'],
      },
    });

    this.setupConnections();
  }

  setupConnections() {
    this.io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      // ============ JOB EVENTS ============

      // Frontend starts a job
      socket.on('job:start', (data) => {
        console.log(`📤 Job started:`, data);
        // We'll handle actual job creation in the API route
        // Just acknowledge receipt here
        socket.emit('job:acknowledged', { 
          jobId: data.jobId,
          status: 'queued' 
        });
      });

      // Python service sends progress update
      socket.on('job:progress', (data) => {
        console.log(`📊 Job progress:`, data);
        // Broadcast to specific user (if they're listening)
        socket.emit('job:progress', data);
      });

      // Python service says job is complete
      socket.on('job:complete', (data) => {
        console.log(`✅ Job complete:`, data);
        socket.emit('job:complete', data);
      });

      // Python service reports error
      socket.on('job:error', (data) => {
        console.log(`❌ Job error:`, data);
        socket.emit('job:error', data);
      });

      // Frontend requests job status
      socket.on('job:status', (data) => {
        console.log(`🔍 Status request for job:`, data.jobId);
        // In real implementation, fetch from Redis
        socket.emit('job:status', { 
          jobId: data.jobId,
          status: 'processing' 
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`⚠️ Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }

  // Emit to all users
  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  // Join user to a room (for real-time updates per job)
  joinRoom(socketId, roomName) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomName);
      console.log(`✅ Socket ${socketId} joined room: ${roomName}`);
    }
  }

  // Leave room
  leaveRoom(socketId, roomName) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(roomName);
      console.log(`✅ Socket ${socketId} left room: ${roomName}`);
    }
  }

  // Emit to room
  emitToRoom(roomName, event, data) {
    this.io.to(roomName).emit(event, data);
  }

  getIO() {
    return this.io;
  }
}

module.exports = WebSocketService;