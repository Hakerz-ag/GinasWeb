'use client';

import LayoutShell from '@/components/LayoutShell';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { api, ClassOut, SubAccountOut } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, Users, DollarSign, ChevronRight, Filter, AlertTriangle, CheckCircle, X, Baby, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SEASON_LABELS: Record<string, string> = {
  winter: '❄️ Winter',
  spring: '🌸 Spring',
  summer: '☀️ Summer',
  fall: '🍂 Fall',
};

export default function ClassesPage() {
  const { user, isAuthenticated } = useAuth();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [classes, setClasses] = useState<ClassOut[]>([]);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<string>>(new Set());
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassOut | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  // Kid selector state
  const [showKidSelector, setShowKidSelector] = useState(false);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [subAccounts, setSubAccounts] = useState<SubAccountOut[]>([]);

  // Determine if user has completed assessment and their skill level
  const assessmentCompleted = user?.assessment_completed ?? false;
  const userSkillLevel = (user?.skill_level as string) ?? 'none';

  useEffect(() => {
    api.getClasses().then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  // Fetch user's sub-accounts (kids)
  useEffect(() => {
    if (isAuthenticated && user) {
      api.getUser(user.id).then((res) => {
        setSubAccounts(res.data.sub_accounts || []);
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  // Fetch user's existing enrollments if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      api.getEnrollments({ user_id: user.id }).then((res) => {
        const enrolledIds = new Set(res.data.map((e) => e.class_id));
        setEnrolledClassIds(enrolledIds);
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleEnroll = (cls: ClassOut) => {
    if (!isAuthenticated || !user) return;

    // For junior classes, show kid selector
    if (cls.type === 'junior-clinic' && subAccounts.length > 0) {
      setSelectedClass(cls);
      setSelectedKids([]);
      setShowKidSelector(true);
      return;
    }

    // For adult classes or no kids, go straight to payment
    setSelectedClass(cls);
    setShowPaymentModal(true);
    setEnrollError(null);
  };

  const handleKidSelectConfirm = () => {
    if (selectedKids.length === 0) return;
    setShowKidSelector(false);
    setShowPaymentModal(true);
    setEnrollError(null);
  };

  const handlePaymentSelect = async (method: string, checkoutUrl?: string) => {
    if (!isAuthenticated || !user || !selectedClass) {
      return;
    }

    // For Stripe, redirect to checkout
    if (method === 'stripe' && checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    // For offline methods, create a pending payment and enroll
    setPaymentLoading(true);
    setEnrollError(null);
    try {
      // Create payment record
      await api.createPayment({
        user_id: user.id,
        amount: selectedClass.price * (selectedKids.length || 1),
        payment_type: 'class',
        payment_method: method,
        related_id: selectedClass.id,
        description: `${selectedClass.title} — ${selectedClass.day_of_week} ${selectedClass.start_time}`,
      });

      // Enroll based on class type
      if (selectedClass.type === 'junior-clinic' && selectedKids.length > 0) {
        // Bulk enroll selected kids
        await api.bulkEnrollInClass(user.id, selectedClass.id, selectedKids);
      } else {
        // Enroll the parent themselves
        await api.enrollInClass(user.id, selectedClass.id);
      }

      setEnrolledClassIds((prev) => {
        const next = new Set(prev);
        next.add(selectedClass.id);
        return next;
      });
      setEnrollSuccess(selectedClass.id);
      setPaymentSuccess(selectedClass.id);
      setShowPaymentModal(false);
      // Update current_students count locally
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClass.id ? { ...c, current_students: c.current_students + (selectedKids.length || 1) } : c
        )
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to complete enrollment. Please try again.';
      setEnrollError(detail);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Get unique seasons from classes
  const seasons = Array.from(new Set(classes.map((c) => c.season).filter(Boolean)));

  // Filter classes
  const filtered = classes.filter((cls) => {
    if (levelFilter !== 'all' && cls.level !== levelFilter) return false;
    if (typeFilter !== 'all' && cls.type !== typeFilter) return false;
    if (seasonFilter !== 'all' && cls.season !== seasonFilter) return false;

    // If user is logged in with a skill level, only show classes they can join
    if (isAuthenticated && userSkillLevel !== 'none' && cls.level !== 'all') {
      if (cls.level !== userSkillLevel) return false;
    }
    return true;
  });

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Schedule a <span className="text-yellow-400">Class</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Join a clinic or class that fits your skill level. New students must complete a
            1-on-1 assessment with Gina before enrolling.
          </p>
        </div>
      </section>

      {/* Assessment Required Banner */}
      {isAuthenticated && !assessmentCompleted && (
        <section className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Assessment Required</p>
                <p className="text-sm text-yellow-700">
                  You must complete a 1-on-1 assessment with Gina before you can enroll in classes.
                  This helps us place you at the right skill level.{' '}
                  <Link href="/book" className="text-yellow-900 font-bold underline">
                    Book your assessment →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Login prompt for unauthenticated users */}
      {!isAuthenticated && (
        <section className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                <strong>Sign in</strong> to join classes and book assessments.
              </p>
              <div className="flex gap-2">
                <Link href="/login" className="btn-primary text-sm py-1.5 px-4">Sign In</Link>
                <Link href="/register" className="btn-secondary text-sm py-1.5 px-4">Create Account</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Skill Level Info */}
      {isAuthenticated && assessmentCompleted && userSkillLevel !== 'none' && (
        <section className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-blue-800">
              🎯 Your skill level: <strong className="capitalize">{userSkillLevel}</strong> —
              Showing classes available for your level.
            </p>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Level:</span>
            {['all', 'beginner', 'intermediate', 'advanced'].map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  levelFilter === l
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                }`}
              >
                {l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Type:</span>
            {['all', 'junior-clinic', 'adult-clinic'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-yellow-500 text-green-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                }`}
              >
                {t === 'all'
                  ? 'All Types'
                  : t === 'junior-clinic'
                  ? '🎾 Junior'
                  : '💪 Adult'}
              </button>
            ))}
          </div>
          {seasons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Season:</span>
              <button
                onClick={() => setSeasonFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  seasonFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                }`}
              >
                All Seasons
              </button>
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeasonFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    seasonFilter === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {SEASON_LABELS[s] || s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Classes Grid */}
      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No classes match your filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((cls) => (
                <div key={cls.id} className="card overflow-hidden group">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-500 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          {cls.type === 'junior-clinic'
                            ? '🎾 Junior'
                            : '💪 Adult'}
                        </span>
                        {cls.season && (
                          <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {SEASON_LABELS[cls.season] || cls.season}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        cls.level === 'beginner' ? 'bg-green-100 text-green-700'
                        : cls.level === 'intermediate' ? 'bg-blue-100 text-blue-700'
                        : cls.level === 'advanced' ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cls.level.charAt(0).toUpperCase() + cls.level.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg">{cls.title}</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-gray-600 text-sm leading-relaxed">{cls.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Users className="w-4 h-4 text-green-600" />
                        <span>
                          {cls.current_students}/{cls.max_students} students
                        </span>
                        {cls.current_students >= cls.max_students - 2 && (
                          <span className="text-yellow-600 text-xs font-semibold">
                            Almost Full
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>
                          {cls.day_of_week}, {cls.start_time} – {cls.end_time}
                        </span>
                      </div>
                      {cls.start_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>
                            {cls.start_date}{cls.end_date ? ` – ${cls.end_date}` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>${cls.price} per session</span>
                      </div>
                    </div>
                    {/* Capacity bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(cls.current_students / cls.max_students) * 100}%`,
                        }}
                      />
                    </div>
                    {/* Enrollment button */}
                    {paymentSuccess === cls.id ? (
                      <div className="btn-primary w-full text-center mt-4 bg-green-600 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Enrolled & Payment Recorded!
                      </div>
                    ) : enrollSuccess === cls.id ? (
                      <div className="btn-primary w-full text-center mt-4 bg-green-600 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Enrolled!
                      </div>
                    ) : enrolledClassIds.has(cls.id) ? (
                      <div className="w-full text-center mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Already Enrolled
                      </div>
                    ) : !isAuthenticated ? (
                      <Link
                        href="/login"
                        className="btn-primary w-full text-center block mt-4"
                      >
                        Sign In to Join
                        <ChevronRight className="w-4 h-4 inline ml-1" />
                      </Link>
                    ) : cls.type === 'junior-clinic' && subAccounts.length === 0 ? (
                      <Link
                        href="/settings"
                        className="btn-primary w-full text-center block mt-4 opacity-75"
                      >
                        <Baby className="w-4 h-4 inline mr-1" /> Add Kids to Enroll
                        <ChevronRight className="w-4 h-4 inline ml-1" />
                      </Link>
                    ) : !assessmentCompleted && cls.type !== 'junior-clinic' ? (
                      <Link
                        href="/book"
                        className="btn-primary w-full text-center block mt-4 opacity-75"
                      >
                        Assessment Required
                        <ChevronRight className="w-4 h-4 inline ml-1" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(cls)}
                        disabled={enrollingClassId === cls.id}
                        className={`btn-primary w-full text-center mt-4 ${enrollingClassId === cls.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {cls.type === 'junior-clinic' ? (
                          <><Baby className="w-4 h-4 inline mr-1" /> Enroll Kids</>
                        ) : (
                          <>Join This Class <ChevronRight className="w-4 h-4 inline ml-1" /></>
                        )}
                      </button>
                    )}
                    {enrollError && enrollError && (
                      <p className="text-red-500 text-xs mt-2 text-center">{enrollError}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Kid Selector Modal */}
      {showKidSelector && selectedClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-green-600" /> Select Kids
                </h2>
                <button
                  onClick={() => { setShowKidSelector(false); setEnrollError(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="bg-green-50 rounded-xl p-3 mb-4">
                <p className="font-semibold text-green-900">{selectedClass.title}</p>
                <p className="text-sm text-green-700">
                  {selectedClass.day_of_week}, {selectedClass.start_time} – {selectedClass.end_time}
                </p>
                {selectedClass.season && (
                  <p className="text-xs text-green-600 mt-1">
                    {SEASON_LABELS[selectedClass.season] || selectedClass.season}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Select which of your children you want to enroll in this class:
              </p>
              {subAccounts.length === 0 ? (
                <div className="text-center py-6">
                  <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No children added to your account yet.</p>
                  <Link href="/settings" className="btn-primary text-sm">
                    Add a Child
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {subAccounts.map((kid) => (
                    <label
                      key={kid.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedKids.includes(kid.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKids.includes(kid.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKids([...selectedKids, kid.id]);
                          } else {
                            setSelectedKids(selectedKids.filter((id) => id !== kid.id));
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{kid.name}</p>
                        <p className="text-xs text-gray-500">
                          {kid.skill_level && kid.skill_level !== 'none'
                            ? `Level: ${kid.skill_level}`
                            : 'No assessment yet'}
                        </p>
                      </div>
                      {kid.skill_level && kid.skill_level !== 'none' && selectedClass.level !== 'all' && kid.skill_level !== selectedClass.level && (
                        <span className="text-xs text-red-500 font-medium">Level mismatch</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
              {subAccounts.length > 0 && (
                <button
                  onClick={handleKidSelectConfirm}
                  disabled={selectedKids.length === 0}
                  className={`btn-primary w-full mt-4 ${selectedKids.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Continue to Payment ({selectedKids.length} {selectedKids.length === 1 ? 'child' : 'children'})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Complete Enrollment</h2>
                <button
                  onClick={() => { setShowPaymentModal(false); setEnrollError(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="bg-green-50 rounded-xl p-3 mb-4">
                <p className="font-semibold text-green-900">{selectedClass.title}</p>
                <p className="text-sm text-green-700">
                  {selectedClass.day_of_week}, {selectedClass.start_time} – {selectedClass.end_time}
                </p>
                {selectedKids.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Enrolling: {subAccounts.filter((s) => selectedKids.includes(s.id)).map((s) => s.name).join(', ')}
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1 font-medium">
                  💳 Payment is required to confirm your enrollment.
                </p>
              </div>
              <PaymentMethodSelector
                amount={selectedClass.price * (selectedKids.length || 1)}
                paymentType="class"
                relatedId={selectedClass.id}
                description={`${selectedClass.title} — ${selectedClass.day_of_week} ${selectedClass.start_time}`}
                onSelect={handlePaymentSelect}
                loading={paymentLoading}
                error={enrollError}
              />
            </div>
          </div>
        </div>
      )}
    </LayoutShell>
  );
}