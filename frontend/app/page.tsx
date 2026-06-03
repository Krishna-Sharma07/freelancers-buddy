'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Email submitted:', email);
      setSubmitted(true);
      setEmail('');
      
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Freelancer's Buddy
          </h1>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="space-y-6 mb-12">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold">
            🚀 Building in Public
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold leading-tight">
            Stop Signing <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Bad Contracts</span>
          </h2>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            AI-powered contract protection for freelancers. Catch risky clauses in 60 seconds. Score proposals before you send. Generate documents instantly.
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Joining...' : 'Get Early Access'}
            </button>
          </div>
          
          {submitted && (
            <p className="mt-4 text-green-400 font-semibold animate-pulse">
              ✅ Thanks! Check your email for updates.
            </p>
          )}
        </form>

        {/* Social Proof */}
        <div className="text-slate-400 text-sm">
          Join 100+ freelancers getting early access
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-900/50 py-20 px-6 border-y border-slate-700/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold mb-12 text-center">The Problem</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ Vague payment terms</span>
                <br />
                "Payment upon completion" - But when exactly? 30 days? 90 days?
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ Unlimited liability</span>
                <br />
                One mistake = you pay unlimited damages. Hundreds of thousands at risk.
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ Scope creep</span>
                <br />
                "Unlimited revisions" clause = endless unpaid work. ₹50,000+ lost easily.
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ Weak proposals</span>
                <br />
                Send proposals without knowing win probability. Lose deals constantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold mb-12 text-center">How Freelancer's Buddy Helps</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contract Scanner */}
            <div className="p-8 bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-2xl font-bold mb-3">Contract Scanner</h4>
              <p className="text-slate-300 mb-4">
                Upload any contract. Get instant risk analysis in 60 seconds.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Flags risky payment terms</li>
                <li>✅ Identifies liability traps</li>
                <li>✅ Catches scope creep clauses</li>
                <li>✅ Highlights IP ownership issues</li>
              </ul>
            </div>

            {/* Proposal Scorer */}
            <div className="p-8 bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-2xl font-bold mb-3">Proposal Scorer</h4>
              <p className="text-slate-300 mb-4">
                Score your proposal before sending. Get a win probability rating.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Win probability percentage</li>
                <li>✅ 8-factor breakdown analysis</li>
                <li>✅ Actionable recommendations</li>
                <li>✅ Improve your chances instantly</li>
              </ul>
            </div>

            {/* Document Generator */}
            <div className="p-8 bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/30 rounded-lg hover:border-purple-400/50 transition">
              <div className="text-4xl mb-4">✍️</div>
              <h4 className="text-2xl font-bold mb-3">Document Generator</h4>
              <p className="text-slate-300 mb-4">
                Generate professional contracts, proposals, and invoices instantly.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Smart contract generation</li>
                <li>✅ Professional proposal templates</li>
                <li>✅ Auto-generated invoices</li>
                <li>✅ Ready-to-send PDFs</li>
              </ul>
            </div>

            {/* Secure Storage */}
            <div className="p-8 bg-gradient-to-br from-green-900/30 to-slate-900/30 border border-green-500/30 rounded-lg hover:border-green-400/50 transition">
              <div className="text-4xl mb-4">💾</div>
              <h4 className="text-2xl font-bold mb-3">Secure Storage</h4>
              <p className="text-slate-300 mb-4">
                Keep all your documents safe and organized in one place.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ End-to-end encryption</li>
                <li>✅ Auto-delete after 3-10 days</li>
                <li>✅ Quick access anytime</li>
                <li>✅ Zero privacy concerns</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="bg-slate-900/50 py-20 px-6 border-y border-slate-700/30">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-8">Real ROI</h3>
          
          <div className="p-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <p className="text-xl text-slate-300 mb-6">
              One caught risky clause = Tool pays for itself <span className="text-green-400 font-bold">10x over</span>
            </p>
            
            <div className="space-y-4 text-slate-400">
              <p>Vague payment terms caught → Get paid 60 days earlier → ₹1,644+ saved</p>
              <p>Unlimited liability removed → Avoid ₹50,000+ liability → Priceless</p>
              <p>Scope creep prevented → Save 10+ hours of work → ₹50,000+ saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700/30 py-12 px-6 text-center text-slate-400">
        <p className="mb-4">Freelancer's Buddy © 2026</p>
        <p className="text-sm">Built by a freelancer. For freelancers.</p>
        <p className="text-xs mt-4">
          <a href="#" className="hover:text-slate-300">Privacy</a> • 
          <a href="#" className="hover:text-slate-300"> Terms</a> • 
          <a href="#" className="hover:text-slate-300"> Contact</a>
        </p>
      </footer>
    </div>
  );
}