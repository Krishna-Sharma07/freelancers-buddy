import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, formData, fileContent, fileName, userId } = body;

    // Validation
    if (!documentType || !formData || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check credits
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditData || creditData.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Check for conflicts if file uploaded
    const hasConflicts = fileContent && detectConflicts(formData, fileContent);

    // Deduct 1 credit
    await supabase
      .from('user_credits')
      .update({ credits: creditData.credits - 1 })
      .eq('user_id', userId);

    // Return response with conflict info
    return NextResponse.json({
      success: true,
      conflicts: hasConflicts ? true : false,
      message: hasConflicts 
        ? 'Conflicts detected between form and document' 
        : 'Ready to generate',
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}

function detectConflicts(formData: any, fileContent: string): boolean {
  // Simple conflict detection - check if key data differs
  const fileHasClientName = fileContent.toLowerCase().includes(formData.clientName?.toLowerCase() || 'nomatch');
  return !fileHasClientName && fileContent.length > 50; // Only conflict if file has content but different client name
}