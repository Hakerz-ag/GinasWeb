'use client';

import LayoutShell from '@/components/LayoutShell';
import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Info, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
];

const courts = [
  { id: 1, name: 'Court 1', status: 'available' },
  { id: 2, name: 'Court 2', status: 'available' },
  { id: 3, name: 'Court 3', status: 'coming-soon' },
];

const contractOptions = [
  { weeks: 30, label: '30-Week Contract', desc: 'Full season commitment — best value', pricePerHour: 28 },
  { weeks: 15, label: '15-Week Half Season', desc: 'Half season commitment', pricePerHour: 35 },
  { weeks: 0, label: 'Open Time (Single)', desc: 'One-time rental when available', pricePerHour: 45 },
];

export default function BookCourtPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookingType, setBookingType] = useState<'court' | 'assessment'>('court');
  const [step, setStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1.5');
  const [partySize, setPartySize] = useState('2');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [contractType, setContractType] = useState(0); // index into contractOptions
  const [ballMachine, setBallMachine] = useState(false);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Calculate end time based on duration
      const startHour = parseInt(selectedTime.split(':')[0]);
      const startMin = selectedTime.includes('30') ? 30 : 0;
      const isPM = selectedTime.includes('PM');
      const durationHours = parseFloat(selectedDuration);
      let endHour = startHour + Math.floor(durationHours);
      let endMin = startMin + (durationHours % 1) * 60;
      if (endMin >= 60) { endHour += 1; endMin -= 60; }
      const endTime = `${endHour}:${endMin === 0 ? '00' : endMin.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;

      await api.createBooking({
        user_id: user.id,
        court_number: selectedCourt || 1,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        contract_type: contractOptions[contractType].weeks === 30 ? '30-week' : contractOptions[contractType].weeks === 15 ? '15-week' : 'open-single',
        ball_machine: ballMachine,
        party_size: parseInt(partySize) || 2,
        notes: notes,
      });
      setSubmitted(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to submit booking. Please try again.';
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
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
            <p className="text-gray-500 text-sm mb-6">
              You&apos;ll receive a confirmation email once your booking is approved.
            </p>
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
                <span className="text-gray-500">Contract:</span>
                <span className="font-semibold text-green-900">{contractOptions[contractType].label}</span>
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
            Book a <span className="text-yellow-400">Court</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Reserve an indoor court for practice, parties, or events. We offer 30-week contract
            stretches, half-season packages, and single open-time rentals.
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
              <p className="text-yellow-700 text-sm mb-4">You need to be signed in to book a court or assessment.</p>
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
                  onClick={() => setBookingType('assessment')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    bookingType === 'assessment'
                      ? 'border-yellow-500 bg-yellow-50 shadow-md'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">1-on-1 Assessment</h4>
                      <p className="text-sm text-gray-500">Required before joining classes</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Book a private evaluation session with Gina to determine your skill level. Required for all new students.
                  </p>
                  {user && !user.assessment_completed && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                      ⚠ Assessment Required
                    </span>
                  )}
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
                    Reserve an indoor court for practice, parties, or events. 30-week contracts and open times available.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Assessment Booking Flow */}
          {bookingType === 'assessment' && step === 1 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Book Your Assessment
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Why an assessment?</p>
                  <p className="mt-1">Before joining group classes, every student needs a 1-on-1 evaluation with Gina. This helps us place you in the right skill level class so you get the most out of your training.</p>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time</label>
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
                  Book Assessment
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
                  Select a Court
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
                    <p className="font-semibold">30-Week Contract Season</p>
                    <p className="mt-1">
                      Courts are rented in 30-week stretches. A deposit of $200 per court hour
                      is required to reserve your weekly time. Open times become available when
                      contracted players can&apos;t make their slot.
                    </p>
                  </div>
                </div>

                {/* Contract Type Selection */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Contract Type</h3>
                  <div className="grid gap-3">
                    {contractOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setContractType(idx)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          contractType === idx
                            ? 'border-green-600 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-green-900">{opt.label}</h4>
                            <p className="text-gray-500 text-sm mt-0.5">{opt.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-900">${opt.pricePerHour}/hr</p>
                            {idx === 0 && <span className="text-xs text-green-600 font-semibold">Best Value</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                    onClick={() => selectedCourt && setStep(2)}
                    disabled={!selectedCourt}
                    className={`btn-primary ${!selectedCourt ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      {['1', '1.5', '2', '2.5'].map((d) => (
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
                      Party Size
                    </label>
                    <div className="flex gap-3">
                      {['1', '2', '3', '4', '5', '6+'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setPartySize(size)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            partySize === size
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

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
                      <span className="text-gray-500">Party Size:</span>
                      <span className="font-semibold text-green-900">{partySize} people</span>
                      <span className="text-gray-500">Contract:</span>
                      <span className="font-semibold text-green-900">{contractOptions[contractType].label}</span>
                      <span className="text-gray-500">Rate:</span>
                      <span className="font-semibold text-green-900">${contractOptions[contractType].pricePerHour}/hr{ballMachine ? ' + $10/hr ball machine' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-secondary">
                    Back
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className={`btn-yellow ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {submitting ? 'Submitting...' : 'Submit Booking Request'}
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
    </LayoutShell>
  );
}