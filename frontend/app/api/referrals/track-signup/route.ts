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

    // Get referral code from request body
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user (the person signing up)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find the referral code in database
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('id, user_id')
      .eq('code', referral_code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    const referrer_id = codeData.user_id;

    // Prevent self-referral
    if (referrer_id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Check if this user was already referred by someone else
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', currentUser.id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: 'This account was already referred' },
        { status: 400 }
      );
    }

    // Calculate expiry time (48 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Create referral record
    const { data: newReferral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id,
        referred_user_id: currentUser.id,
        referral_code_id: codeData.id,
        status: 'pending',
        referred_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        credits_awarded: 0,
        tier_level: 1, // Will be updated when referral completes
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert referral error:', insertError);
      return NextResponse.json(
        { error: 'Failed to track referral' },
        { status: 500 }
      );
    }

    // Calculate hours until expiry
    const diffMs = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60));

    return NextResponse.json({
      success: true,
      referral: {
        id: newReferral.id,
        referrer_id: newReferral.referrer_id,
        status: newReferral.status,
        referred_at: newReferral.referred_at,
        expires_at: newReferral.expires_at,
        hours_until_expiry: hoursUntilExpiry,
      },
      message: `Successfully tracked referral. Credits will be awarded in ${hoursUntilExpiry} hours upon your first purchase.`,
    });
  } catch (error) {
    console.error('Track referral error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}