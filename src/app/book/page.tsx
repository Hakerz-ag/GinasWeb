'use client';

import LayoutShell from '@/components/LayoutShell';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Info, CheckCircle, Award, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const allTimeSlots = [
  '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

// Private lesson times end at 6:30 PM
const privateLessonTimes = allTimeSlots.filter(t => {
  const hour = parseInt(t.split(':')[0]);
  const isPM = t.includes('PM');
  let h24 = hour;
  if (isPM && hour !== 12) h24 += 12;
  if (!isPM && hour === 12) h24 = 0;
  return h24 < 18 || (h24 === 18 && t.includes(':30'));
});

// Court rental times (all available)
const timeSlots = allTimeSlots;

const courts = [
  { id: 1, name: 'Court 1', status: 'available' },
  { id: 2, name: 'Court 2', status: 'available' },
  { id: 3, name: 'Court 3', status: 'coming-soon' },
];

const openTimeRate = 45; // per hour for open time rental

export default function BookCourtPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookingType, setBookingType] = useState<'court' | 'private-lesson'>('court');
  const [step, setStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [noCourtPreference, setNoCourtPreference] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1.5');
  const [partySize, setPartySize] = useState('2');
  const [notes, setNotes] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'full'|'two'|'monthly'>('full');
  const [submitted, setSubmitted] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  // Court rental is always open time now (no contract option)
  const [ballMachine, setBallMachine] = useState(false);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleAssessmentSubmit = async () => {
    if (!isAuthenticated || !user) return;
    try {
      await api.createAssessment({
        user_id: user.id,
        date: selectedDate,
        start_time: selectedTime,
        end_time: selectedTime,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to book assessment:', err);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      setSubmitError('Please sign in to book a court.');
      return;
    }
    // Open payment modal instead of submitting directly
    setShowPaymentModal(true);
    setSubmitError(null);
  };

  // Calculate estimated price for the booking
  const getBookingPrice = () => {
    const duration = parseFloat(selectedDuration) || 1.5;
    const rate = openTimeRate;
    let price = duration * rate;
    if (ballMachine) price += duration * 10;
    // Price swell: if booking ends at or after 7:00 PM, apply 20% surcharge
    if (selectedTime) {
      try {
        const timeStr = selectedTime;
        let startHourNum = parseInt(timeStr.split(':')[0]);
        const startMinNum = timeStr.includes(':30') ? 30 : 0;
        if (timeStr.includes('PM') && startHourNum !== 12) startHourNum += 12;
        if (timeStr.includes('AM') && startHourNum === 12) startHourNum = 0;
        const durationHours = parseFloat(selectedDuration);
        let endHourNum = startHourNum + Math.floor(durationHours);
        let endMinNum = startMinNum + (durationHours % 1) * 60;
        if (endMinNum >= 60) { endHourNum += 1; endMinNum -= 60; }
        if (endHourNum >= 19) {
          price = Math.round(price * 1.2 * 100) / 100;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return price;
  };

  const handlePaymentSelect = async (method: string, checkoutUrl?: string) => {
    setSelectedPaymentMethod(method);
    if (!isAuthenticated || !user) return;

    // For Stripe, redirect to checkout
    if (method === 'stripe' && checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    // For offline methods, create a pending payment and submit the booking
    setPaymentLoading(true);
    setSubmitError(null);
    try {
      const duration = parseFloat(selectedDuration) || 1.5;
      const rate = openTimeRate;
      let price = duration * rate;
      if (ballMachine) price += duration * 10;
        // apply same price swell calculation used in price preview
        if (selectedTime) {
          try {
            const timeStr = selectedTime;
            let startHourNum = parseInt(timeStr.split(':')[0]);
            const startMinNum = timeStr.includes(':30') ? 30 : 0;
            if (timeStr.includes('PM') && startHourNum !== 12) startHourNum += 12;
            if (timeStr.includes('AM') && startHourNum === 12) startHourNum = 0;
            const durationHours = parseFloat(selectedDuration);
            let endHourNum = startHourNum + Math.floor(durationHours);
            let endMinNum = startMinNum + (durationHours % 1) * 60;
            if (endMinNum >= 60) { endHourNum += 1; endMinNum -= 60; }
            if (endHourNum >= 19) {
              price = Math.round(price * 1.2 * 100) / 100;
            }
          } catch (e) {}
        }

      // Create booking first
      // Parse start time properly (handle AM/PM)
      const timeStr = selectedTime;
      let startHourNum = parseInt(timeStr.split(':')[0]);
      const startMinNum = timeStr.includes(':30') ? 30 : 0;
      if (timeStr.includes('PM') && startHourNum !== 12) startHourNum += 12;
      if (timeStr.includes('AM') && startHourNum === 12) startHourNum = 0;
      const durationHours = parseFloat(selectedDuration);
      let endHourNum = startHourNum + Math.floor(durationHours);
      let endMinNum = startMinNum + (durationHours % 1) * 60;
      if (endMinNum >= 60) { endHourNum += 1; endMinNum -= 60; }
      // Convert back to 12-hour format
      const endAmPm = endHourNum >= 12 ? 'PM' : 'AM';
      const endHour12 = endHourNum > 12 ? endHourNum - 12 : endHourNum === 0 ? 12 : endHourNum;
      const endTime = `${endHour12}:${endMinNum === 0 ? '00' : endMinNum.toString().padStart(2, '0')} ${endAmPm}`;

      const bookingRes = await api.createBooking({
        user_id: user.id,
        court_number: selectedCourt || 1,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        contract_type: 'open-single',
        ball_machine: ballMachine,
        party_size: parseInt(partySize) || 2,
        notes: notes,
      });

      if (paymentPlan === 'full') {
        // Create a single pending payment linked to the booking
        await api.createPayment({
          user_id: user.id,
          amount: price,
          payment_type: 'booking',
          payment_method: method,
          related_id: bookingRes.data.id,
          description: `Court ${selectedCourt} — ${selectedDate} ${selectedTime} (${selectedDuration}hrs)${ballMachine ? ' + Ball Machine' : ''}`,
        });
      } else {
        // Create a payment plan and then create initial payment for the first installment
        const planRes = await api.createPaymentPlan({
          user_id: user.id,
          total_amount: price,
          plan_type: paymentPlan,
          booking_id: bookingRes.data.id,
        });
        const plan = planRes.data;
        // Find first pending installment
        const first = plan.installments.find((i: any) => i.status === 'pending' || i.status === 'scheduled');
        if (first) {
          // Create payment for the first installment (offline methods handled by admin later)
          await api.createPayment({
            user_id: user.id,
            amount: first.amount,
            payment_type: 'booking',
            payment_method: method,
            related_id: bookingRes.data.id,
            description: `Installment ${first.id} of plan ${plan.id}`,
          });
        }
      }

      setPaymentSuccess(true);
      setShowPaymentModal(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Booking/payment error:', err?.response?.data || err);
      const detail = err?.response?.data?.detail || 'Failed to submit booking. Please try again.';
      setSubmitError(detail);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (submitted) {
    return (
      <LayoutShell>
        <div className="min-h-screen bg-green-50 flex items-center justify-center py-16">
          <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-10 shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-3">Booking Request Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Your court reservation request has been sent. An admin will review and confirm your booking.
            </p>
            <p className="text-gray-500 text-sm mb-2">
              You&apos;ll receive a confirmation email once your booking is approved.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                💳 Payment is <strong>pending</strong> and will be confirmed once Gina accepts your booking.
              </p>
            </div>
            {selectedPaymentMethod && (selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'check') && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold text-red-700">Reservation Notice</p>
                <p className="text-xs text-red-700">You selected {selectedPaymentMethod === 'cash' ? 'Cash' : 'Check'}. This reserves your spot only — you must pay in full on the first day of class or your account may be suspended/banned.</p>
              </div>
            )}
            <div className="bg-green-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Court:</span>
                <span className="font-semibold text-green-900">Court {selectedCourt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-semibold text-green-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-semibold text-green-900">{selectedTime} ({selectedDuration} hrs)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Party Size:</span>
                <span className="font-semibold text-green-900">{partySize} people</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-semibold text-green-900">Open Time Rental</span>
              </div>
              {ballMachine && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ball Machine:</span>
                  <span className="font-semibold text-green-900">Yes (+$10/hr)</span>
                </div>
              )}
            </div>
            <button onClick={() => { setSubmitted(false); setStep(1); }} className="btn-primary w-full">
              Book Another Court
            </button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Book a <span className="text-yellow-400">Court</span> or <span className="text-yellow-400">Lesson</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Reserve an indoor court for practice, parties, or events. Open time rentals available by the hour.
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Login prompt for unauthenticated users */}
          {!isAuthenticated && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-yellow-800 text-lg mb-2">Sign In Required</h3>
              <p className="text-yellow-700 text-sm mb-4">You need to be signed in to book a court or private lesson.</p>
              <div className="flex justify-center gap-3">
                <a href="/login" className="btn-primary">Sign In</a>
                <a href="/register" className="btn-secondary">Create Account</a>
              </div>
            </div>
          )}
          {/* Booking Type Selection */}
          {step === 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-green-900 mb-4 text-center">What would you like to book?</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setBookingType('private-lesson')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    bookingType === 'private-lesson'
                      ? 'border-yellow-500 bg-yellow-50 shadow-md'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">Private Lesson</h4>
                      <p className="text-sm text-gray-500">1-on-1 with a Pro</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Get personalized coaching tailored to your skill level. Submit your preferred time and a pro will confirm your session.
                  </p>
                </button>
                <button
                  onClick={() => setBookingType('court')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    bookingType === 'court'
                      ? 'border-green-600 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">Court Rental</h4>
                      <p className="text-sm text-gray-500">Book a court for play</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Reserve an indoor court for practice, parties, or events. Open time rentals available by the hour.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Assessment Booking Flow */}
          {bookingType === 'private-lesson' && step === 1 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Request a Private Lesson
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Private Lesson with a Pro</p>
                  <p className="mt-1">Get personalized 1-on-1 coaching with a preferred pro. Whether you're a beginner or advanced player, private lessons are the fastest way to improve your game. Submit your preferred date and time and we'll confirm your session.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time (up to 6:30 PM)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {privateLessonTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTime === time
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                  <textarea
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                    placeholder="Any previous tennis experience, injuries, or preferences..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleAssessmentSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className={`btn-yellow ${(!selectedDate || !selectedTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Request Private Lesson
                </button>
              </div>
            </div>
          )}

          {/* Court Booking Flow */}
          {bookingType === 'court' && (
            <>
              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-4 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 rounded ${
                      step > s ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
            {/* Step 1: Select Court */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-yellow-500" />
                  Court Preference
                </h2>
                <div className="grid gap-4">
                  {courts.map((court) => (
                    <button
                      key={court.id}
                      onClick={() => court.status === 'available' && setSelectedCourt(court.id)}
                      disabled={court.status === 'coming-soon'}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        selectedCourt === court.id
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : court.status === 'coming-soon'
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-green-900 text-lg">{court.name}</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {court.status === 'coming-soon'
                              ? '🏗️ Opening September 2026'
                              : 'Indoor hard court — available year-round'}
                          </p>
                        </div>
                        {court.status === 'coming-soon' ? (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                            Coming Soon
                          </span>
                        ) : selectedCourt === court.id ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Open Time Rental</p>
                    <p className="mt-1">
                      Courts are rented by the hour as open time slots. Select your preferred court and time — 
                      your booking will be confirmed by Gina after verification. Open times are available when not in use for clinics.
                    </p>
                  </div>
                </div>

                <label className="mt-4 inline-flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={noCourtPreference} onChange={(e) => setNoCourtPreference(e.target.checked)} className="w-4 h-4" />
                  <span className="text-gray-600">No court preference — assign any available court based on time</span>
                </label>

                {/* Ball Machine Option */}
                <div className="mt-4">
                  <button
                    onClick={() => setBallMachine(!ballMachine)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      ballMachine
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-green-900">🎾 Add Ball Machine</h4>
                      <p className="text-gray-500 text-sm mt-0.5">+$10/hr — Great for solo practice and drilling</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      ballMachine ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'
                    }`}>
                      {ballMachine && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedCourt && !noCourtPreference}
                    className={`btn-primary ${(!selectedCourt && !noCourtPreference) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Next: Date & Time
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  Choose Date & Time
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedTime === time
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration
                    </label>
                    <div className="flex gap-3">
                      {['1', '1.5', '2'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDuration(d)}
                          className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                            selectedDuration === d
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                          }`}
                        >
                          {d} hr{d !== '1' ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary">
                    Back
                  </button>
                  <button
                    onClick={() => selectedDate && selectedTime && setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className={`btn-primary ${!selectedDate || !selectedTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Next: Details
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  Booking Details
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Requests / Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Birthday party, corporate event, etc."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Plan</label>
                    <div className="flex gap-3">
                      <label className={`px-4 py-2 rounded-xl border ${paymentPlan === 'full' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="plan" className="hidden" checked={paymentPlan === 'full'} onChange={() => setPaymentPlan('full')} />
                        Full — pay in one payment
                      </label>
                      <label className={`px-4 py-2 rounded-xl border ${paymentPlan === 'two' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="plan" className="hidden" checked={paymentPlan === 'two'} onChange={() => setPaymentPlan('two')} />
                        2-pay
                      </label>
                      <label className={`px-4 py-2 rounded-xl border ${paymentPlan === 'monthly' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="plan" className="hidden" checked={paymentPlan === 'monthly'} onChange={() => setPaymentPlan('monthly')} />
                        Monthly
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select a payment plan — offline methods (Venmo/Zelle/cash) require manual tracking by admin.</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-green-50 rounded-xl p-5 space-y-2">
                    <h3 className="font-bold text-green-900 mb-3">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Court:</span>
                      <span className="font-semibold text-green-900">Court {selectedCourt}</span>
                      <span className="text-gray-500">Date:</span>
                      <span className="font-semibold text-green-900">{selectedDate}</span>
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold text-green-900">{selectedTime} ({selectedDuration} hrs)</span>
                      <span className="text-gray-500">Type:</span>
                      <span className="font-semibold text-green-900">Open Time Rental</span>
                      <span className="text-gray-500">Rate:</span>
                      <span className="font-semibold text-green-900">${openTimeRate}/hr{ballMachine ? ' + $10/hr ball machine' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-secondary">
                    Back
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className={`btn-yellow ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {submitting ? 'Submitting...' : 'Proceed to Payment'}
                  </button>
                  {submitError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{submitError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Complete Booking</h2>
                <button
                  onClick={() => { setShowPaymentModal(false); setSubmitError(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⏳ Pending Payment:</strong> Your payment will be held as pending until Gina accepts your booking request.
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 mb-4">
                <p className="font-semibold text-green-900">Court {selectedCourt} — {selectedDate}</p>
                <p className="text-sm text-green-700">
                  {selectedTime} ({selectedDuration} hrs) · Open Time Rental
                  {ballMachine ? ' + Ball Machine' : ''}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Party size: {partySize} · Est. rate: ${openTimeRate}/hr
                </p>
              </div>
              <PaymentMethodSelector
                amount={getBookingPrice()}
                paymentType="booking"
                description={`Court ${selectedCourt} — ${selectedDate} ${selectedTime}`}
                onSelect={handlePaymentSelect}
                loading={paymentLoading}
                error={submitError}
              />
            </div>
          </div>
        </div>
      )}
    </LayoutShell>
  );
}