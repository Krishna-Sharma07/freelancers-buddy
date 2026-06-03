const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============ CREATE JOB ============
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobType, documentId } = req.body;
    const userId = req.userId;

    if (!jobType || !documentId) {
      return res.status(400).json({ error: 'jobType and documentId required' });
    }

    const jobId = uuidv4();

    // Notify frontend via WebSocket
    global.wsService.emitToAll('job:created', {
      jobId,
      userId,
      jobType,
      documentId,
      status: 'queued',
      createdAt: new Date(),
    });

    res.status(201).json({
      message: 'Job created',
      jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// ============ GET JOB STATUS ============
router.get('/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // In real implementation, fetch from database/Redis
    res.json({
      jobId,
      status: 'processing',
      progress: 50,
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

module.exports = router;