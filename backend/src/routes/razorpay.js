const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../services/razorpayService');
const supabase = require('../config/supabase');

// Plan mapping
const PLANS = {
  free: { credits: 3, amount: 0 },
  standard: { credits: 15, amount: 2500 },
  pro: { credits: 50, amount: 8000 },
  professional: { credits: 100, amount: 15000 },
};

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { plan, userId } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user email from Supabase
    const { data: userData } = await supabase.auth.admin.getUserById(userId);

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const planData = PLANS[plan];
    const order = await createOrder(
      planData.amount,
      plan,
      planData.credits,
      userData.email
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify payment and add credits
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan, userId } = req.body;

    if (!orderId || !paymentId || !signature || !plan || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const isValid = verifyPayment(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get plan credits
    const planData = PLANS[plan];
    if (!planData) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Update user credits in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let updateResult;

    if (existingUser) {
      // Update existing credits
      updateResult = await supabase
        .from('user_credits')
        .update({
          credits: existingUser.credits + planData.credits,
          last_purchase_plan: plan,
          last_purchase_date: new Date(),
        })
        .eq('user_id', userId);
    } else {
      // Create new credits record
      updateResult = await supabase.from('user_credits').insert({
        user_id: userId,
        credits: planData.credits,
        last_purchase_plan: plan,
        last_purchase_date: new Date(),
      });
    }

    if (updateResult.error) {
      throw updateResult.error;
    }

    res.json({
      success: true,
      message: 'Payment verified and credits added',
      credits: existingUser
        ? existingUser.credits + planData.credits
        : planData.credits,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;