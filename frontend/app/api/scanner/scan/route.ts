import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScanAnalysisResponse {
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  summary: string;
  risks: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    pageNumber: number;
  }>;
}

// Mock analysis function - Returns sample data with pageNumber
// Replace this with real Claude API call on July 8+
function generateMockAnalysis(): ScanAnalysisResponse {
  // Randomly generate risk level
  const randomRiskLevel = Math.random();
  let riskLevel: 'high' | 'medium' | 'low';
  let riskScore: number;

  if (randomRiskLevel > 0.6) {
    riskLevel = 'high';
    riskScore = 70 + Math.floor(Math.random() * 30);
  } else if (randomRiskLevel > 0.3) {
    riskLevel = 'medium';
    riskScore = 40 + Math.floor(Math.random() * 30);
  } else {
    riskLevel = 'low';
    riskScore = 10 + Math.floor(Math.random() * 30);
  }

  return {
    riskLevel,
    riskScore,
    summary: riskLevel === 'high'
      ? 'This contract has several significant risks that should be reviewed by a legal professional before signing.'
      : riskLevel === 'medium'
      ? 'This contract has some moderate concerns that should be negotiated or clarified before proceeding.'
      : 'This contract appears relatively standard with minor points to review.',
    risks: [
      {
        title: 'Unclear Payment Terms',
        severity: 'high',
        description: 'Payment schedule is ambiguous. Specify exact amounts, dates, and conditions (e.g., "₹50,000 upon project start, ₹50,000 upon delivery").',
        pageNumber: 1
      },
      {
        title: 'Broad Liability Clause',
        severity: 'medium',
        description: 'The liability section exposes you to unlimited damages. Consider adding a cap (e.g., "liability limited to 100% of fees paid").',
        pageNumber: 2
      },
      {
        title: 'Missing Termination Rights',
        severity: 'medium',
        description: 'No clear exit clause if the client or you needs to end the contract. Add a termination section with notice periods.',
        pageNumber: 3
      },
      {
        title: 'Vague Scope Definition',
        severity: 'high',
        description: 'Deliverables and scope are not clearly defined. Add specific milestones, features, and acceptance criteria.',
        pageNumber: 2
      },
      {
        title: 'Missing IP Ownership Clause',
        severity: 'medium',
        description: 'Intellectual property rights are not addressed. Clarify who owns the work (you, client, or shared).',
        pageNumber: 4
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileContent, userId } = body;

    // Validation
    if (!fileName || !fileContent || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user credits
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

    // Generate mock analysis (replace with real Claude API on July 8+)
    const analysis = generateMockAnalysis();

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: creditData.credits - 1 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Credit deduction error:', updateError);
      return NextResponse.json(
        { error: 'Failed to process credit' },
        { status: 500 }
      );
    }

    // Save contract scan result to database
    const { data: savedResult, error: saveError } = await supabase
      .from('contract_scans')
      .insert({
        user_id: userId,
        file_name: fileName,
        risk_level: analysis.riskLevel,
        risk_score: analysis.riskScore,
        summary: analysis.summary,
        risks: analysis.risks,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save result error:', saveError);
      // Don't return error - analysis was successful
    }

    // Return analysis results
    return NextResponse.json({
      id: savedResult?.id || `scan-${Date.now()}`,
      ...analysis,
    });
  } catch (error) {
    console.error('Scanner error:', error);
    return NextResponse.json(
      { error: 'An error occurred while scanning your contract' },
      { status: 500 }
    );
  }
}