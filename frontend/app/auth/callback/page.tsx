'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          throw authError;
        }

        if (data?.session) {
          // Check for redirect parameter
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');

          if (redirect === 'pricing') {
            router.push('/pricing?redirect=pricing');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError('No session found. Please try logging in again.');
          setTimeout(() => router.push('/auth'), 3000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('Authentication failed. Redirecting...');
        setTimeout(() => router.push('/auth'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg text-slate-300">Completing sign in...</p>
          </>
        ) : error ? (
          <>
            <p className="text-lg text-red-400 mb-4">{error}</p>
            <p className="text-sm text-slate-400">Redirecting to login...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}