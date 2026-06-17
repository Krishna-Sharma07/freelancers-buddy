'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        // Supabase signup
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Signup failed');
          setLoading(false);
          return;
        }

        // Show pending verification state
        setSuccess('Account created! Check your email to verify.');
        setPendingVerification(true);
        setVerificationEmail(email);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Supabase login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Login failed');
          setLoading(false);
          return;
        }

        setSuccess('Login successful!');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Supabase Google OAuth
      const response = await fetch('/api/auth/google', {
        method: 'POST',
      });

      if (!response.ok) {
        setError('Google auth failed');
        return;
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError('Google auth error. Please try again.');
      console.error(err);
    }
  };

  // Pending Verification State
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
                Lance Buddy
              </h1>
            </Link>
          </div>
        </nav>

        {/* Verification Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="inline-block p-4 bg-green-500/20 border border-green-500/30 rounded-full mb-6">
                <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold mb-4">Verify Your Email</h2>
              <p className="text-slate-400 text-lg">
                We've sent a verification link to:<br />
                <span className="text-blue-400 font-semibold">{verificationEmail}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg mb-8 text-left">
              <h3 className="font-semibold text-slate-300 mb-4">What's next?</h3>
              <ol className="space-y-3 text-slate-400 text-sm">
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Check your email inbox for the verification link</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Click the link to confirm your email</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Return here and sign in with your credentials</span>
                </li>
              </ol>
            </div>

            {/* Back to Login Button */}
            <button
              onClick={() => {
                setPendingVerification(false);
                setVerificationEmail('');
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Back to Sign In
            </button>

            {/* Check Email Link */}
            <p className="mt-6 text-slate-400 text-sm">
              Don't see the email?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition font-semibold">
                Check spam folder
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              Lance Buddy
            </h1>
          </Link>
          <div className="text-sm text-slate-400">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </div>
        </div>
      </nav>

      {/* Auth Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">
              {isSignUp ? 'Start Protecting Your Contracts' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400">
              {isSignUp 
                ? 'Join freelancers protecting themselves' 
                : 'Sign in to your Lance Buddy account'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-700/30">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccess('');
              }}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                !isSignUp
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccess('');
              }}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                isSignUp
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition"
              />
            </div>

            {/* Confirm Password Input (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleAuth}
            className="w-full py-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 hover:bg-slate-700/50 transition flex items-center justify-center gap-3 text-white font-semibold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-slate-400">
            {!isSignUp && (
              <>
                <p className="mb-4">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-blue-400 hover:text-blue-300 transition font-semibold"
                  >
                    Sign up
                  </button>
                </p>
                <p>
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                    Forgot your password?
                  </a>
                </p>
              </>
            )}
            {isSignUp && (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-400 hover:text-blue-300 transition font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Privacy/Terms */}
          <p className="mt-6 text-xs text-slate-500 text-center">
            By signing up, you agree to our{' '}
            <a href="#" className="text-slate-400 hover:text-slate-300">
              Terms
            </a>
            {' '}and{' '}
            <a href="#" className="text-slate-400 hover:text-slate-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}