const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  reconnection: true,
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');

  // Start a job
  socket.emit('job:start', {
    jobId: '123',
    jobType: 'contract-scan',
  });
});

socket.on('job:acknowledged', (data) => {
  console.log('📨 Job acknowledged:', data);
});

socket.on('job:progress', (data) => {
  console.log('📊 Job progress:', data);
});

socket.on('job:complete', (data) => {
  console.log('✅ Job complete:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
  process.exit(0);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Simulate Python service sending progress
setTimeout(() => {
  socket.emit('job:progress', {
    jobId: '123',
    progress: 25,
    status: 'processing',
  });
}, 2000);

setTimeout(() => {
  socket.emit('job:complete', {
    jobId: '123',
    result: { risks: [] },
  });
}, 5000);