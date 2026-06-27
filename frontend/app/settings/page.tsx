'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Copy, Check, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'referral' | 'payment' | 'usage'>('profile');
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiryDate: '', cvv: '', nameOnCard: '' });
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      nameOnCard: 'Krishna Singh',
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      type: 'Visa',
      isDefault: true,
    },
  ]);
  const [paymentMessage, setPaymentMessage] = useState('');

  // Referral data from API
  const [referralData, setReferralData] = useState({
    referralLink: '',
    referralCode: '',
    totalReferred: 0,
    completedReferred: 0,
    pendingReferred: 0,
    creditsEarned: 0,
    referrals: [],
  });
  const [referralLoading, setReferralLoading] = useState(false);

  // Mock usage data
  const [usageData, setUsageData] = useState({
    scannerUsage: 12,
    proposalCheckerUsage: 8,
    documentGeneratorUsage: 5,
    refinementUsage: 3,
    totalUsed: 28,
    creditsRemaining: 22,
    totalPurchased: 50,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: creditData } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();
          setCreditsRemaining(creditData?.credits || 0);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch referral data (code + stats)
  useEffect(() => {
    const fetchReferralData = async () => {
      if (activeTab !== 'referral') return; // Only fetch when referral tab is active

      setReferralLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch referral code
        const codeResponse = await fetch('/api/referrals/generate-code', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const codeData = await codeResponse.json();

        // Fetch referral stats
        const statsResponse = await fetch('/api/referrals/get-stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const statsData = await statsResponse.json();

        if (codeData.success && statsData.success) {
          setReferralData({
            referralLink: codeData.referral_url,
            referralCode: codeData.code,
            totalReferred: statsData.stats.total_referrals,
            completedReferred: statsData.stats.completed_referrals,
            pendingReferred: statsData.stats.pending_referrals,
            creditsEarned: statsData.stats.total_credits_earned,
            referrals: statsData.referrals.map((ref: any) => ({
              id: ref.id,
              status: ref.status,
              referred_at: ref.referred_at,
              expiresIn: ref.expiresIn,
              creditsAwarded: ref.credits_awarded,
            })),
          });
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setReferralLoading(false);
      }
    };

    fetchReferralData();
  }, [activeTab]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword.trim()) {
      setPasswordMessage('Please enter a new password');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordMessage('✓ Password changed successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage('');
      }, 2000);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call API route instead of admin API
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.nameOnCard) {
      setPaymentMessage('Please fill in all payment details');
      return;
    }

    // Determine card type from first digit
    let cardType = 'Card';
    if (paymentForm.cardNumber.startsWith('4')) cardType = 'Visa';
    else if (paymentForm.cardNumber.startsWith('5')) cardType = 'Mastercard';
    else if (paymentForm.cardNumber.startsWith('3')) cardType = 'AmEx';

    // Create new payment method with unique timestamp-based ID
    const newPaymentMethod = {
      id: Date.now(),
      nameOnCard: paymentForm.nameOnCard,
      cardNumber: paymentForm.cardNumber,
      expiryDate: paymentForm.expiryDate,
      type: cardType,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setPaymentMessage('✓ Payment method added successfully');

    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '', nameOnCard: '' });
      setPaymentMessage('');
    }, 2000);
  };

  const handleRemovePaymentMethod = (id: number) => {
    if (paymentMethods.length === 1) {
      alert('You must have at least one payment method');
      return;
    }

    const updatedMethods = paymentMethods.filter((method) => method.id !== id);

    if (paymentMethods.find((m) => m.id === id)?.isDefault) {
      updatedMethods[0].isDefault = true;
    }

    setPaymentMethods(updatedMethods);
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'referral', label: '🔗 Referral', icon: '🔗' },
    { id: 'payment', label: '💳 Payment', icon: '💳' },
    { id: 'usage', label: '📊 Usage', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ⚙️ Settings
          </h2>
          <p className="text-slate-400">Manage your profile, referrals, payments, and usage</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-12 flex gap-4 border-b border-slate-700/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Profile Information</h3>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                    <div className="px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-white">
                      {user?.email || 'No email'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">User ID</label>
                    <div className="px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-white font-mono text-sm truncate">
                      {user?.id || 'No ID'}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Account Created</label>
                    <div className="px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-white">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Account Status</label>
                    <div className="px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-lg text-green-400 font-semibold">
                      ✓ Active
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Account Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition"
                >
                  Change Password
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-semibold transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REFERRAL TAB */}
        {activeTab === 'referral' && (
          <div className="space-y-8">
            {referralLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading referral data...</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-4 text-cyan-400">Your Referral Link</h3>
                  <p className="text-slate-300 mb-6">
                    Share your unique link with friends. When they sign up and make their first purchase, you both get credits!
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={referralData.referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{referralData.totalReferred}</div>
                    <p className="text-slate-400 text-sm">Total Referrals</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{referralData.completedReferred}</div>
                    <p className="text-slate-400 text-sm">Completed (Paid)</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">{referralData.pendingReferred}</div>
                    <p className="text-slate-400 text-sm">Pending (48h)</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{referralData.creditsEarned}</div>
                    <p className="text-slate-400 text-sm">Credits Earned</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-4 text-cyan-400">Referral Tiers</h3>
                  <p className="text-slate-400 mb-6">Earn more credits as you refer more people:</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">First 3 Referrals</p>
                        <p className="text-sm text-slate-400">1 credit per referral</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">1×</div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Referrals 4–7</p>
                        <p className="text-sm text-slate-400">2 credits per referral</p>
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">2×</div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">8+ Referrals</p>
                        <p className="text-sm text-slate-400">3 credits per referral</p>
                      </div>
                      <div className="text-2xl font-bold text-green-400">3×</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-6 text-cyan-400">Recent Referrals</h3>
                  <div className="space-y-3">
                    {referralData.referrals.length > 0 ? (
                      referralData.referrals.map((ref: any) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-700/50"
                        >
                          <div>
                            <p className="font-semibold text-white">User {ref.id.slice(0, 8)}</p>
                            <p className="text-xs text-slate-500">
                              {ref.status === 'completed' ? `Referred ${new Date(ref.referred_at).toLocaleDateString()}` : `Referred ${new Date(ref.referred_at).toLocaleDateString()} • Expires in ${ref.expiresIn}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${ref.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {ref.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                            </div>
                            <div className="text-cyan-400 font-semibold">+{ref.creditsAwarded} credits</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-8">No referrals yet. Share your link to get started!</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'payment' && (
          <div className="space-y-8">
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Saved Payment Methods</h3>
              
              {paymentMethods.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-lg flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-3">
                        <div className="text-2xl">💳</div>
                        <div>
                          <p className="font-semibold">{method.type} •••• {method.cardNumber.slice(-4)}</p>
                          <p className="text-sm text-slate-400">{method.nameOnCard} • Expires {method.expiryDate}</p>
                        </div>
                        {method.isDefault && (
                          <span className="ml-auto px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-400">
                            Default
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="ml-4 px-4 py-2 text-red-400 hover:text-red-300 text-sm font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 mb-8">No payment methods saved yet</p>
              )}

              <h3 className="text-lg font-bold mb-4 text-cyan-400">Add New Payment Method</h3>
              <p className="text-slate-400 mb-6">Add a new payment method for purchasing credits</p>
              
              <div className="space-y-4">
                <div 
                  onClick={() => setShowPaymentModal(true)}
                  className="p-6 border-2 border-dashed border-slate-700 rounded-lg text-center hover:border-cyan-500/50 transition cursor-pointer"
                >
                  <div className="text-4xl mb-3">➕</div>
                  <p className="font-semibold mb-2">Add Payment Method</p>
                  <p className="text-sm text-slate-400">Credit card, Debit card, or UPI</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Billing History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Credits</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-06-20</td>
                      <td className="py-3 px-4">Pro</td>
                      <td className="py-3 px-4">50</td>
                      <td className="py-3 px-4">₹8,000</td>
                      <td className="py-3 px-4"><span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">Paid</span></td>
                    </tr>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-05-15</td>
                      <td className="py-3 px-4">Standard</td>
                      <td className="py-3 px-4">15</td>
                      <td className="py-3 px-4">₹2,500</td>
                      <td className="py-3 px-4"><span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USAGE TAB */}
        {activeTab === 'usage' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{creditsRemaining}</div>
                <p className="text-slate-400 text-sm">Credits Remaining</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{usageData.totalUsed}</div>
                <p className="text-slate-400 text-sm">Credits Used</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-slate-300 mb-2">{usageData.totalPurchased}</div>
                <p className="text-slate-400 text-sm">Total Purchased</p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Usage Breakdown</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Contract Scanner</span>
                    <span className="text-cyan-400">{usageData.scannerUsage} credits</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full"
                      style={{ width: `${(usageData.scannerUsage / usageData.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Proposal Checker</span>
                    <span className="text-blue-400">{usageData.proposalCheckerUsage} credits</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(usageData.proposalCheckerUsage / usageData.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Document Generator</span>
                    <span className="text-purple-400">{usageData.documentGeneratorUsage} credits</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${(usageData.documentGeneratorUsage / usageData.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Refinements</span>
                    <span className="text-green-400">{usageData.refinementUsage} credits</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${(usageData.refinementUsage / usageData.totalUsed) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Usage History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Feature</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Credits</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-06-26</td>
                      <td className="py-3 px-4">Document Generator</td>
                      <td className="py-3 px-4">-1</td>
                      <td className="py-3 px-4 text-slate-400">Generated invoice</td>
                    </tr>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-06-25</td>
                      <td className="py-3 px-4">Contract Scanner</td>
                      <td className="py-3 px-4">-1</td>
                      <td className="py-3 px-4 text-slate-400">Scanned NDA</td>
                    </tr>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-06-24</td>
                      <td className="py-3 px-4">Document Generator</td>
                      <td className="py-3 px-4">-2</td>
                      <td className="py-3 px-4 text-slate-400">Generated contract + 1 refinement</td>
                    </tr>
                    <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">2024-06-20</td>
                      <td className="py-3 px-4">Purchase</td>
                      <td className="py-3 px-4">+50</td>
                      <td className="py-3 px-4 text-slate-400">Pro plan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS - Password, Delete, Payment */}
      {/* (All modals remain the same - unchanged) */}
      
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-cyan-400">Change Password</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-400">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-400">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                />
              </div>
            </div>

            {passwordMessage && (
              <div className={`mb-6 p-3 rounded-lg text-sm ${passwordMessage.includes('✓') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {passwordMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-2 text-red-400">⚠️ Delete Account</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. All your data, credits, and documents will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-cyan-400">Add Payment Method</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-400">Name on Card</label>
                <input
                  type="text"
                  value={paymentForm.nameOnCard}
                  onChange={(e) => setPaymentForm({ ...paymentForm, nameOnCard: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-400">Card Number</label>
                <input
                  type="text"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-400">Expiry Date</label>
                  <input
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setPaymentForm({ ...paymentForm, expiryDate: value });
                    }}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-400">CVV</label>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                💳 Payment information is secure. We do not store your card details.
              </p>
            </div>

            {paymentMessage && (
              <div className={`mb-6 p-3 rounded-lg text-sm ${paymentMessage.includes('✓') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {paymentMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition"
              >
                Add Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}