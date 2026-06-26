'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, isAuthenticated, user, mfaPending, verifyMFA } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && user) {
    const path = user.role === 'admin' ? '/admin' : '/customer';
    router.replace(path);
    return null;
  }

  // ── MFA verification step ──────────────────────────────────────────────
  if (mfaPending) {
    const handleMFAVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setMfaError('');
      setMfaLoading(true);

      const verifiedUser = await verifyMFA(mfaCode);
      if (verifiedUser) {
        const path = verifiedUser.role === 'admin' ? '/admin' : '/customer';
        router.push(path);
      } else {
        setMfaError('Invalid verification code. Please try again.');
      }
      setMfaLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
            <p className="text-green-300 mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {mfaError && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-4">{mfaError}</div>
            )}

            <form onSubmit={handleMFAVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code.
                </p>
              </div>

              <button
                type="submit"
                disabled={mfaLoading || mfaCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {mfaLoading ? 'Verifying...' : 'Verify'}
                {!mfaLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loggedInUser = await login(email, password);
    if (loggedInUser) {
      // Use the returned user data directly — avoids race condition with React state
      const path = loggedInUser.role === 'admin' ? '/admin' : '/customer';
      router.push(path);
    } else {
      // If mfaPending was set, the MFA form will be shown automatically
      // Only show error if it's not an MFA redirect
      if (!mfaPending) {
        setError('Invalid credentials. Please try again.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img
              src="/GTW Logo-2.jpg"
              alt="Gina's Tennis World"
              className="h-20 w-auto mx-auto rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-green-300 mt-1">Sign in to Gina's Tennis World</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-green-600 hover:text-green-700 font-medium">
              Forgot your password?
            </button>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-green-900 mb-2">Reset Your Password</h3>
                {forgotSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-green-700 font-medium">Password reset email sent!</p>
                    <p className="text-gray-500 text-sm mt-1">Check your inbox for instructions to reset your password.</p>
                    <button onClick={() => { setShowForgotPassword(false); setForgotSent(false); }} className="mt-4 btn-primary">Back to Sign In</button>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-4">Enter your email address and we&apos;ll send you a link to reset your password.</p>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none mb-4" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowForgotPassword(false)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium">Cancel</button>
                      <button onClick={async () => {
                        try {
                          await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
                        } catch (err) { /* ignore errors for now */ }
                        setForgotSent(true);
                      }} disabled={!forgotEmail.trim()} className={`flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 ${!forgotEmail.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>Send Reset Link</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-4">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-green-600 font-semibold hover:text-green-700">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* No demo credentials in production — users must register */}
        <div className="mt-6 text-center">
          <p className="text-green-200/60 text-xs">
            🎒 New here?{' '}
            <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}