/**
 * useRealtime — React hook for WebSocket real-time updates.
 *
 * Connects to the FastAPI WebSocket endpoint and provides:
 * - Live notifications (booking approved, enrollment confirmed, etc.)
 * - Automatic reconnection with exponential backoff
 * - Event callbacks for different notification types
 *
 * Usage:
 *   const { connected, lastEvent, unreadCount } = useRealtime();
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeReturn {
  connected: boolean;
  lastEvent: RealtimeEvent | null;
  unreadCount: number;
  reconnect: () => void;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || '';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function useRealtime(): UseRealtimeReturn {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;
    tokenRef.current = token;

    // Determine WebSocket URL
    let wsUrl: string;
    if (WS_BASE_URL) {
      // Production: use configured WS URL
      wsUrl = `${WS_BASE_URL}/realtime/ws?token=${encodeURIComponent(token)}`;
    } else {
      // Development: derive from current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/api/realtime/ws?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
      console.log('[Realtime] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        setLastEvent(data);

        // Handle different event types
        if (data.type === 'booking_created' || data.type === 'booking_approved' || data.type === 'booking_denied') {
          setUnreadCount((prev) => prev + 1);
        } else if (data.type === 'enrollment_approved' || data.type === 'enrollment_waitlisted') {
          setUnreadCount((prev) => prev + 1);
        } else if (data.type === 'notification') {
          setUnreadCount((prev) => prev + 1);
        } else if (data.type === 'payment_completed' || data.type === 'payment_failed') {
          setUnreadCount((prev) => prev + 1);
        }
      } catch {
        console.warn('[Realtime] Failed to parse message:', event.data);
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      wsRef.current = null;

      // Don't reconnect if it was a clean close or auth failure
      if (event.code === 4001 || event.code === 1000) {
        console.log('[Realtime] Disconnected (clean close)');
        return;
      }

      // Auto-reconnect with exponential backoff
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
        console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('[Realtime] WebSocket error:', error);
    };
  }, [isAuthenticated, user]);

  // Connect on mount / when auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [isAuthenticated, user, connect]);

  // Fetch initial unread count from API
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    fetch(`/api/notifications/unread-count?user_id=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        }
      })
      .catch(() => {
        // Silently fail — unread count will be 0
      });
  }, [isAuthenticated, user]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnect');
    }
    connect();
  }, [connect]);

  return { connected, lastEvent, unreadCount, reconnect };
}