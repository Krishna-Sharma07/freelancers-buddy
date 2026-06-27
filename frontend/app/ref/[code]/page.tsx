'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function ReferralLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code } = use(params);

  useEffect(() => {
    // Validate code format (should be USER + 8 alphanumeric)
    const isValidCode = /^USER[A-Z0-9]{8}$/.test(code.toUpperCase());

    if (!isValidCode) {
      // Invalid code format, redirect to home
      router.push('/');
      return;
    }

    // Redirect to auth page with referral code as query parameter
    router.push(`/auth?ref=${code.toUpperCase()}`);
  }, [code, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to sign up...</p>
      </div>
    </div>
  );
}