import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Get current user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get aggregated stats from view
    const { data: stats, error: statsError } = await supabase
      .from('referral_stats_by_user')
      .select('*')
      .eq('referrer_id', user.id)
      .single();

    // If no stats yet, return zeros
    const referralStats = stats || {
      total_referrals: 0,
      completed_referrals: 0,
      pending_referrals: 0,
      total_credits_earned: 0,
      last_referral_date: null,
    };

    // Calculate current tier based on completed referrals
    const completedCount = referralStats.completed_referrals;
    let currentTier = 1;
    let tiersCompleted = 1;

    if (completedCount > 6) {
      currentTier = 3;
      tiersCompleted = 3;
    } else if (completedCount > 2) {
      currentTier = 2;
      tiersCompleted = 2;
    }

    // Get detailed referral list with 48h countdown
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_user_id,
        status,
        referred_at,
        expires_at,
        credits_awarded,
        tier_level
      `)
      .eq('referrer_id', user.id)
      .order('referred_at', { ascending: false });

    if (referralsError) {
      console.error('Referrals error:', referralsError);
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    // Process referrals with 48h countdown
    const processedReferrals = (referrals || []).map((ref) => {
      let expiresIn = '';
      
      if (ref.status === 'pending' && ref.expires_at) {
        const now = new Date();
        const expiryDate = new Date(ref.expires_at);
        const diffMs = expiryDate.getTime() - now.getTime();
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            expiresIn = `${hours}h ${minutes}m`;
          } else {
            expiresIn = `${minutes}m`;
          }
        } else {
          expiresIn = 'Expired';
        }
      }

      return {
        id: ref.id,
        referred_user_id: ref.referred_user_id,
        status: ref.status,
        referred_at: ref.referred_at,
        expires_at: ref.expires_at,
        expiresIn,
        credits_awarded: ref.credits_awarded,
        tier_level: ref.tier_level,
      };
    });

    // Get referral code for the user
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('code, referral_url')
      .eq('user_id', user.id)
      .single();

    // Calculate progress to next tier
    const progressData = {
      current_tier: currentTier,
      tiers_completed: tiersCompleted,
      completed_in_tier: (() => {
        if (currentTier === 1) return Math.min(completedCount, 3);
        if (currentTier === 2) return Math.min(completedCount - 3, 4);
        return completedCount - 7;
      })(),
      tier_thresholds: {
        tier_1: { min: 0, max: 3, credits_per: 1 },
        tier_2: { min: 4, max: 7, credits_per: 2 },
        tier_3: { min: 8, max: null, credits_per: 3 },
      },
    };

    return NextResponse.json({
      success: true,
      stats: {
        total_referrals: referralStats.total_referrals,
        completed_referrals: referralStats.completed_referrals,
        pending_referrals: referralStats.pending_referrals,
        total_credits_earned: referralStats.total_credits_earned,
        last_referral_date: referralStats.last_referral_date,
      },
      referral_code: codeData?.code || null,
      referral_url: codeData?.referral_url || null,
      referrals: processedReferrals,
      progress: progressData,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}