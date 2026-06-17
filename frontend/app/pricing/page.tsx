'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const router = useRouter();

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      credits: 3,
      description: 'Perfect for trying it out',
      storage: '3 days',
      features: [
        '3 credits (one-time)',
        'Use for any service',
        '3-day document storage',
        '7-day scan/check results',
        'Basic risk report',
        'Email support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Standard',
      price: '₹2,500',
      credits: 15,
      description: 'For regular freelancers',
      storage: '10 days',
      features: [
        '15 credits (one-time)',
        'Use for any service',
        '10-day document storage (+7 days)',
        '7-day scan/check results',
        'Detailed risk reports',
        'Document templates',
        'Priority email support',
      ],
      cta: 'Buy Now',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '₹8,000',
      credits: 50,
      description: 'Most popular for active freelancers',
      storage: '13 days',
      features: [
        '50 credits (one-time)',
        'Use for any service',
        '13-day document storage (+10 days)',
        '7-day scan/check results',
        'Advanced AI analysis',
        'Document library (30+)',
        'Priority support',
        'Negotiation tips included',
      ],
      cta: 'Most Popular',
      highlighted: true,
    },
    {
      name: 'Professional',
      price: '₹15,000',
      credits: 100,
      description: 'For high-volume freelancers',
      storage: 'Lifetime',
      features: [
        '100 credits (one-time)',
        'Use for any service',
        'Lifetime document storage',
        '7-day scan/check results',
        'Enterprise-grade analysis',
        'Full document suite',
        '24/7 priority support',
        'Custom integrations',
        'Personal success manager',
      ],
      cta: 'Buy Now',
      highlighted: false,
    },
  ];

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
            <Link href="/pricing" className="text-cyan-400">Pricing</Link>
            
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
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          Simple, Transparent <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Pricing</span>
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4">
          Buy credits once and use them forever. One credit = one scan, one proposal check, or one document generation.
        </p>
        <p className="text-lg text-cyan-400 font-semibold">
          💰 No recurring charges. No expiring credits. No hidden fees.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-cyan-400/50 shadow-xl shadow-cyan-500/20 lg:scale-105'
                  : 'bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-sm font-bold">
                  ⭐ Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.credits !== 3 && (
                    <span className="text-slate-400">one-time</span>
                  )}
                </div>
                <div className="text-cyan-400 font-semibold text-sm">
                  {plan.credits} credits (never expire)
                </div>
              </div>

              {/* Storage Info */}
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Document Storage:</strong> {plan.storage}
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => router.push('/auth')}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features List */}
              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <span className="text-green-400 mt-1 flex-shrink-0">✓</span>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-900/50 py-20 px-6 border-y border-slate-700/30">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold mb-12 text-center">How Credits Work</h3>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-8 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-xl font-bold mb-4">Contract Scanner</h4>
              <p className="text-slate-300 mb-4">
                Upload a PDF and scan for risks
              </p>
              <p className="text-cyan-400 font-bold">1 credit per scan</p>
              <p className="text-slate-400 text-sm mt-2">
                Results stored for 7 days
              </p>
            </div>

            <div className="p-8 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-bold mb-4">Proposal Checker</h4>
              <p className="text-slate-300 mb-4">
                Score and improve your proposal
              </p>
              <p className="text-cyan-400 font-bold">1 credit per check</p>
              <p className="text-slate-400 text-sm mt-2">
                Results stored for 7 days
              </p>
            </div>

            <div className="p-8 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <div className="text-4xl mb-4">✍️</div>
              <h4 className="text-xl font-bold mb-4">Document Generator</h4>
              <p className="text-slate-300 mb-4">
                Generate a contract template
              </p>
              <p className="text-cyan-400 font-bold">1 credit per document</p>
              <p className="text-slate-400 text-sm mt-2">
                Storage duration based on plan
              </p>
            </div>
          </div>

          <div className="p-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <h4 className="text-lg font-bold mb-4 text-cyan-400">📌 Important: Document Storage</h4>
            <p className="text-slate-300 mb-4">
              When you generate a document, you'll see a 3-day default storage notification. You can choose to keep it longer based on your plan:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>• <strong>Free:</strong> Maximum 3 days</li>
              <li>• <strong>Standard:</strong> Up to 10 days (3 + 7 day extension)</li>
              <li>• <strong>Pro:</strong> Up to 13 days (3 + 10 day extension)</li>
              <li>• <strong>Professional:</strong> Lifetime storage</li>
            </ul>
            <p className="text-slate-400 text-sm mt-4">
              ℹ️ Your storage limit is determined by your most recent purchase. Scan and proposal check results are stored for 7 days regardless of plan.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="px-6 py-4 text-left font-semibold">Feature</th>
                <th className="px-6 py-4 text-center font-semibold">Free</th>
                <th className="px-6 py-4 text-center font-semibold">Standard</th>
                <th className="px-6 py-4 text-center font-semibold">Pro</th>
                <th className="px-6 py-4 text-center font-semibold">Professional</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Credits</td>
                <td className="px-6 py-4 text-center">3</td>
                <td className="px-6 py-4 text-center">15</td>
                <td className="px-6 py-4 text-center font-bold text-cyan-400">50</td>
                <td className="px-6 py-4 text-center">100</td>
              </tr>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Credits Expiry</td>
                <td className="px-6 py-4 text-center text-green-400">Never</td>
                <td className="px-6 py-4 text-center text-green-400">Never</td>
                <td className="px-6 py-4 text-center text-green-400">Never</td>
                <td className="px-6 py-4 text-center text-green-400">Never</td>
              </tr>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Document Storage</td>
                <td className="px-6 py-4 text-center">3 days</td>
                <td className="px-6 py-4 text-center">10 days</td>
                <td className="px-6 py-4 text-center">13 days</td>
                <td className="px-6 py-4 text-center text-green-400">Lifetime</td>
              </tr>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Scan/Check Results</td>
                <td className="px-6 py-4 text-center">7 days</td>
                <td className="px-6 py-4 text-center">7 days</td>
                <td className="px-6 py-4 text-center">7 days</td>
                <td className="px-6 py-4 text-center">7 days</td>
              </tr>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Risk Reports</td>
                <td className="px-6 py-4 text-center">Basic</td>
                <td className="px-6 py-4 text-center">Detailed</td>
                <td className="px-6 py-4 text-center">Advanced</td>
                <td className="px-6 py-4 text-center">Enterprise</td>
              </tr>
              <tr className="border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-6 py-4 text-slate-300">Support</td>
                <td className="px-6 py-4 text-center">Email</td>
                <td className="px-6 py-4 text-center">Priority</td>
                <td className="px-6 py-4 text-center">Priority</td>
                <td className="px-6 py-4 text-center text-green-400">24/7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-900/50 py-20 px-6 border-y border-slate-700/30">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h3>
          
          <div className="space-y-6">
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">Do credits expire?</h4>
              <p className="text-slate-300">
                No! Your credits never expire. Buy them once and use them whenever you want.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">Can I upgrade my plan?</h4>
              <p className="text-slate-300">
                Absolutely. Buy more credits anytime. Your storage limit updates to your most recent purchase tier.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">How long are my documents stored?</h4>
              <p className="text-slate-300">
                By default, documents are stored for 3 days. You can choose to keep them longer (up to your plan limit) or delete them anytime. Your storage limit is based on your most recent purchase.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">What about my scan/check results?</h4>
              <p className="text-slate-300">
                Scan and proposal check results are stored for 7 days for all users, regardless of plan. This gives you time to review, download, or share the results.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">Is there a money-back guarantee?</h4>
              <p className="text-slate-300">
                30-day satisfaction guarantee. If you're not happy, we'll refund your purchase, no questions asked.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-cyan-400">Do uploaded PDFs get stored?</h4>
              <p className="text-slate-300">
                No. The PDF you upload for scanning is deleted immediately after we process it. Only your AI results are stored for 7 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Protect Your Contracts?</h3>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Start with 3 free credits. Scan a contract, check a proposal, or generate a document. No payment required.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="px-10 py-4 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/50 transition"
        >
          Get Your Free 3 Credits
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12 flex justify-between items-center">
          <p className="text-slate-400">Lance Buddy © 2026 — AI Contract Protection for Freelancers</p>
          <div className="flex gap-6">
            <Link href="/service" className="text-slate-400 hover:text-white transition">Services</Link>
            <a href="#" className="text-slate-400 hover:text-white transition">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}