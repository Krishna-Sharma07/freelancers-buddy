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
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              Lance Buddy
            </h1>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link href="/" className="text-slate-400 hover:text-white transition">Home</Link>
            <Link href="/service" className="text-slate-400 hover:text-white transition">Services</Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white transition">Pricing</Link>
            
            <Link
              href="/auth"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="space-y-6 mb-12">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold">
            🚀 Building in Public
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold leading-tight">
            You're Losing <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">₹50,000+</span> to Bad Contracts
          </h2>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            "Unlimited revisions" clause eats 10+ hours. Vague payment terms delay payment 60 days. Liability clause puts ₹1,00,000+ at risk. Lance Buddy catches these in 60 seconds before you sign.
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
                <span className="text-red-400 font-bold">❌ "Payment upon completion"</span>
                <br />
                You finish work. Client pays 60-90 days later. Your rent is due now. ₹1,644+ lost in cash flow.
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ "Unlimited liability"</span>
                <br />
                One bug in your code = you pay all damages. A client sued a freelancer for ₹50,000 over a typo.
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ "Unlimited revisions"</span>
                <br />
                "One more small change." 50 revisions later, you've worked 40 unpaid hours. ₹50,000+ down the drain.
              </p>
            </div>
            
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-red-500/30 transition">
              <p className="text-lg text-slate-300">
                <span className="text-red-400 font-bold">❌ No proposal strategy</span>
                <br />
                Send 20 proposals. Win 1. Competitors send smarter proposals. They get the ₹2,50,000 contract instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold mb-12 text-center">How Lance Buddy Protects You</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contract Scanner */}
            <div className="p-8 bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-2xl font-bold mb-3">Scan & Catch Traps</h4>
              <p className="text-slate-300 mb-4">
                Upload any contract. AI finds the clauses that will cost you money in 60 seconds.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Spots vague payment terms (before you get stuck waiting)</li>
                <li>✅ Finds liability traps (before you owe ₹50,000+)</li>
                <li>✅ Catches unlimited revision clauses (before 40 unpaid hours)</li>
                <li>✅ Flags unfair IP ownership (before losing your code)</li>
              </ul>
            </div>

            {/* Proposal Scorer */}
            <div className="p-8 bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-2xl font-bold mb-3">Win More Proposals</h4>
              <p className="text-slate-300 mb-4">
                Score your proposal before sending. Know your real win chances before wasting time.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Win probability % (stop sending weak proposals)</li>
                <li>✅ 8-factor competitive analysis (see what's missing)</li>
                <li>✅ Specific improvements to make (fix them before sending)</li>
                <li>✅ Beat competitors with smarter proposals (win ₹2,50,000+ deals)</li>
              </ul>
            </div>

            {/* Document Generator */}
            <div className="p-8 bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/30 rounded-lg hover:border-purple-400/50 transition">
              <div className="text-4xl mb-4">✍️</div>
              <h4 className="text-2xl font-bold mb-3">Generate Safe Documents</h4>
              <p className="text-slate-300 mb-4">
                Stop writing contracts from scratch. Generate fair, legally-sound documents in seconds.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ Freelancer-friendly contract templates (protect yourself first)</li>
                <li>✅ Professional proposals that win (with built-in win factors)</li>
                <li>✅ Invoices that get paid faster (set clear payment terms)</li>
                <li>✅ All ready to send immediately (no delays)</li>
              </ul>
            </div>

            {/* Secure Storage */}
            <div className="p-8 bg-gradient-to-br from-green-900/30 to-slate-900/30 border border-green-500/30 rounded-lg hover:border-green-400/50 transition">
              <div className="text-4xl mb-4">💾</div>
              <h4 className="text-2xl font-bold mb-3">Organize & Protect</h4>
              <p className="text-slate-300 mb-4">
                Keep all contracts safe in one place. Find any contract in seconds when you need it.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✅ End-to-end encrypted (no one sees your contracts)</li>
                <li>✅ Auto-delete after agreed days (your privacy, protected)</li>
                <li>✅ Quick search & access (find contracts in seconds)</li>
                <li>✅ Zero tracking (your data stays yours)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="bg-slate-900/50 py-20 px-6 border-y border-slate-700/30">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-8">One Caught Clause Pays for a Year</h3>
          
          <div className="p-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <p className="text-2xl text-slate-200 mb-8 font-semibold">
              Real freelancers. Real money saved.
            </p>
            
            <div className="space-y-5 text-slate-300">
              <div className="text-left p-4 border-l-4 border-green-500">
                <p className="font-bold text-lg">Caught: "Payment upon completion" → 90 days delayed</p>
                <p className="text-green-400">You negotiate: Net 15 instead. Get paid ₹1,644 earlier ✓</p>
              </div>
              
              <div className="text-left p-4 border-l-4 border-green-500">
                <p className="font-bold text-lg">Caught: Unlimited liability clause</p>
                <p className="text-green-400">You cap it at ₹50,000. Sleep without fear of ₹1,00,000+ lawsuits ✓</p>
              </div>
              
              <div className="text-left p-4 border-l-4 border-green-500">
                <p className="font-bold text-lg">Caught: "Unlimited revisions" → 40 unpaid hours</p>
                <p className="text-green-400">You limit to 3 rounds. Save 10+ hours (₹50,000+) per project ✓</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700/30 py-12 px-6 text-center text-slate-400">
        <p className="mb-4">Lance Buddy © 2026</p>
        <p className="text-sm">AI Contract Protection for Freelancers</p>
        <p className="text-xs mt-4">
          <a href="#" className="hover:text-slate-300">Privacy</a>
          <span className="mx-2">•</span>
          <a href="#" className="hover:text-slate-300">Terms</a>
          <span className="mx-2">•</span>
          <a href="#" className="hover:text-slate-300">Contact</a>
        </p>
      </footer>
    </div>
  );
}