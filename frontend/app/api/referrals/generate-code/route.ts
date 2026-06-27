import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to generate unique referral code
function generateReferralCode(): string {
  // Format: USER + 8 random alphanumeric chars
  // Example: USER7A9B2C1D
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'USER';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

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

    // Check if user already has a referral code
    const { data: existingCode, error: checkError } = await supabase
      .from('referral_codes')
      .select('code, referral_url')
      .eq('user_id', user.id)
      .single();

    // If code already exists, return it
    if (existingCode && !checkError) {
      return NextResponse.json({
        success: true,
        code: existingCode.code,
        referral_url: existingCode.referral_url,
        message: 'Referral code already exists',
      });
    }

    // Generate new unique code
    let newCode = generateReferralCode();
    let codeExists = true;
    let attempts = 0;

    // Ensure code is truly unique (retry if collision)
    while (codeExists && attempts < 5) {
      const { data: duplicate } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', newCode)
        .single();

      if (!duplicate) {
        codeExists = false;
      } else {
        newCode = generateReferralCode();
        attempts++;
      }
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Build referral URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}/ref/${newCode}`;

    // Insert into referral_codes table
    const { data: newReferralCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code: newCode,
        referral_url: referralUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create referral code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newReferralCode.code,
      referral_url: newReferralCode.referral_url,
      message: 'Referral code generated successfully',
    });
  } catch (error) {
    console.error('Generate referral code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}