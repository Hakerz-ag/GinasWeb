'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LayoutShell from '@/components/LayoutShell';
import { api, ClassOut, BookingOut } from '@/lib/api';
import { videos } from '@/data/videos';
import {
  Play,
  Calendar,
  MapPin,
  Users,
  Settings,
  User,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Clock,
  Video,
  BookOpen,
  AlertCircle,
  Award,
  Plus,
  X,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, isAuthenticated, justLoggedOut, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'learn' | 'book' | 'schedule'>('learn');
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 5, 1)); // June 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassOut[]>([]);
  const [bookings, setBookings] = useState<BookingOut[]>([]);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', birth_date: '', phone: '', email: '', relationship: 'child' });
  const [addingFamily, setAddingFamily] = useState(false);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<string>>(new Set());
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNameMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !justLoggedOut) {
      router.push('/login');
    } else if (isAuthenticated && user?.role !== 'customer') {
      router.push(user?.role === 'admin' ? '/admin' : '/customer');
    }
  }, [isAuthenticated, user, router, justLoggedOut, loading]);

  // Fetch classes and bookings from API
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    Promise.all([
      api.getClasses(),
      api.getBookings({ user_id: user.id }),
    ]).then(([classesRes, bookingsRes]) => {
      setClasses(classesRes.data);
      setBookings(bookingsRes.data);
      // Set enrolled class IDs from user data
      if (user.classes) {
        setEnrolledClassIds(new Set(user.classes));
      }
    }).catch(() => {});
  }, [isAuthenticated, user]);

  const handleEnroll = async (classId: string) => {
    if (!user) return;
    setEnrollingClassId(classId);
    setEnrollError(null);
    try {
      await api.enrollInClass(user.id, classId);
      setEnrolledClassIds((prev) => {
        const next = new Set(prev);
        next.add(classId);
        return next;
      });
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, current_students: c.current_students + 1 } : c
        )
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to enroll. Please try again.';
      setEnrollError(detail);
    } finally {
      setEnrollingClassId(null);
    }
  };

  if (!isAuthenticated || !user) return null;

  const myBookings = bookings.filter((b) => b.user_id === user?.id);

  return (
    <LayoutShell>
      {/* Dashboard Header */}
      <section className="bg-gradient-to-r from-green-800 to-green-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-green-200 mt-1">
                Ready to hit the courts? Here&apos;s your dashboard.
              </p>
            </div>
            <Link
              href="/settings"
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Upcoming Classes', value: '2', icon: BookOpen, color: 'text-green-600' },
              { label: 'Court Bookings', value: '1', icon: MapPin, color: 'text-yellow-600' },
              { label: 'Videos Watched', value: '8', icon: Video, color: 'text-blue-600' },
              { label: 'Family Members', value: user.sub_accounts?.length?.toString() || '0', icon: Users, color: 'text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-4 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-green-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Assessment Status Banner */}
          {!user.assessment_completed && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">Assessment Required</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Before joining classes, you need to complete a 1-on-1 assessment with Gina.
                  Book your assessment to get started.
                </p>
                <Link href="/book" className="inline-block mt-2 bg-yellow-500 hover:bg-yellow-600 text-green-900 font-bold px-4 py-1.5 rounded-lg text-sm transition-colors">
                  Book Assessment
                </Link>
              </div>
            </div>
          )}
          {user.assessment_completed && user.skill_level && user.skill_level !== 'none' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">Your Skill Level: {user.skill_level.charAt(0).toUpperCase() + user.skill_level.slice(1)}</p>
                <p className="text-sm text-blue-700">You can join classes matching your level. Browse available classes below.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { key: 'learn' as const, label: 'Learn from the Experts', icon: Play },
              { key: 'book' as const, label: 'Book a Court', icon: MapPin },
              { key: 'schedule' as const, label: 'Schedule a Class', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="bg-green-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Learn from the Experts */}
          {activeTab === 'learn' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6">
                🎬 Learn from the Experts
              </h2>
              <p className="text-gray-600 mb-6">
                Watch instructional videos from Gina and her team to improve your game.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.slice(0, 6).map((video) => (
                  <Link key={video.id} href="/videos" className="card overflow-hidden group cursor-pointer">
                    <div className="relative aspect-video">
                      {video.localVideo ? (
                        <video
                          src={video.localVideo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-green-900 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      {video.category === 'featured' && (
                        <span className="absolute top-3 left-3 bg-yellow-500 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                      {video.category === 'intro' && (
                        <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          🎬 Intro
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-green-900">{video.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{video.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/videos" className="btn-secondary inline-flex items-center gap-2">
                  View All Videos <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Book a Court */}
          {activeTab === 'book' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6">
                🏟️ Book a Court
              </h2>
              <p className="text-gray-600 mb-6">
                Reserve an indoor court for practice, parties, or events.
              </p>

              {/* My Bookings */}
              {myBookings.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-green-900 mb-4">My Bookings</h3>
                  <div className="space-y-3">
                    {myBookings.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">
                              Court {booking.court_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.date} • {booking.start_time} – {booking.end_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              booking.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to cancel this booking?')) {
                                  try {
                                    await api.updateBooking(booking.id, { status: 'cancelled' });
                                    setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
                                  } catch (err) {
                                    console.error('Failed to cancel booking:', err);
                                  }
                                }
                              }}
                              className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/book" className="btn-yellow inline-flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Book a New Court
              </Link>
            </div>
          )}

          {/* Schedule a Class */}
          {activeTab === 'schedule' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6">
                📅 Schedule a Class
              </h2>
              {!user.assessment_completed ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-bold text-yellow-800 text-lg">Assessment Required</h3>
                  <p className="text-yellow-700 mt-2">
                    You must complete a 1-on-1 assessment with Gina before joining classes.
                    This helps us place you in the right skill level.
                  </p>
                  <Link href="/book" className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-600 text-green-900 font-bold px-6 py-2 rounded-lg transition-colors">
                    Book Your Assessment
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Showing classes for your skill level: <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                      user.skill_level === 'beginner' ? 'bg-green-100 text-green-700'
                      : user.skill_level === 'intermediate' ? 'bg-blue-100 text-blue-700'
                      : user.skill_level === 'advanced' ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>{user.skill_level.charAt(0).toUpperCase() + user.skill_level.slice(1)}</span>
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes
                      .filter((cls) => {
                        // Show "all" level classes to everyone, otherwise match skill level
                        if (cls.level === 'all') return true;
                        if (user.skill_level === 'none' || user.skill_level === 'beginner') return cls.level === 'beginner' || cls.level === 'all';
                        return cls.level === user.skill_level || cls.level === 'all';
                      })
                      .map((cls) => (
                      <div key={cls.id} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            cls.level === 'beginner' ? 'bg-green-100 text-green-700'
                            : cls.level === 'intermediate' ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                          }`}>
                            {cls.level.charAt(0).toUpperCase() + cls.level.slice(1)}
                          </span>
                          <span className="text-sm font-bold text-green-900">${cls.price}</span>
                        </div>
                        <h3 className="font-bold text-green-900 mb-1">{cls.title}</h3>
                        <p className="text-gray-500 text-sm mb-3">{cls.description}</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {cls.day_of_week}, {cls.start_time} – {cls.end_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {cls.current_students}/{cls.max_students} students
                          </div>
                        </div>
                        <button
                          onClick={() => handleEnroll(cls.id)}
                          disabled={enrollingClassId === cls.id || enrolledClassIds.has(cls.id)}
                          className={`w-full mt-4 text-sm py-2 rounded-xl font-semibold transition-colors ${
                            enrolledClassIds.has(cls.id)
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : enrollingClassId === cls.id
                              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {enrolledClassIds.has(cls.id) ? '✓ Enrolled' : enrollingClassId === cls.id ? 'Enrolling...' : 'Join Class'}
                        </button>
                        {enrollError && (
                          <p className="text-red-500 text-xs mt-2 text-center">{enrollError}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Monthly Calendar */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            My Calendar
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <div className="bg-green-50 rounded-2xl border border-green-100 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-green-700" />
                  </button>
                  <h3 className="text-lg font-bold text-green-900">
                    {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                  </h3>
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-green-700" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-green-100">
                  {DAYS.map((d) => (
                    <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-green-700 uppercase">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7">
                  {(() => {
                    const year = calendarDate.getFullYear();
                    const month = calendarDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = new Date();

                    const cells: (number | null)[] = [];
                    for (let i = 0; i < firstDay; i++) cells.push(null);
                    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                    while (cells.length % 7 !== 0) cells.push(null);

                    return cells.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} className="h-20 border-b border-r border-green-100/50 bg-green-50/50" />;
                      }
                      const dayClasses = day ? classes.filter((c) => c.day_of_week === dayNameMap[new Date(year, month, day).getDay()]) : [];
                      const dayBookings = day ? bookings.filter((b) => {
                        // Match bookings to the specific date
                        const bookingDate = b.date;
                        const cellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return b.user_id === user?.id && bookingDate === cellDate;
                      }) : [];
                      const hasClasses = dayClasses.length > 0;
                      const hasBookings = dayBookings.length > 0;
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const isSelected = day === selectedDay;

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                          className={`h-20 border-b border-r border-green-100/50 p-1.5 text-left transition-colors hover:bg-green-100 ${
                            isSelected ? 'bg-green-100 ring-2 ring-green-500 ring-inset' : ''
                          }`}
                        >
                          <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            isToday ? 'bg-green-600 text-white' : 'text-green-900'
                          }`}>
                            {day}
                          </div>
                          <div className="mt-0.5 space-y-0.5">
                            {hasClasses && (
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] text-blue-600 font-medium">{dayClasses.length} class{dayClasses.length > 1 ? 'es' : ''}</span>
                              </div>
                            )}
                            {hasBookings && (
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                <span className="text-[9px] text-yellow-600 font-medium">{dayBookings.length} court</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Legend */}
                <div className="px-6 py-3 border-t border-green-100 flex items-center gap-6 text-xs text-green-700">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Classes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    My Court Bookings
                  </div>
                </div>
              </div>
            </div>

            {/* Day Detail Panel */}
            <div className="space-y-4">
              {selectedDay ? (() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const dayClasses = classes.filter((c) => c.day_of_week === dayNameMap[new Date(year, month, selectedDay).getDay()]);
                const dayBookings = bookings.filter((b) => b.user_id === user?.id);

                return (
                  <>
                    <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
                      <h3 className="font-bold text-green-900 text-lg mb-1">
                        {MONTHS[month]} {selectedDay}, {year}
                      </h3>
                      <p className="text-sm text-green-700">
                        {dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''} · {dayBookings.length} court booking{dayBookings.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {dayClasses.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
                        <h4 className="font-semibold text-green-900 text-sm mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Classes
                        </h4>
                        <div className="space-y-3">
                          {dayClasses.map((cls) => (
                            <div key={cls.id} className="bg-blue-50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-blue-900 text-sm">{cls.title}</span>
                                <span className="text-xs font-bold text-blue-600">${cls.price}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-blue-700">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {cls.start_time} – {cls.end_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {cls.current_students}/{cls.max_students}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayBookings.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
                        <h4 className="font-semibold text-green-900 text-sm mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-yellow-500" />
                          My Court Bookings
                        </h4>
                        <div className="space-y-3">
                          {dayBookings.map((b) => (
                            <div key={b.id} className="bg-yellow-50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-yellow-900 text-sm">Court {b.court_number}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.status === 'approved' ? 'bg-green-100 text-green-700'
                                  : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                                }`}>
                                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                </span>
                              </div>
                              <div className="text-xs text-yellow-700">
                                {b.start_time} – {b.end_time} · Party of {b.party_size}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayClasses.length === 0 && dayBookings.length === 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center">
                        <Calendar className="w-10 h-10 text-green-200 mx-auto mb-2" />
                        <p className="text-green-700 text-sm">No events on this day.</p>
                        <Link href="/classes" className="btn-primary text-sm mt-3 inline-block">Browse Classes</Link>
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center">
                  <Calendar className="w-10 h-10 text-green-200 mx-auto mb-3" />
                  <p className="text-green-700 text-sm">Click a day on the calendar to see your schedule.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Family Accounts Section - Prominent */}
      <section className="bg-gradient-to-br from-green-50 to-yellow-50 py-8 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Family Accounts
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddFamily(true)} className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-100 px-3 py-1.5 rounded-lg">
                <Plus className="w-4 h-4" /> Add Member
              </button>
              <Link href="/settings" className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                Manage all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Parent card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-green-200 flex items-start gap-4">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-white">{user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-green-900 text-lg">{user.name}</p>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">Primary</span>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                  {user.birth_date && <p className="text-xs text-gray-400">Born: {new Date(user.birth_date).toLocaleDateString()}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {user.skill_level && user.skill_level !== 'none' && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        user.skill_level === 'beginner' ? 'bg-green-100 text-green-700'
                        : user.skill_level === 'intermediate' ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                      }`}>
                        {user.skill_level.charAt(0).toUpperCase() + user.skill_level.slice(1)}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${user.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.assessment_completed ? '✓ Assessed' : '⚠ Pending Assessment'}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">Account Owner</p>
                </div>
              </div>
              {/* Family member cards */}
              {(user.sub_accounts || []).map((member) => (
                <div key={member.id} className="bg-white rounded-2xl p-5 shadow-sm border border-yellow-200 flex items-start gap-4">
                  <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-green-900">{member.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-green-900 text-lg">{member.name}</p>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full">{member.relationship}</span>
                    </div>
                    {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                    {member.phone && <p className="text-sm text-gray-500">{member.phone}</p>}
                    {member.birth_date && <p className="text-xs text-gray-400">Born: {new Date(member.birth_date).toLocaleDateString()}</p>}
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
                    <div className="flex items-center gap-2 mt-2">
                      <Link href="/classes" className="text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                        🎾 Classes
                      </Link>
                      <Link href="/book" className="text-xs font-medium text-yellow-700 hover:text-yellow-800 bg-yellow-50 px-2 py-1 rounded-lg">
                        🏟️ Book Court
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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
    </LayoutShell>
  );
}