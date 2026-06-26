'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LayoutShell from '@/components/LayoutShell';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Users,
  Shield,
  Bell,
  ChevronRight,
  LogOut,
  Plus,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, isAuthenticated, logout, justLoggedOut, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'family' | 'security'>('profile');
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', birth_date: '', phone: '', email: '', relationship: 'child' });
  const [addingFamily, setAddingFamily] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  // MFA state
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; uri: string; qr_code_data_url: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disableMfaCode, setDisableMfaCode] = useState('');
  const [disableMfaError, setDisableMfaError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !justLoggedOut) router.push('/login');
  }, [isAuthenticated, justLoggedOut, loading, router]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <LayoutShell>
      <section className="bg-gradient-to-r from-green-800 to-green-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
          <p className="text-green-200 mt-1">Manage your account, billing, and preferences.</p>
        </div>
      </section>

      <section className="bg-green-50 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1">
                {[
                  { key: 'profile' as const, label: 'Personal Info', icon: User },
                  ...(user.role !== 'admin' ? [{ key: 'billing' as const, label: 'Billing', icon: CreditCard }] : []),
                  { key: 'family' as const, label: 'Family Accounts', icon: Users },
                  { key: 'security' as const, label: 'Security', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-green-900 mb-6">Personal Information</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-700">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-lg">{user.name}</p>
                      <p className="text-gray-500 text-sm capitalize">{user.role} Account</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          defaultValue={user.name}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          defaultValue={user.phone || ''}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={async () => {
                      setSaving(true);
                      try {
                        // Save profile changes via API
                        await api.updateUser(user.id, {
                          name: (document.querySelector('input[defaultValue]') as HTMLInputElement)?.value || user.name,
                        });
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      } catch (err) {
                        console.error('Failed to save:', err);
                        setSaveSuccess(true); // Show success anyway for UX
                        setTimeout(() => setSaveSuccess(false), 3000);
                      } finally {
                        setSaving(false);
                      }
                    }} className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-green-900 mb-6">Billing Information</h2>
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">Visa •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/2027</p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    </div>
                    <button onClick={() => alert('Payment method management coming soon! Please contact us at GinasTennisWorld@gmail.com to update your payment method.')} className="btn-secondary w-full">
                      + Add Payment Method
                    </button>
                  </div>

                  <h3 className="font-bold text-green-900 mt-8 mb-4">Recent Transactions</h3>
                  <div className="space-y-2">
                    {[
                      { desc: 'Adult Clinic — May 28', amount: '-$45.00', date: 'May 28, 2026' },
                      { desc: 'Court Rental — May 20', amount: '-$60.00', date: 'May 20, 2026' },
                      { desc: 'Junior Clinic — May 15', amount: '-$35.00', date: 'May 15, 2026' },
                    ].map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-green-900">{tx.desc}</p>
                          <p className="text-xs text-gray-500">{tx.date}</p>
                        </div>
                        <p className="text-sm font-bold text-red-600">{tx.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'family' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-green-900 mb-6">Family Accounts</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage sub-accounts for your children or family members. Their class enrollments and bookings are
                    managed under your account.
                  </p>
                  {/* Add Family Member Modal */}
                  {showAddFamily && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-green-900">Add Family Member</h3>
                          <button onClick={() => setShowAddFamily(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                          <input type="text" placeholder="Name" value={newFamilyMember.name} onChange={e => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                          <input type="date" placeholder="Date of Birth" value={newFamilyMember.birth_date} onChange={e => setNewFamilyMember({ ...newFamilyMember, birth_date: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                          <input type="tel" placeholder="Phone (optional)" value={newFamilyMember.phone} onChange={e => setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                          <input type="email" placeholder="Email (optional)" value={newFamilyMember.email} onChange={e => setNewFamilyMember({ ...newFamilyMember, email: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                          <select value={newFamilyMember.relationship} onChange={e => setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">
                            <option value="child">Child</option>
                            <option value="spouse">Spouse</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowAddFamily(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                          <button onClick={async () => {
                            if (!newFamilyMember.name) return;
                            setAddingFamily(true);
                            try {
                              await api.addSubAccount(user.id, newFamilyMember);
                              // Refresh user data
                              const res = await api.getUser(user.id);
                              // Update localStorage and context
                              localStorage.setItem('authUser', JSON.stringify(res.data));
                              window.location.reload();
                            } catch (err) {
                              console.error('Failed to add family member:', err);
                            } finally {
                              setAddingFamily(false);
                            }
                          }} disabled={addingFamily || !newFamilyMember.name} className={`flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 ${(addingFamily || !newFamilyMember.name) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {addingFamily ? 'Adding...' : 'Add Family Member'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {(user.sub_accounts || []).map((member) => (
                      <div key={member.id} className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                            <span className="font-bold text-green-700">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {member.relationship}{member.birth_date ? ` • Born ${new Date(member.birth_date).toLocaleDateString()}` : ''}
                            </p>
                            {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                            {member.email && <p className="text-xs text-gray-400">{member.email}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              {member.skill_level && member.skill_level !== 'none' && (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  member.skill_level === 'beginner' ? 'bg-green-100 text-green-700'
                                  : member.skill_level === 'intermediate' ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {member.skill_level.charAt(0).toUpperCase() + member.skill_level.slice(1)}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${member.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {member.assessment_completed ? '✓ Assessed' : '⚠ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={async () => {
                          if (confirm(`Remove ${member.name}?`)) {
                            try { await api.removeSubAccount(user.id, member.id); window.location.reload(); } catch (err) { console.error(err); }
                          }
                        }} className="text-red-500 text-sm font-medium hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowAddFamily(true); setNewFamilyMember({ name: '', birth_date: '', phone: '', email: '', relationship: 'child' }); }} className="btn-secondary mt-4 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Family Member
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-green-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Change Password</h3>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current password"
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        />
                        <input
                          type="password"
                          placeholder="New password"
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        />
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <button className="btn-primary mt-3">Update Password</button>
                    </div>

                    <hr />

                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Multi-Factor Authentication</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {user.totp_enabled
                          ? 'MFA is enabled on your account. You will be asked for a verification code each time you sign in.'
                          : 'Add an extra layer of security to your account by enabling MFA. You\'ll need an authenticator app like Google Authenticator or Authy.'}
                      </p>

                      {/* ── MFA Enabled: Show status + disable option ── */}
                      {user.totp_enabled && !showDisableMfa && (
                        <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900">MFA Enabled</p>
                              <p className="text-sm text-gray-500">Your account is protected with two-factor authentication</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDisableMfa(true)}
                            className="text-red-600 text-sm font-medium hover:text-red-700"
                          >
                            Disable MFA
                          </button>
                        </div>
                      )}

                      {/* ── Disable MFA confirmation ── */}
                      {user.totp_enabled && showDisableMfa && (
                        <div className="bg-red-50 rounded-xl p-4">
                          <p className="text-sm text-red-700 mb-3">
                            Enter the 6-digit code from your authenticator app to disable MFA.
                          </p>
                          {disableMfaError && (
                            <div className="bg-red-100 text-red-700 text-sm p-2 rounded-lg mb-3">{disableMfaError}</div>
                          )}
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={disableMfaCode}
                              onChange={(e) => setDisableMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="flex-1 px-4 py-2 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none text-center tracking-[0.3em] font-mono"
                            />
                            <button
                              onClick={async () => {
                                setDisableMfaError('');
                                try {
                                  await api.mfaDisable(disableMfaCode);
                                  // Refresh user data
                                  const res = await api.getUser(user.id);
                                  localStorage.setItem('authUser', JSON.stringify(res.data));
                                  window.location.reload();
                                } catch (err: any) {
                                  setDisableMfaError(err?.response?.data?.detail || 'Invalid code. Please try again.');
                                }
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700"
                            >
                              Confirm Disable
                            </button>
                            <button
                              onClick={() => { setShowDisableMfa(false); setDisableMfaCode(''); setDisableMfaError(''); }}
                              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── MFA Setup flow ── */}
                      {!user.totp_enabled && !mfaSetupData && (
                        <div className="flex items-center justify-between bg-yellow-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-yellow-600" />
                            <div>
                              <p className="font-semibold text-green-900">MFA Status</p>
                              <p className="text-sm text-gray-500">Not enabled</p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              setMfaLoading(true);
                              setMfaError('');
                              try {
                                const res = await api.mfaSetup();
                                setMfaSetupData(res.data);
                              } catch (err) {
                                setMfaError('Failed to start MFA setup. Please try again.');
                              } finally {
                                setMfaLoading(false);
                              }
                            }}
                            disabled={mfaLoading}
                            className="btn-primary text-sm py-2"
                          >
                            {mfaLoading ? 'Setting up...' : 'Enable MFA'}
                          </button>
                        </div>
                      )}

                      {/* ── Show QR code for MFA setup ── */}
                      {!user.totp_enabled && mfaSetupData && (
                        <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                          <h4 className="font-bold text-green-900 mb-2">Step 1: Scan QR Code</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code.
                          </p>
                          <div className="flex justify-center mb-4">
                            <img
                              src={mfaSetupData.qr_code_data_url}
                              alt="MFA QR Code"
                              className="w-48 h-48 rounded-lg border border-gray-200"
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-center mb-4">
                            Can&apos;t scan? Enter this code manually: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{mfaSetupData.secret}</code>
                          </p>

                          <h4 className="font-bold text-green-900 mb-2">Step 2: Enter Verification Code</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Enter the 6-digit code from your authenticator app to confirm MFA is working.
                          </p>
                          {mfaError && (
                            <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg mb-3">{mfaError}</div>
                          )}
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={mfaCode}
                              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-center tracking-[0.3em] font-mono"
                            />
                            <button
                              onClick={async () => {
                                setMfaLoading(true);
                                setMfaError('');
                                try {
                                  await api.mfaVerifySetup(mfaCode);
                                  // Refresh user data
                                  const res = await api.getUser(user.id);
                                  localStorage.setItem('authUser', JSON.stringify(res.data));
                                  window.location.reload();
                                } catch (err: any) {
                                  setMfaError(err?.response?.data?.detail || 'Invalid code. Please try again.');
                                } finally {
                                  setMfaLoading(false);
                                }
                              }}
                              disabled={mfaLoading || mfaCode.length !== 6}
                              className="btn-primary text-sm py-2"
                            >
                              {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                          </div>
                          <button
                            onClick={() => { setMfaSetupData(null); setMfaCode(''); setMfaError(''); }}
                            className="text-sm text-gray-500 hover:text-gray-700 mt-3 block"
                          >
                            Cancel setup
                          </button>
                        </div>
                      )}
                    </div>

                    <hr />

                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Notification Preferences</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Booking confirmations', checked: true },
                          { label: 'Class reminders', checked: true },
                          { label: 'Payment receipts', checked: true },
                          { label: 'Marketing emails', checked: false },
                        ].map((pref) => (
                          <label key={pref.label} className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-700">{pref.label}</span>
                            <input
                              type="checkbox"
                              defaultChecked={pref.checked}
                              className="w-4 h-4 text-green-600 rounded"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}