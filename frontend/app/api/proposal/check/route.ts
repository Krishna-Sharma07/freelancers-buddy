import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProposalAnalysisResponse {
  conversionProbability: number;
  weakSegments: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;
  recommendations: Array<{
    segment: string;
    suggestion: string;
    expectedImpact: string;
  }>;
}

// Mock analysis function - Returns sample data
// Replace this with real Claude API call on July 8+
function generateMockAnalysis(projectDescription: string): ProposalAnalysisResponse {
  // Generate different scores based on proposal length/quality indicators
  const hasTimeline = projectDescription.toLowerCase().includes('day') || projectDescription.toLowerCase().includes('week');
  const hasBudget = projectDescription.toLowerCase().includes('₹') || projectDescription.toLowerCase().includes('$');
  const hasScope = projectDescription.toLowerCase().includes('page') || projectDescription.toLowerCase().includes('feature');

  const qualityScore = [hasTimeline ? 20 : 0, hasBudget ? 25 : 0, hasScope ? 25 : 0].reduce((a, b) => a + b, 0) + 30;

  return {
    conversionProbability: Math.min(100, qualityScore + Math.floor(Math.random() * 20)),
    weakSegments: [
      {
        title: 'Vague Deliverables',
        severity: 'high',
        description: 'The proposal doesn\'t specify exact deliverables or what "success" looks like',
        impact: 'Client unsure of what they\'re paying for - high risk of scope creep'
      },
      {
        title: 'Missing Timeline Milestones',
        severity: 'medium',
        description: 'No phase breakdown or intermediate milestones mentioned',
        impact: 'Client worried about delays; no way to track progress'
      },
      {
        title: 'Weak Value Positioning',
        severity: 'medium',
        description: 'Proposal focuses on features, not client benefits or outcomes',
        impact: 'Fails to answer "why should they choose you?" - competitive disadvantage'
      }
    ],
    recommendations: [
      {
        segment: 'Deliverables',
        suggestion: 'Add specific deliverables list: "Homepage design, 5 product pages, checkout flow, admin dashboard, payment integration, mobile responsiveness, post-launch support"',
        expectedImpact: '+20% clarity score. Clients feel confident they know exactly what they\'re getting'
      },
      {
        segment: 'Timeline',
        suggestion: 'Break into phases: "Week 1-2: Discovery & design review. Week 3: Homepage & product pages build. Week 4: Payments & dashboard. Week 5: Testing & launch"',
        expectedImpact: '+15% confidence. Shows you have a plan and can deliver predictably'
      },
      {
        segment: 'Value Proposition',
        suggestion: 'Change from "I will build a website" to "Your store will launch in 30 days, accepting payments immediately, with built-in analytics to track sales. You\'ll be live before your competitors."',
        expectedImpact: '+18% conversion likelihood. Shifts focus to client outcomes, not your effort'
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileContent, projectDescription, userId } = body;

    // Validation
    if (!fileName || !fileContent || !projectDescription || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!projectDescription.trim()) {
      return NextResponse.json(
        { error: 'Project description cannot be empty' },
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
    const analysis = generateMockAnalysis(projectDescription);

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

    // Save proposal check result to database
    const { data: savedResult, error: saveError } = await supabase
      .from('proposal_checks')
      .insert({
        user_id: userId,
        file_name: fileName,
        project_description: projectDescription,
        conversion_probability: analysis.conversionProbability,
        weak_segments: analysis.weakSegments,
        recommendations: analysis.recommendations,
        proposal_text: projectDescription.substring(0, 500), // Store description as text for now
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
      id: savedResult?.id || `check-${Date.now()}`,
      ...analysis,
    });
  } catch (error) {
    console.error('Proposal check error:', error);
    return NextResponse.json(
      { error: 'An error occurred while analyzing your proposal' },
      { status: 500 }
    );
  }
}