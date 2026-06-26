'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function NotificationBadge() {
  const { user, isAuthenticated } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const fetchCount = async () => {
    try {
      setLoading(true);
      if (!isAuthenticated || !user) {
        setCount(0);
        return;
      }
      const res = await api.getUnreadNotificationCount(user.id);
      // API returns { unread_count: number }
      setCount(res.data?.unread_count ?? 0);
    } catch (err) {
      console.error('Failed to fetch unread notification count', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <button onClick={() => router.push('/notifications')} className="relative p-2 rounded-lg hover:bg-green-50" aria-label="Notifications">
      <Bell className="w-5 h-5 text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4 px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold flex items-center justify-center">{count}</span>
      )}
    </button>
  );
}
