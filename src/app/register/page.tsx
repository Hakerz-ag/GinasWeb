'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual',
    agreeTerms: false,
  });
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async () => {
    setError('');
    try {
      await api.register(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.phone,
        formData.password,
        formData.birth_date || undefined
      );
      setSubmitted(true);
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-10 shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-3">Registration Submitted!</h2>
          <p className="text-gray-600 mb-2">
            Your account registration is pending admin approval.
          </p>

          {/* Assessment notice */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-left">
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 text-sm">Next Step: Book Your Assessment</p>
                <p className="text-yellow-700 text-xs mt-1">
                  Before you can join any classes, you&apos;ll need to complete a 1-on-1 assessment
                  with Gina. This helps us place you at the right skill level. Once your account is
                  approved, you can book your assessment from your dashboard.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-4 mb-6">
            Approval usually takes 1-2 business days.
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-green-300 hover:text-yellow-400 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="mt-4">
            <div className="mx-auto mb-3">
              <img src="/Logo.png" alt="Gina's Tennis World" className="h-16 w-auto mx-auto rounded-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white">Register</h1>
            <p className="text-green-300 mt-1">Join Gina's Tennis World — parents/guardians register first and add family members later</p>
          </div>
        </div>

        {/* Assessment notice banner */}
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-200 text-xs">
              <strong>Important:</strong> All new students must complete a 1-on-1 assessment with Gina
              before enrolling in classes. This helps us place you at the right skill level.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Steps */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-10 h-0.5 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-green-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="(908) 555-0123" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth <span className="text-xs text-gray-400">(optional)</span></label>
                <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary">Next: Account Type</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-green-900 mb-4">Account Type & Family</h2>
              <div className="space-y-3">
                {[
                  { value: 'individual', label: 'Individual', desc: 'Standard account for one person' },
                  { value: 'family', label: 'Family / Guardian', desc: 'Parent or guardian account; add family members later after approval' },
                ].map((option) => (
                  <button key={option.value} onClick={() => setFormData({ ...formData, accountType: option.value })} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${formData.accountType === option.value ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                    <p className="font-semibold text-green-900">{option.label}</p>
                    <p className="text-gray-500 text-sm">{option.desc}</p>
                  </button>
                ))}
              </div>

              {formData.accountType === 'family' && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-semibold mb-3">
                    👨‍👩‍👧‍👦 Family / Guardian Registration
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    Register as the parent or guardian responsible for this account. After your account is approved,
                    you can add children or other family members from Settings &gt; Family Accounts.
                  </p>
                  <p className="text-xs text-yellow-700">
                    Each family member will still need their own assessment before joining classes.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Next: Security</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-green-900 mb-4">Set Password & Confirm</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="Create a password" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" placeholder="Confirm your password" />
              </div>

              {/* Assessment reminder */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>📋 Remember:</strong> After your account is approved, you&apos;ll need to book a
                  1-on-1 assessment with Gina before you can enroll in any classes. This helps us
                  place you at the right skill level.
                </p>
              </div>

              <label className="flex items-start gap-3 mt-4">
                <input type="checkbox" checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} className="mt-1 w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <button type="button" onClick={() => setShowTerms(true)} className="text-green-600 font-semibold hover:text-green-700 underline">
                    terms and conditions
                  </button>{' '}
                  and understand that my registration is subject to admin approval, and that I must complete a 1-on-1 assessment before enrolling in classes.
                </span>
              </label>

              {/* Terms & Conditions Modal */}
              {showTerms && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-green-900">Terms & Conditions</h3>
                      <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-3">
                      <p><strong>1. Registration & Approval</strong><br />All registrations are subject to admin approval. You will be notified once your account has been reviewed and approved.</p>
                      <p><strong>2. Assessment Requirement</strong><br />All new students must complete a 1-on-1 assessment with Gina before enrolling in any classes. This helps us place you at the appropriate skill level.</p>
                      <p><strong>3. Payment & Cancellation</strong><br />Payment is due at the time of booking or enrollment. Cancellations must be made at least 24 hours in advance for a full refund. No-shows are non-refundable.</p>
                      <p><strong>4. Court Rentals</strong><br />Court rentals are available on a first-come, first-served basis. 30-week contracts guarantee your weekly time slot. Open time rentals are subject to availability.</p>
                      <p><strong>5. Conduct & Safety</strong><br />All players and guests must follow facility rules and conduct themselves respectfully. Gina&apos;s Tennis World reserves the right to refuse service or remove anyone who violates these rules.</p>
                      <p><strong>6. Liability</strong><br />Participants play at their own risk. Gina&apos;s Tennis World is not liable for personal injuries sustained during play or instruction.</p>
                      <p><strong>7. Privacy</strong><br />We respect your privacy. Personal information collected during registration is used solely for account management and communication about our programs.</p>
                      <p><strong>8. Changes to Terms</strong><br />Gina&apos;s Tennis World reserves the right to update these terms at any time. Continued use of our services constitutes acceptance of any changes.</p>
                    </div>
                    <button onClick={() => setShowTerms(false)} className="mt-6 w-full btn-primary">I Understand</button>
                  </div>
                </div>
              )}
              <div className="pt-4 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
                <button onClick={handleSubmit} disabled={!formData.agreeTerms} className={`btn-yellow ${!formData.agreeTerms ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  Submit Registration
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 font-semibold hover:text-green-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}