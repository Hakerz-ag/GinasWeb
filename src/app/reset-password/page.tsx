'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have the required params
    if (!token || !email) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token, email]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword(email, token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to reset password. The link may have expired.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid or missing token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
            <p className="text-green-300 mt-2">This password reset link is invalid or has expired.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <p className="text-gray-600 mb-6">
              Please request a new password reset link from the login page.
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2">
              Back to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
            <p className="text-green-300 mt-2">Your password has been successfully changed.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <p className="text-gray-600 mb-6">
              You can now sign in with your new password.
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img
              src="/HGIghew.jpg"
              alt="Gina's Tennis World"
              className="h-20 w-auto mx-auto rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
          <p className="text-green-300 mt-1">Enter your new password below</p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className={`btn-primary w-full flex items-center justify-center gap-2 ${(!newPassword || !confirmPassword || newPassword !== confirmPassword) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/login" className="text-sm text-green-600 hover:text-green-700 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}