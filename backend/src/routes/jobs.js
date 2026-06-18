const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { pdfScanQueue } = require('../services/jobQueue');

const router = express.Router();

// ============ CREATE PDF SCAN JOB ============
router.post('/pdf-scan', authMiddleware, async (req, res) => {
  try {
    const { filePath, fileName } = req.body;
    const userId = req.userId;

    if (!filePath || !fileName) {
      return res.status(400).json({ 
        error: 'filePath and fileName are required' 
      });
    }

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ 
        error: 'File not found at specified path' 
      });
    }

    // Create job ID
    const jobId = uuidv4();

    // Add job to queue
    const job = await pdfScanQueue.add(
      'scan',
      {
        jobId,
        userId,
        filePath,
        fileName,
        createdAt: new Date(),
      },
      {
        jobId, // Use same ID for tracking
        attempts: 3, // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 second initial delay
        },
        removeOnComplete: false, // Keep completed jobs for history
        removeOnFail: false,
      }
    );

    console.log(`📋 Job ${jobId} added to queue for ${fileName}`);

    // Notify frontend via WebSocket
    global.wsService.emitToAll('job:created', {
      jobId,
      userId,
      fileName,
      status: 'queued',
      createdAt: new Date(),
    });

    res.status(201).json({
      message: 'PDF scan job created',
      jobId,
      status: 'queued',
      fileName,
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create job',
      message: error.message 
    });
  }
});

// ============ GET JOB STATUS ============
router.get('/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job from queue
    const job = await pdfScanQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    const state = await job.getState();
    const progress = job._progress || 0; // Use _progress instead
    const data = job.data;

    res.json({
      jobId,
      status: state,
      progress,
      fileName: data.fileName,
      createdAt: data.createdAt,
      result: job.returnvalue || null, // Returns result if completed
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch job',
      message: error.message 
    });
  }
});

// ============ GET ALL USER JOBS ============
router.get('/user/jobs/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all jobs (pending, active, completed, failed)
    const jobs = await pdfScanQueue.getJobs(['pending', 'active', 'completed', 'failed'], 0, -1);

    // Filter by userId
    const userJobs = jobs.filter(job => job.data.userId === userId);

    const jobsData = await Promise.all(
      userJobs.map(async (job) => ({
        jobId: job.id,
        fileName: job.data.fileName,
        status: await job.getState(),
        progress: job.progress() || 0,
        createdAt: job.data.createdAt,
        result: job.returnvalue || null,
      }))
    );

    res.json({
      count: jobsData.length,
      jobs: jobsData,
    });
  } catch (error) {
    console.error('Fetch all jobs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      message: error.message 
    });
  }
});

// ============ CANCEL JOB ============
router.delete('/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await pdfScanQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    // Remove the job
    await job.remove();

    res.json({
      message: 'Job cancelled',
      jobId,
    });
  } catch (error) {
    console.error('Job cancellation error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel job',
      message: error.message 
    });
  }
});

module.exports = router;