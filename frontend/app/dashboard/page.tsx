'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PaymentModal from '@/components/PaymentModal';

interface User {
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface RecentScan {
  id: string;
  fileName: string;
  date: string;
  scanDate: Date;
  status: 'completed' | 'pending' | 'failed';
  riskLevel: 'high' | 'medium' | 'low';
  credits: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Week navigation
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  // Mock scan data
  const generateMockScans = () => {
    const today = new Date();
    return [
      { id: '1', fileName: 'Client_Contract_2024.pdf', date: 'Today', scanDate: new Date(today), status: 'completed' as const, riskLevel: 'medium' as const, credits: 1 },
      { id: '2', fileName: 'Service_Agreement.pdf', date: 'Today', scanDate: new Date(today.getTime() - 2*60*60*1000), status: 'completed' as const, riskLevel: 'low' as const, credits: 1 },
      { id: '3', fileName: 'NDA_Draft.pdf', date: 'Today', scanDate: new Date(today.getTime() - 4*60*60*1000), status: 'completed' as const, riskLevel: 'high' as const, credits: 1 },
      { id: '4', fileName: 'Partnership_Terms.pdf', date: 'Yesterday', scanDate: new Date(today.getTime() - 24*60*60*1000), status: 'completed' as const, riskLevel: 'high' as const, credits: 1 },
      { id: '5', fileName: 'Freelance_Agreement.pdf', date: 'Yesterday', scanDate: new Date(today.getTime() - 30*60*60*1000), status: 'completed' as const, riskLevel: 'low' as const, credits: 1 },
      { id: '6', fileName: 'Vendor_Contract.pdf', date: '2 days ago', scanDate: new Date(today.getTime() - 48*60*60*1000), status: 'completed' as const, riskLevel: 'medium' as const, credits: 1 },
      { id: '7', fileName: 'Employment_Contract.pdf', date: '2 days ago', scanDate: new Date(today.getTime() - 50*60*60*1000), status: 'completed' as const, riskLevel: 'low' as const, credits: 1 },
      { id: '8', fileName: 'Lease_Agreement.pdf', date: '3 days ago', scanDate: new Date(today.getTime() - 72*60*60*1000), status: 'completed' as const, riskLevel: 'medium' as const, credits: 1 },
      { id: '9', fileName: 'Service_Level_Agreement.pdf', date: '3 days ago', scanDate: new Date(today.getTime() - 74*60*60*1000), status: 'completed' as const, riskLevel: 'low' as const, credits: 1 },
      { id: '10', fileName: 'Confidentiality_Agreement.pdf', date: '4 days ago', scanDate: new Date(today.getTime() - 96*60*60*1000), status: 'completed' as const, riskLevel: 'high' as const, credits: 1 },
    ];
  };

  const [allScans] = useState<RecentScan[]>(generateMockScans());

  // Helper: Get week end
  const getWeekEnd = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  // Helper: Check if current week
  const isCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    return selectedWeekStart.toDateString() === currentWeekStart.toDateString();
  };

  // Filter scans for selected week
  const getScansForWeek = () => {
    const weekEnd = getWeekEnd(selectedWeekStart);
    return allScans.filter(scan => 
      scan.scanDate >= selectedWeekStart && scan.scanDate <= weekEnd
    );
  };

  const weekScans = getScansForWeek();

  // Calculate risk distribution
  const getRiskDistribution = () => {
    const totalScans = weekScans.length;
    if (totalScans === 0) {
      return [
        { name: 'No data', value: 100, count: 0, percentage: 0, color: '#64748b' },
      ];
    }

    const highRiskCount = weekScans.filter(s => s.riskLevel === 'high').length;
    const mediumRiskCount = weekScans.filter(s => s.riskLevel === 'medium').length;
    const lowRiskCount = weekScans.filter(s => s.riskLevel === 'low').length;

    return [
      { 
        name: 'Low Risk', 
        value: lowRiskCount, 
        count: lowRiskCount,
        percentage: Math.round((lowRiskCount / totalScans) * 100),
        color: '#10b981' 
      },
      { 
        name: 'Medium Risk', 
        value: mediumRiskCount, 
        count: mediumRiskCount,
        percentage: Math.round((mediumRiskCount / totalScans) * 100),
        color: '#f59e0b' 
      },
      { 
        name: 'High Risk', 
        value: highRiskCount, 
        count: highRiskCount,
        percentage: Math.round((highRiskCount / totalScans) * 100),
        color: '#ef4444' 
      },
    ];
  };

  // Get scans per week
  const getScansPerWeek = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dateMap: { [key: string]: number } = {};

    days.forEach(day => {
      dateMap[day] = 0;
    });

    weekScans.forEach(scan => {
      const dayOfWeek = scan.scanDate.getDay();
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
      dateMap[dayName]++;
    });

    return days.map(day => ({ day, scans: dateMap[day] }));
  };

  const scansPerWeek = getScansPerWeek();
  const riskDistribution = getRiskDistribution();

  // Navigation functions
  const goToPreviousWeek = () => {
    setSelectedWeekStart(new Date(selectedWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNextWeek = () => {
    if (!isCurrentWeek()) {
      setSelectedWeekStart(new Date(selectedWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  // Fetch user and credits
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        setUser({
          email: currentUser.email || '',
          user_metadata: currentUser.user_metadata as any,
        });

        // Fetch credits from Supabase (or use mock data for now)
        setCreditsRemaining(12);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePaymentSuccess = (newCredits: number) => {
    setCreditsRemaining(newCredits);
  };

  // Check for redirect with payment modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'true') {
      setPaymentModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const weekEndDate = getWeekEnd(selectedWeekStart);
  const weekRange = `${selectedWeekStart.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Lance Buddy
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Credits:</span>
              <span className="text-lg text-cyan-400 font-semibold">{creditsRemaining}</span>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="ml-2 w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition flex items-center justify-center text-cyan-300 font-bold"
                title="Add credits"
              >
                +
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-2">Welcome back, {userName}! 👋</h2>
          <p className="text-slate-400">Here's what's happening with your contracts today.</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full border-2 border-blue-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{userName}</p>
                <p className="text-slate-400">{user?.email}</p>
                <p className="text-sm text-cyan-400 mt-1">📊 {allScans.length} Contracts Analyzed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-cyan-400">{creditsRemaining}</p>
              <p className="text-slate-400 text-sm">Credits Available</p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="mb-8 flex items-center justify-between bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
          <button
            onClick={goToPreviousWeek}
            className="px-6 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition"
          >
            ← Previous Week
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold">{weekRange}</p>
            {isCurrentWeek() && <p className="text-sm text-cyan-400 mt-1">📅 Current Week</p>}
          </div>
          <button
            onClick={goToNextWeek}
            disabled={isCurrentWeek()}
            className={`px-6 py-2 rounded-lg transition ${
              isCurrentWeek()
                ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
            }`}
          >
            Next Week →
          </button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Scans This Week */}
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6">Scans This Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scansPerWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6">Risk Distribution</h3>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={350} minWidth={450}>
                <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, payload }) => `${name}: ${payload.count} (${payload.percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value, name, props) => [
                      `${props.payload.count} scans (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Access Tools */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => router.push('/contract-scanner')}
              className="p-6 bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-500/30 rounded-lg hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 transition text-left group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">🔍</div>
              <h4 className="font-bold mb-2">Contract Scanner</h4>
              <p className="text-sm text-slate-400">Scan & analyze contracts</p>
            </button>

            <button
              onClick={() => router.push('/proposal-checker')}
              className="p-6 bg-gradient-to-br from-cyan-900/40 to-slate-800/40 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition text-left group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">📊</div>
              <h4 className="font-bold mb-2">Proposal Checker</h4>
              <p className="text-sm text-slate-400">Score your proposals</p>
            </button>

            <button
              onClick={() => router.push('/document-generator')}
              className="p-6 bg-gradient-to-br from-purple-900/40 to-slate-800/40 border border-purple-500/30 rounded-lg hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition text-left group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">✍️</div>
              <h4 className="font-bold mb-2">Document Generator</h4>
              <p className="text-sm text-slate-400">Generate documents</p>
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="p-6 bg-gradient-to-br from-emerald-900/40 to-slate-800/40 border border-emerald-500/30 rounded-lg hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition text-left group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">⚙️</div>
              <h4 className="font-bold mb-2">Settings</h4>
              <p className="text-sm text-slate-400">Manage your account</p>
            </button>
          </div>
        </div>

        {/* Recent Scans */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Recent Scans - {weekScans.length} this week</h3>
          {weekScans.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-12 text-center">
              <p className="text-slate-400">No scans for this week yet</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/30">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">File Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Risk Level</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekScans.map((scan) => (
                      <tr key={scan.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                        <td className="px-6 py-4 text-sm">{scan.fileName}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{scan.scanDate.toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            scan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            scan.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {scan.status === 'completed' ? '✓ Completed' :
                             scan.status === 'pending' ? '⏳ Pending' :
                             '✗ Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            scan.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                            scan.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {scan.riskLevel === 'high' ? '🔴 High' :
                             scan.riskLevel === 'medium' ? '🟡 Medium' :
                             '🟢 Low'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-cyan-400 font-semibold">{scan.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}