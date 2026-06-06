const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Initialize Redis connection with BullMQ required options
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create job queues
const pdfScanQueue = new Queue('pdf-scan', {
  connection: redis,
});

// Event listeners for queue
pdfScanQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

pdfScanQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

pdfScanQueue.on('active', (job) => {
  console.log(`⚙️ Job ${job.id} started processing`);
});

module.exports = {
  pdfScanQueue,
  redis,
};