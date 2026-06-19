'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ScanResult {
  id: string;
  fileName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  summary: string;
  risks: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  timestamp: Date;
}

export default function ContractScanner() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null); // Store PDF data for viewer
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
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

  const handleScan = async () => {
    if (!file) {
      setError('Please select a file');
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
          const response = await fetch('/api/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64,
              userId: user.id,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Scan failed');
          }

          const scanResult = await response.json();
          setResult({
            id: scanResult.id,
            fileName: file.name,
            riskLevel: scanResult.riskLevel,
            riskScore: scanResult.riskScore,
            summary: scanResult.summary,
            risks: scanResult.risks,
            timestamp: new Date(),
          });

          // Store PDF data for viewer
          setFileData(pdfUrl);

          // Update credits
          setCreditsRemaining(creditsRemaining - 1);
          setFile(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Scan failed');
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
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🔍 Contract Scanner
              </h2>
              <p className="text-xl text-slate-300 mb-2">
                AI-Powered Risk Analysis for Your Contracts
              </p>
              <p className="text-slate-400">
                Upload any contract PDF and get instant insights into potential risks and red flags
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
                      <p className="text-2xl font-semibold mb-2">Drop your contract here</p>
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

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-8">
                    {error}
                  </div>
                )}

                {file && (
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 text-lg"
                  >
                    {loading ? '⏳ Analyzing Contract...' : '🚀 Scan Contract (1 Credit)'}
                  </button>
                )}
              </div>

              {/* Info Section */}
              <div>
                {/* What We Check */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">✅ What We Analyze</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Liability clauses</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>IP rights & ownership</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Payment terms</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Termination clauses</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Confidentiality terms</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>Dispute resolution</span>
                    </li>
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">💡 Pro Tip</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    Our AI identifies red flags and risks. Always have a lawyer review important contracts before signing.
                  </p>
                  <p className="text-xs text-slate-400">
                    Results are stored for 7 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold mb-2">Instant Analysis</h4>
                <p className="text-sm text-slate-400">Get detailed risk analysis in seconds, not hours</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">🤖</div>
                <h4 className="font-bold mb-2">AI-Powered</h4>
                <p className="text-sm text-slate-400">Advanced AI trained on thousands of contracts</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h4 className="font-bold mb-2">Private & Secure</h4>
                <p className="text-sm text-slate-400">Your contracts are never stored or shared</p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">❓ Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">What file formats are supported?</h4>
                  <p className="text-slate-400 text-sm">We currently support PDF files up to 50 MB in size.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">How long does the scan take?</h4>
                  <p className="text-slate-400 text-sm">Most contracts are analyzed in 2-5 seconds depending on file size and complexity.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">Is this a replacement for legal advice?</h4>
                  <p className="text-slate-400 text-sm">No. Our scanner identifies potential risks, but always consult with a lawyer for important contracts.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">How much does a scan cost?</h4>
                  <p className="text-slate-400 text-sm">Each scan costs 1 credit. Buy credits once and use them anytime.</p>
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
                {/* Risk Summary Card */}
                <div className={`rounded-2xl p-8 mb-8 border ${
                  result.riskLevel === 'high'
                    ? 'bg-red-500/10 border-red-500/30'
                    : result.riskLevel === 'medium'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Scan Results</h3>
                      <p className="text-slate-400 text-sm">Scanned at {result.timestamp.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold mb-2 ${
                        result.riskLevel === 'high' ? 'text-red-400' :
                        result.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {result.riskScore}%
                      </div>
                      <div className={`text-sm font-semibold ${
                        result.riskLevel === 'high' ? 'text-red-400' :
                        result.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {result.riskLevel === 'high' ? '🔴 High Risk' :
                         result.riskLevel === 'medium' ? '🟡 Medium Risk' :
                         '🟢 Low Risk'}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-300">{result.summary}</p>
                </div>

                {/* Identified Risks */}
                {result.risks.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-6">⚠️ Identified Risks ({result.risks.length})</h3>
                    <div className="space-y-4">
                      {result.risks.map((risk, idx) => (
                        <div
                          key={idx}
                          className={`p-6 rounded-lg border cursor-pointer transition hover:shadow-lg ${
                            risk.severity === 'high'
                              ? 'bg-red-500/10 border-red-500/30 hover:shadow-red-500/20'
                              : risk.severity === 'medium'
                              ? 'bg-yellow-500/10 border-yellow-500/30 hover:shadow-yellow-500/20'
                              : 'bg-blue-500/10 border-blue-500/30 hover:shadow-blue-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`text-3xl flex-shrink-0 ${
                              risk.severity === 'high' ? '🔴' :
                              risk.severity === 'medium' ? '🟡' :
                              '🔵'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-bold mb-2 text-lg">{risk.title}</h4>
                              <p className="text-slate-300 text-sm">{risk.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-4">💼 Recommendations</h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex gap-3">
                      <span className="text-blue-400 flex-shrink-0">✓</span>
                      <span>Review all identified risks with a legal professional</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-400 flex-shrink-0">✓</span>
                      <span>Negotiate unfavorable terms before signing</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-400 flex-shrink-0">✓</span>
                      <span>Keep a copy of the signed contract for your records</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - PDF Viewer using embed */}
              <div>
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg overflow-hidden sticky top-24">
                  <div className="bg-slate-900 p-4 border-b border-slate-700/30">
                    <h3 className="font-bold">📄 Document Preview</h3>
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
                }}
                className="py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition text-lg"
              >
                📄 Scan Another Contract
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