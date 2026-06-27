import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user (the person who made the purchase)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find pending referral for this user
    const { data: pendingReferral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', currentUser.id)
      .eq('status', 'pending')
      .single();

    if (referralError || !pendingReferral) {
      return NextResponse.json(
        { error: 'No pending referral found for this user' },
        { status: 404 }
      );
    }

    // Check if referral has expired (48 hours)
    const now = new Date();
    const expiryDate = new Date(pendingReferral.expires_at);

    if (now > expiryDate) {
      // Mark as expired
      await supabase
        .from('referrals')
        .update({ status: 'expired' })
        .eq('id', pendingReferral.id);

      return NextResponse.json(
        { error: 'Referral period has expired (48 hours)' },
        { status: 400 }
      );
    }

    const referrer_id = pendingReferral.referrer_id;

    // Get referrer's completed referrals count to determine tier
    const { data: referrerStats } = await supabase
      .from('referral_stats_by_user')
      .select('completed_referrals')
      .eq('referrer_id', referrer_id)
      .single();

    const completedCount = referrerStats?.completed_referrals || 0;

    // Calculate tier and credits to award
    let tierLevel = 1;
    let creditsToAward = 1;

    if (completedCount >= 7) {
      tierLevel = 3;
      creditsToAward = 3;
    } else if (completedCount >= 3) {
      tierLevel = 2;
      creditsToAward = 2;
    }

    // Update referral record to completed
    const { data: updatedReferral, error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        credits_awarded: creditsToAward,
        tier_level: tierLevel,
      })
      .eq('id', pendingReferral.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update referral error:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete referral' },
        { status: 500 }
      );
    }

    // Get referrer's current credits
    const { data: referrerCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', referrer_id)
      .single();

    if (creditsError) {
      console.error('Fetch credits error:', creditsError);
      return NextResponse.json(
        { error: 'Failed to fetch referrer credits' },
        { status: 500 }
      );
    }

    // Update referrer's credits
    const newCreditsFromReferrals = (referrerCredits?.credits_earned_from_referrals || 0) + creditsToAward;
    const newTotalCredits = (referrerCredits?.credits || 0) + creditsToAward;

    const { data: updatedCredits, error: creditsUpdateError } = await supabase
      .from('user_credits')
      .update({
        credits_earned_from_referrals: newCreditsFromReferrals,
        credits: newTotalCredits,
        updated_at: now.toISOString(),
      })
      .eq('user_id', referrer_id)
      .select()
      .single();

    if (creditsUpdateError) {
      console.error('Update credits error:', creditsUpdateError);
      return NextResponse.json(
        { error: 'Failed to award credits' },
        { status: 500 }
      );
    }

    // Get referrer's new tier (for response)
    const { data: newReferrerStats } = await supabase
      .from('referral_stats_by_user')
      .select('*')
      .eq('referrer_id', referrer_id)
      .single();

    return NextResponse.json({
      success: true,
      referral_completed: {
        referral_id: updatedReferral.id,
        referred_user_id: currentUser.id,
        referrer_id,
        status: 'completed',
        completed_at: updatedReferral.completed_at,
        credits_awarded: creditsToAward,
        tier_level: tierLevel,
      },
      referrer_new_state: {
        total_credits: updatedCredits.credits,
        credits_earned_from_referrals: updatedCredits.credits_earned_from_referrals,
        completed_referrals: newReferrerStats?.completed_referrals || 0,
        total_credits_earned: newReferrerStats?.total_credits_earned || 0,
      },
      message: `✅ Congratulations! Your referral is complete. ${creditsToAward} credit(s) awarded to ${referrer_id.slice(0, 8)}...`,
    });
  } catch (error) {
    console.error('Complete referral error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}