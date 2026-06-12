'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LayoutShell from '@/components/LayoutShell';
import { api, ClassOut, BookingOut } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Map class day names to day numbers
const dayMap: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export default function AdminCalendarPage() {
  const { user, isAuthenticated, justLoggedOut, loading } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // June 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassOut[]>([]);
  const [bookings, setBookings] = useState<BookingOut[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !justLoggedOut) router.push('/login');
    else if (isAuthenticated && user?.role !== 'admin') router.push('/customer');
  }, [isAuthenticated, user, router, justLoggedOut, loading]);

  // Fetch classes and bookings from API
  useEffect(() => {
    Promise.all([api.getClasses(), api.getBookings()])
      .then(([classesRes, bookingsRes]) => {
        setClasses(classesRes.data);
        setBookings(bookingsRes.data);
      })
      .catch(() => {});
  }, []);

  if (!isAuthenticated || !user) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Get classes for a given day
  const getClassesForDay = (day: number) => {
    const date = new Date(year, month, day);
    const dayName = DAYS[date.getDay()];
    const fullDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    return classes.filter((c) => c.day_of_week === fullDayName);
  };

  // Get bookings for a given day
  const getBookingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.date === dateStr);
  };

  // Count events on a day
  const getEventCount = (day: number) => {
    return getClassesForDay(day).length + getBookingsForDay(day).length;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedClasses = selectedDay ? getClassesForDay(selectedDay) : [];
  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-r from-green-900 to-green-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold mb-2">
                ⚙️ ADMIN
              </div>
              <h1 className="text-2xl font-bold text-white">Calendar</h1>
              <p className="text-green-300 text-sm mt-1">Classes & court reservations at a glance</p>
            </div>
            <Link
              href="/admin"
              className="text-green-300 hover:text-white text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-green-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <button onClick={prevMonth} className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-lg font-bold text-green-900">
                    {MONTHS[month]} {year}
                  </h2>
                  <button onClick={nextMonth} className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {DAYS.map((d) => (
                    <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {cells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-24 border-b border-r border-gray-50 bg-gray-50/50" />;
                    }
                    const eventCount = getEventCount(day);
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = day === selectedDay;
                    const hasClasses = getClassesForDay(day).length > 0;
                    const hasBookings = getBookingsForDay(day).length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                        className={`h-24 border-b border-r border-gray-100 p-2 text-left transition-colors hover:bg-green-50 ${
                          isSelected ? 'bg-green-50 ring-2 ring-green-500 ring-inset' : ''
                        }`}
                      >
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                          isToday ? 'bg-green-600 text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {hasClasses && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-[10px] text-blue-600 font-medium">
                                {getClassesForDay(day).length} class{getClassesForDay(day).length > 1 ? 'es' : ''}
                              </span>
                            </div>
                          )}
                          {hasBookings && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              <span className="text-[10px] text-yellow-600 font-medium">
                                {getBookingsForDay(day).length} court{getBookingsForDay(day).length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Classes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    Court Reservations
                  </div>
                </div>
              </div>
            </div>

            {/* Day Detail Panel */}
            <div className="space-y-4">
              {selectedDay ? (
                <>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-green-900 text-lg mb-1">
                      {MONTHS[month]} {selectedDay}, {year}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''} · {selectedBookings.length} court reservation{selectedBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Classes */}
                  {selectedClasses.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Classes
                      </h4>
                      <div className="space-y-3">
                        {selectedClasses.map((cls) => (
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

                  {/* Court Reservations */}
                  {selectedBookings.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-yellow-500" />
                        Court Reservations
                      </h4>
                      <div className="space-y-3">
                        {selectedBookings.map((b) => (
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
                            {b.notes && (
                              <div className="text-xs text-yellow-600 mt-1 italic">&quot;{b.notes}&quot;</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedClasses.length === 0 && selectedBookings.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No events scheduled for this day.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Click a day on the calendar to see details.</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">This Month</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total classes/week</span>
                    <span className="font-bold text-gray-900">{classes.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Court reservations</span>
                    <span className="font-bold text-gray-900">{bookings.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Pending approvals</span>
                    <span className="font-bold text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}