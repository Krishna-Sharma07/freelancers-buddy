'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              Lance Buddy
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-slate-400 hover:text-white transition">Home</Link>
            <Link href="/service" className="text-cyan-400">Services</Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white transition">Pricing</Link>
            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-6xl font-bold mb-6 leading-tight">
          Three Tools to <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Protect Your Contracts</span>
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          Lance Buddy gives you superpowers for contract management. Scan for risks, score proposals, and generate documents — all powered by AI.
        </p>
      </section>

      {/* Service 1: Contract Scanner */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-700/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-4xl font-bold mb-6">Contract Scanner</h3>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Upload any PDF contract and Lance Buddy instantly analyzes it for risks, unfavorable clauses, and hidden red flags. Our AI scans payment terms, liability clauses, scope definitions, and more — surfacing issues before you sign.
            </p>
            
            <h4 className="text-xl font-semibold mb-4 text-cyan-400">What It Catches:</h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Payment Risks:</strong> Unclear payment terms, long payment windows, missing milestones</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Liability Issues:</strong> Unlimited liability, indemnification clauses, IP ownership disputes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Scope Creep:</strong> Undefined deliverables, vague timelines, endless revision rights</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Legal Traps:</strong> Non-compete clauses, confidentiality overreach, dispute resolution issues</span>
              </li>
            </ul>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-slate-300">
                <strong className="text-blue-300">Real Example:</strong> A freelancer almost agreed to "unlimited revision rights" on a ₹5,000 project until the Scanner caught it. That single phrase could have meant 50+ revisions for the same price.
              </p>
            </div>

            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Try Contract Scanner
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/20 border border-blue-500/20 rounded-2xl p-12 flex flex-col items-center justify-center">
            <div className="text-7xl mb-6">🔍</div>
            <h4 className="text-2xl font-bold text-center mb-4">Scan In 60 Seconds</h4>
            <p className="text-slate-400 text-center mb-8">
              Upload → Analyze → Get Results
            </p>
            <div className="w-full bg-slate-700/30 rounded-lg p-6">
              <p className="text-sm text-slate-300 text-center font-mono">
                📄 PDF Upload<br/>
                ⏳ AI Analysis (30s)<br/>
                ⚠️ Risk Report<br/>
                💾 Full Breakdown
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service 2: Proposal Checker */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-700/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="bg-gradient-to-br from-cyan-900/20 to-slate-800/20 border border-cyan-500/20 rounded-2xl p-12 flex flex-col items-center justify-center order-2 lg:order-1">
            <div className="text-7xl mb-6">📊</div>
            <h4 className="text-2xl font-bold text-center mb-4">Score Your Pitch</h4>
            <p className="text-slate-400 text-center mb-8">
              See before you send
            </p>
            <div className="w-full bg-slate-700/30 rounded-lg p-6">
              <p className="text-sm text-slate-300 text-center font-mono">
                ✍️ Your Proposal<br/>
                🤖 AI Scoring<br/>
                📈 Conversion % Chance<br/>
                💡 Improvement Tips
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h3 className="text-4xl font-bold mb-6">Proposal Checker</h3>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Before hitting send, run your proposal through our AI. Get a real conversion probability score based on pricing, positioning, and how compelling your pitch is. Find weak spots and fix them immediately.
            </p>
            
            <h4 className="text-xl font-semibold mb-4 text-cyan-400">What It Scores:</h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Pricing Confidence:</strong> Is your rate competitive and justified?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Value Clarity:</strong> Does the client understand what they're getting?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Call-to-Action Strength:</strong> Is your next step clear?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Problem-Solution Fit:</strong> Does your pitch address their pain?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Overall Conversion Probability:</strong> % chance of landing this project</span>
              </li>
            </ul>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-slate-300">
                <strong className="text-cyan-300">Real Impact:</strong> Freelancers improve conversion rates by 40% after using Proposal Checker to refine their pitches based on AI feedback.
              </p>
            </div>

            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
            >
              Score Your Proposal
            </button>
          </div>
        </div>
      </section>

      {/* Service 3: Document Generator */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-700/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-4xl font-bold mb-6">Document Generator</h3>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Stop copying and pasting old contracts. Generate legally-sound contract documents from scratch in minutes. Customize for your industry and get a document that protects you.
            </p>
            
            <h4 className="text-xl font-semibold mb-4 text-purple-400">What You Can Generate:</h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Service Agreements:</strong> Clear deliverables, payment terms, timelines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>NDAs & Confidentiality:</strong> Protect sensitive information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Proposal Templates:</strong> Professional, customizable proposals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>IP Ownership Clauses:</strong> Clarify who owns what</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300"><strong>Retainer Agreements:</strong> For ongoing client relationships</span>
              </li>
            </ul>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-slate-300 mb-4">
                <strong className="text-purple-300">Customizable:</strong> All documents are AI-generated but fully customizable. Add your terms, adjust language, and export as DOCX or PDF.
              </p>
              <p className="text-sm text-slate-300">
                <strong className="text-purple-300">Document Storage:</strong> Documents are stored for 3 days by default. Choose to keep them longer (up to 10 days with Pro, or lifetime with Professional) based on your plan.
              </p>
            </div>

            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
            >
              Generate a Contract
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-slate-800/20 border border-purple-500/20 rounded-2xl p-12 flex flex-col items-center justify-center">
            <div className="text-7xl mb-6">✍️</div>
            <h4 className="text-2xl font-bold text-center mb-4">Create in Minutes</h4>
            <p className="text-slate-400 text-center mb-8">
              No lawyer needed
            </p>
            <div className="w-full bg-slate-700/30 rounded-lg p-6">
              <p className="text-sm text-slate-300 text-center font-mono">
                📋 Choose Template<br/>
                ✏️ Answer 5 Questions<br/>
                🤖 AI Generates<br/>
                📥 Download (DOCX/PDF)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-700/30">
        <h3 className="text-4xl font-bold text-center mb-12">When to Use Each Service</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span> Contract Scanner
            </h4>
            <p className="text-slate-300 mb-6">Use when:</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>✓ Client sends you a contract</li>
              <li>✓ You're signing anything important</li>
              <li>✓ You want to spot hidden risks</li>
              <li>✓ You need negotiation ammo</li>
            </ul>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-8">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span> Proposal Checker
            </h4>
            <p className="text-slate-300 mb-6">Use when:</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>✓ Before sending a proposal</li>
              <li>✓ You want to improve odds</li>
              <li>✓ Testing different pricing</li>
              <li>✓ Refining your pitch</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-8">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">✍️</span> Document Generator
            </h4>
            <p className="text-slate-300 mb-6">Use when:</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>✓ You need a new contract</li>
              <li>✓ Starting a new client relationship</li>
              <li>✓ Setting up retainers</li>
              <li>✓ Protecting your IP</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-700/30 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Protect Your Contracts?</h3>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Get started with 3 free credits. Scan your first contract, score a proposal, or generate a document risk-free.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/50 transition"
        >
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12 flex justify-between items-center">
          <p className="text-slate-400">Lance Buddy © 2026 — AI Contract Protection for Freelancers</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-slate-400 hover:text-white transition">Pricing</Link>
            <a href="#" className="text-slate-400 hover:text-white transition">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}