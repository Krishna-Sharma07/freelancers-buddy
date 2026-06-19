const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Mock AI response (replace with real Claude API later)
const mockScanPDF = async (fileContent) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    riskScore: Math.floor(Math.random() * 100),
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    summary: 'This contract contains standard terms and conditions. Review carefully for any custom modifications that may affect your obligations.',
    risks: [
      {
        title: 'Unlimited Liability Clause',
        severity: 'high',
        description: 'The contract does not limit the client\'s liability for breach. Consider negotiating a cap on liability.'
      },
      {
        title: 'Indefinite Contract Duration',
        severity: 'medium',
        description: 'The contract does not specify an end date. You may be bound indefinitely. Request a specific term.'
      },
      {
        title: 'IP Rights Assignment',
        severity: 'medium',
        description: 'The contract assigns all intellectual property to the client. Consider if you want to retain any IP rights.'
      }
    ]
  };
};

// Scan contract
router.post('/scan', async (req, res) => {
  try {
    const { fileName, fileContent, userId } = req.body;

    if (!fileName || !fileContent || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      throw creditsError;
    }

    if (!userCredits || userCredits.credits < 1) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Get scan results from AI (mock for now)
    const scanResult = await mockScanPDF(fileContent);

    const scanId = uuidv4();

    // Store scan result in Supabase
    const { error: insertError } = await supabase
      .from('contract_scans')
      .insert({
        id: scanId,
        user_id: userId,
        file_name: fileName,
        risk_score: scanResult.riskScore,
        risk_level: scanResult.riskLevel,
        summary: scanResult.summary,
        risks: JSON.stringify(scanResult.risks),
        created_at: new Date(),
      });

    if (insertError) {
      throw insertError;
    }

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: userCredits.credits - 1,
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      id: scanId,
      riskScore: scanResult.riskScore,
      riskLevel: scanResult.riskLevel,
      summary: scanResult.summary,
      risks: scanResult.risks,
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Failed to scan contract',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get scan history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: scans, error } = await supabase
      .from('contract_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json(scans || []);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: 'Failed to fetch scan history',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get single scan result
router.get('/result/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;

    const { data: scan, error } = await supabase
      .from('contract_scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) {
      throw error;
    }

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({
      ...scan,
      risks: JSON.parse(scan.risks),
    });
  } catch (error) {
    console.error('Result error:', error);
    res.status(500).json({
      error: 'Failed to fetch scan result',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;