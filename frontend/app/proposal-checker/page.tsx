'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ProposalResult {
  id: string;
  fileName: string;
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
  projectDescription: string;
  timestamp: Date;
}

export default function ProposalChecker() {
  const router = useRouter();
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch real credits from database
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: creditData } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();
          
          setCreditsRemaining(creditData?.credits || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    fetchCredits();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      if (droppedFiles[0].type === 'application/pdf') {
        setFile(droppedFiles[0]);
        setError('');
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        setFile(e.target.files[0]);
        setError('');
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleCheck = async () => {
    if (!file) {
      setError('Please select a proposal PDF');
      return;
    }

    if (!projectDescription.trim()) {
      setError('Please describe the project to score your proposal accurately');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(',')[1];
        const pdfUrl = URL.createObjectURL(file);

        try {
          const response = await fetch('/api/proposal/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64,
              projectDescription: projectDescription,
              userId: user.id,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Check failed');
          }

          const checkResult = await response.json();
          setResult({
            id: checkResult.id,
            fileName: file.name,
            conversionProbability: checkResult.conversionProbability,
            weakSegments: checkResult.weakSegments,
            recommendations: checkResult.recommendations,
            projectDescription: projectDescription,
            timestamp: new Date(),
          });

          // Store PDF data for viewer
          setFileData(pdfUrl);

          // Update credits
          setCreditsRemaining(creditsRemaining - 1);
          setFile(null);
          setProjectDescription('');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Check failed');
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Get color based on conversion probability
  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-green-400';
    if (probability >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProbabilityBgColor = (probability: number) => {
    if (probability >= 70) return 'bg-green-500/10 border-green-500/30';
    if (probability >= 50) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              Lance Buddy
            </h1>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
              ← Back to Dashboard
            </Link>
            <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold">
              {creditsRemaining} Credits
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!result ? (
          <>
            {/* Header */}
            <div className="mb-16 text-center">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ⭐ Proposal Checker
              </h2>
              <p className="text-xl text-slate-300 mb-2">
                Score Your Proposal Before You Send It
              </p>
              <p className="text-slate-400">
                Upload your proposal PDF and describe the project. We'll analyze your pitch and give you a conversion probability score plus specific improvements.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Upload Section */}
              <div className="md:col-span-2">
                {/* Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-16 text-center transition cursor-pointer mb-8 ${
                    dragActive
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div>
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-2xl font-semibold mb-2">{file.name}</p>
                      <p className="text-slate-400 text-sm mb-6">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => setFile(null)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-7xl mb-4">📤</div>
                      <p className="text-2xl font-semibold mb-2">Drop your proposal here</p>
                      <p className="text-slate-400 mb-8">or</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
                      >
                        Select PDF File
                      </button>
                      <p className="text-slate-500 text-sm mt-4">Maximum 50 MB</p>
                    </div>
                  )}
                </div>

                {/* Project Description */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold mb-3 text-cyan-400">
                    📝 Describe the Project
                  </label>
                  <p className="text-slate-400 text-sm mb-4">
                    Provide a detailed overview of your project so we can generate a more accurate proposal. Include:<br></br><br></br>
                    - Project goals and expected outcomes<br></br>
                    - What problem you're solving<br></br>
                    - Target audience or users<br></br>
                    - Required features and functionality<br></br>
                    - Design, technical, or platform preferences<br></br>
                    - Deliverables and success criteria<br></br>
                    - Timeline, budget, and constraints (if applicable)<br></br><br></br>

                    The more context you provide, the better we can score the proposal.
                    </p>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Example: Client needs a WordPress website for their e-commerce store. 5 product pages, payment integration, and admin dashboard. Timeline: 30 days. Budget: $5,000"
                    className="w-full px-4 py-10 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition resize-none"
                    rows={16}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-8">
                    {error}
                  </div>
                )}

                {file && projectDescription && (
                  <button
                    onClick={handleCheck}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 text-lg"
                  >
                    {loading ? '⏳ Analyzing Proposal...' : '🚀 Score Proposal (1 Credit)'}
                  </button>
                )}
              </div>

              {/* Info Section */}
              <div>
                {/* What We Analyze */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">✅ What We Score</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Conversion probability %</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Weak segments & risks</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Pricing positioning</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Value clarity</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Call-to-action strength</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Specific improvements</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Tips */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">💡 Pro Tips</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-300 mb-1">Be Specific</p>
                      <p className="text-xs text-slate-400">Describe exactly what the client wants. Instead of "website design," write "Design and develop a 5-page e-commerce website with payment integration, mobile responsiveness, and admin dashboard."</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-300 mb-1">Include Constraints</p>
                      <p className="text-xs text-slate-400">Mention expected timeline, estimated budget, scope boundaries, required technologies, preferred communication style, and any delivery expectations.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-300 mb-1">Define Success Clearly</p>
                      <p className="text-xs text-slate-400">Explain what a successful outcome looks like — launch goals, performance targets, conversions, user experience, or business impact.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-blue-500/20">
                    📌 Results stored for 7 days
                  </p>
                </div>

                {/* Scoring Factors */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">📊 How We Score</h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold flex-shrink-0">30%</span>
                      <span>Pricing fit for scope & timeline</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold flex-shrink-0">25%</span>
                      <span>Value clarity & positioning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold flex-shrink-0">20%</span>
                      <span>Specificity & deliverables</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold flex-shrink-0">15%</span>
                      <span>Call-to-action & next steps</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold flex-shrink-0">10%</span>
                      <span>Professional presentation</span>
                    </div>
                  </div>
                </div>

                {/* Common Issues */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">🚨 Common Weak Points</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>Vague deliverables or timeline</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>Price doesn't match scope</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>No clear next steps/CTA</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>Missing project requirements</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>Weak value proposition</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold mb-2">Instant Score</h4>
                <p className="text-sm text-slate-400">Get your conversion probability in seconds</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-bold mb-2">Targeted Feedback</h4>
                <p className="text-sm text-slate-400">Find exactly what's weak in your pitch</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">📈</div>
                <h4 className="font-bold mb-2">Improvement Tips</h4>
                <p className="text-sm text-slate-400">Get specific ways to increase your odds</p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">❓ Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">What should I put in the proposal PDF?</h4>
                  <p className="text-slate-400 text-sm">Your actual proposal - pricing, deliverables, timeline, terms, anything you'd send to a client.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">How long does the scoring take?</h4>
                  <p className="text-slate-400 text-sm">Usually 3-5 seconds depending on proposal length and detail.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">Is the conversion probability guaranteed?</h4>
                  <p className="text-slate-400 text-sm">No - it's an estimate based on proposal patterns and best practices. Your actual results depend on client fit and other factors.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">Can I improve and re-score?</h4>
                  <p className="text-slate-400 text-sm">Yes! Make changes and re-upload. Each check costs 1 credit.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">What if my proposal is very short?</h4>
                  <p className="text-slate-400 text-sm">Short proposals may get a lower score. More detail = better scoring. Consider adding more specifics before you send.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results View - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Analysis Results */}
              <div>
                {/* Conversion Probability Card */}
                <div className={`rounded-2xl p-8 mb-8 border ${getProbabilityBgColor(result.conversionProbability)}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Proposal Score</h3>
                      <p className="text-slate-400 text-sm">Analyzed at {result.timestamp.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold mb-2 ${getProbabilityColor(result.conversionProbability)}`}>
                        {result.conversionProbability}%
                      </div>
                      <div className={`text-sm font-semibold ${getProbabilityColor(result.conversionProbability)}`}>
                        {result.conversionProbability >= 70 ? '🟢 Strong Chance' :
                         result.conversionProbability >= 50 ? '🟡 Moderate Chance' :
                         '🔴 Needs Work'}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-300">
                    {result.conversionProbability >= 70 
                      ? "Your proposal is well-positioned to win. The pricing, value, and positioning are strong. Minor tweaks could boost it even higher."
                      : result.conversionProbability >= 50
                      ? "Your proposal has potential but has some weak spots. Check the segments below and apply the recommendations before sending."
                      : "Your proposal needs work before sending. Review all weak segments and follow the recommendations to significantly improve your odds."}
                  </p>
                </div>

                {/* Project Description Summary */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 mb-8">
                  <h4 className="font-bold mb-3 text-cyan-400">📌 Project Context</h4>
                  <p className="text-slate-300 text-sm">{result.projectDescription}</p>
                </div>

                {/* Weak Segments */}
                {result.weakSegments.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-6">⚠️ Weak Segments ({result.weakSegments.length})</h3>
                    <div className="space-y-4">
                      {result.weakSegments.map((segment, idx) => (
                        <div
                          key={idx}
                          className={`p-6 rounded-lg border ${getSeverityColor(segment.severity)}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`text-2xl flex-shrink-0 ${
                              segment.severity === 'high' ? '🔴' :
                              segment.severity === 'medium' ? '🟡' :
                              '🔵'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-bold mb-1 text-lg">{segment.title}</h4>
                              <p className="text-sm mb-2">{segment.description}</p>
                              <p className="text-xs opacity-80">
                                <strong>Impact:</strong> {segment.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-8">
                    <h3 className="text-2xl font-bold mb-6">💡 How to Improve</h3>
                    <div className="space-y-6">
                      {result.recommendations.map((rec, idx) => (
                        <div key={idx}>
                          <h4 className="font-bold mb-2 text-cyan-300">
                            {idx + 1}. Fix: {rec.segment}
                          </h4>
                          <p className="text-slate-300 text-sm mb-2">{rec.suggestion}</p>
                          <p className="text-xs text-cyan-400">
                            <strong>Expected Impact:</strong> {rec.expectedImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - PDF Viewer using embed */}
              <div>
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg overflow-hidden sticky top-24">
                  <div className="bg-slate-900 p-4 border-b border-slate-700/30">
                    <h3 className="font-bold">📄 Proposal Preview</h3>
                  </div>
                  
                  {fileData && (
                    <div style={{ height: '800px' }}>
                      <embed
                        src={fileData}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                      />
                    </div>
                  )}

                  {!fileData && (
                    <div className="h-96 flex items-center justify-center bg-slate-950 text-slate-400">
                      Loading PDF preview...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setFileData(null);
                  setProjectDescription('');
                }}
                className="py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition text-lg"
              >
                📄 Check Another Proposal
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition text-lg"
              >
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}