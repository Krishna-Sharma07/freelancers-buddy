const { Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs');

// Redis connection with BullMQ required options
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Initialize Worker for PDF scanning
const pdfScanWorker = new Worker('pdf-scan', async (job) => {
  console.log(`\n🔍 Processing PDF scan job ${job.id}`);
  console.log(`   Data:`, job.data);

  try {
    const { filePath, fileName, userId, jobId } = job.data;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read PDF file (as buffer for now)
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    console.log(`   📄 PDF file size: ${fileSize} bytes`);

    // TODO: Integrate actual PDF parsing here later
    // For now, just simulate processing
    const analysisResult = {
      fileName,
      fileSize,
      status: 'completed',
      message: 'PDF received and queued for analysis',
      extractedText: `Mock extraction from ${fileName}. Full PDF parsing will be integrated with AI model.`,
      processedAt: new Date(),
    };

    await job.updateProgress(100);

    console.log(`   ✅ PDF scan completed for ${fileName}`);

    return analysisResult;
  } catch (error) {
    console.error(`   ❌ Error processing job ${job.id}:`, error.message);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 2,
});

// Worker event listeners
pdfScanWorker.on('completed', (job) => {
  console.log(`\n✅ Job ${job.id} completed successfully\n`);
});

pdfScanWorker.on('failed', (job, err) => {
  console.error(`\n❌ Job ${job.id} failed: ${err.message}\n`);
});

pdfScanWorker.on('active', (job) => {
  console.log(`⚙️ Job ${job.id} is now active`);
});

module.exports = pdfScanWorker;