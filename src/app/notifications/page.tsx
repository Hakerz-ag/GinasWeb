'use client';

import LayoutShell from '@/components/LayoutShell';
import { useEffect, useState } from 'react';
import { api, NotificationOut } from '@/lib/api';
import { Check, Trash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const res = await api.getNotifications(user.id, true);
      setNotes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [isAuthenticated, user]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotes((n) => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (err) { console.error(err); }
  };

  const del = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotes((n) => n.filter(x => x.id !== id));
    } catch (err) { console.error(err); }
  };

  if (!isAuthenticated) return null;

  return (
    <LayoutShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-green-900 mb-4">Notifications</h1>
        <p className="text-sm text-gray-600 mb-6">Unread messages and system notifications.</p>

        <div className="space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {notes.length === 0 && !loading && <div className="text-sm text-gray-500">No unread notifications.</div>}
          {notes.map((n) => (
            <div key={n.id} className="bg-white rounded-xl p-4 shadow-sm border flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">{n.title}</div>
                <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                <div className="text-xs text-gray-400 mt-2">{n.created_at}</div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {!n.read && <button onClick={() => markRead(n.id)} className="text-green-600"><Check className="w-4 h-4" /></button>}
                <button onClick={() => del(n.id)} className="text-red-600"><Trash className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutShell>
  );
}
