'use client';

import LayoutShell from '@/components/LayoutShell';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function AdminNotificationsPage() {
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  const sendEmail = async () => {
    setSending(true);
    try {
      const days: string[] = [];
      const times: string[] = [];
      await api.sendEmail({ days, times, subject, body, send_to_all: true });
      alert('Email send request submitted.');
    } catch (err) {
      console.error(err);
      alert('Failed to send emails');
    } finally { setSending(false); }
  };

  const sendSms = async () => {
    // Frontend placeholder: create a notification of type 'sms' (backend may need implementation)
    try {
      const res = await api.sendSms(smsNumber, smsMessage);
      if (res.data?.sent) alert('SMS sent.');
      else alert('SMS not sent: ' + (res.data?.detail || 'unknown reason'));
    } catch (err) {
      console.error(err);
      alert('Failed to send SMS');
    }
  };

  return (
    <LayoutShell>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-green-900 mb-3">Admin — Notifications</h1>
        <p className="text-sm text-gray-600 mb-6">Send email blasts or quick SMS/phone notifications to customers.</p>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Send Email</h3>
          <div className="grid gap-3">
            <input placeholder="Comma-separated emails (optional)" value={emails} onChange={(e)=>setEmails(e.target.value)} className="p-2 border rounded" />
            <input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} className="p-2 border rounded" />
            <textarea placeholder="Body" value={body} onChange={(e)=>setBody(e.target.value)} className="p-2 border rounded h-28" />
            <div className="flex justify-end">
              <button onClick={sendEmail} className="btn-primary" disabled={sending}>{sending ? 'Sending...' : 'Send Email'}</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Send SMS / Phone Notification (placeholder)</h3>
          <div className="grid gap-3">
            <input placeholder="Phone number (E.164)" value={smsNumber} onChange={(e)=>setSmsNumber(e.target.value)} className="p-2 border rounded" />
            <textarea placeholder="Message" value={smsMessage} onChange={(e)=>setSmsMessage(e.target.value)} className="p-2 border rounded h-24" />
            <div className="flex justify-end">
              <button onClick={sendSms} className="btn-primary">Send SMS (queue)</button>
            </div>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
