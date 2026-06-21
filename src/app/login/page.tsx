'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && user) {
    const path = user.role === 'admin' ? '/admin' : '/customer';
    router.push(path);
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    if (success) {
      // AuthContext stores the user — redirect based on role
      const path = email.includes('admin') || email.includes('gina') ? '/admin' : '/customer';
      router.push(path);
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  const quickLogin = async (role: 'customer' | 'admin') => {
    const emails = {
      customer: 'john@example.com',
      admin: 'gina@ginastennisworld.com',
    };
    const passwords = {
      customer: 'customer123',
      admin: 'admin123',
    };
    setIsLoading(true);
    setEmail(emails[role]);
    setPassword(passwords[role]);
    const success = await login(emails[role], passwords[role]);
    if (success) {
      const path = role === 'admin' ? '/admin' : '/customer';
      router.push(path);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4">
            <img
              src="/Logo.png"
              alt="Gina's Tennis World"
              className="w-full h-full object-cover"
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

        {/* Demo Quick Login */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-green-200 text-sm text-center mb-4 font-medium">
            🎾 Demo — Quick Login As:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin('customer')}
              className="bg-white/20 hover:bg-yellow-500 hover:text-green-900 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all"
            >
              👤 Customer
            </button>
            <button
              onClick={() => quickLogin('admin')}
              className="bg-white/20 hover:bg-yellow-500 hover:text-green-900 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}