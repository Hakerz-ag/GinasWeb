'use client';

import LayoutShell from '@/components/LayoutShell';
import { clubInfo } from '@/data/staff';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Contact <span className="text-yellow-400">Us</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            We want to hear from you! Give us a call, send an email, or stop by for more information.
          </p>
        </div>
      </section>

      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-6">Get in Touch</h2>
              <div className="space-y-4 mb-8">
                <div className="bg-white rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Club Location & Mailing Address</p>
                    <p className="text-gray-600 text-sm mt-1">{clubInfo.address}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Call Us</p>
                    <a href={`tel:${clubInfo.phone}`} className="text-green-600 hover:text-green-700 text-sm">
                      {clubInfo.phone}
                    </a>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Email Us</p>
                    <a href={`mailto:${clubInfo.email}`} className="text-green-600 hover:text-green-700 text-sm break-all">
                      {clubInfo.email}
                    </a>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Hours</p>
                    <p className="text-gray-600 text-sm">Weekdays: {clubInfo.hours.weekdays}</p>
                    <p className="text-gray-600 text-sm">Weekends: {clubInfo.hours.weekends}</p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-[4/3] bg-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-900">649 Springfield Ave</p>
                    <p className="text-gray-600 text-sm">Berkeley Heights, NJ 07922</p>
                    <a
                      href="https://maps.google.com/?q=649+Springfield+Ave+Berkeley+Heights+NJ+07922"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-green-600 text-sm font-semibold hover:text-green-700"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-6">Send Us a Quick Note</h2>
              {submitted ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-4">
                    Thank you for reaching out. We&apos;ll get back to you shortly.
                  </p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }} className="btn-primary">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSubmitting(true);
                      setError(null);
                      try {
                        await api.submitContactForm(form);
                        setSubmitted(true);
                      } catch (err: any) {
                        const detail = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to send message. Please try again or call us directly.';
                        setError(detail);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                          placeholder="(908) 555-0123"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
                      <select
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select a subject</option>
                        <option value="Clinic Information">Clinic Information</option>
                        <option value="Court Rental">Court Rental</option>
                        <option value="Private Lessons">Private Lessons</option>
                        <option value="Contract Time">Contract Time</option>
                        <option value="Party/Event Booking">Party/Event Booking</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Message *</label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    <button type="submit" disabled={submitting} className={`btn-primary w-full ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                        </span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 inline mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}