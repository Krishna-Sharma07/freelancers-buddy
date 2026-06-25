import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, currentDocument, refinementRequest, userId } = body;

    // Validation
    if (!documentType || !currentDocument || !refinementRequest || !userId) {
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
        { error: 'Insufficient credits for refinement' },
        { status: 402 }
      );
    }

    // Deduct 1 credit for refinement
    await supabase
      .from('user_credits')
      .update({ credits: creditData.credits - 1 })
      .eq('user_id', userId);

    // Mock refinement - in real implementation, call Claude API
    const refinedDocument = applyRefinement(currentDocument, refinementRequest);

    return NextResponse.json({
      success: true,
      refinedDocument,
      message: 'Document refined successfully',
    });
  } catch (error) {
    console.error('Refinement error:', error);
    return NextResponse.json(
      { error: 'Refinement failed' },
      { status: 500 }
    );
  }
}

function applyRefinement(document: string, refinementRequest: string): string {
  // Mock refinement - just append a note
  // In real implementation, Claude would intelligently modify the document
  const refinementNote = `\n\n[REFINEMENT APPLIED: ${refinementRequest}]`;
  return document + refinementNote;
}