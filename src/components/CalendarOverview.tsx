'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Calendar, Slash, ToggleLeft, ToggleRight } from 'lucide-react';

type Slot = {
  dayIndex: number;
  slotIndex: number;
  type: 'clinic' | 'court' | 'off';
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = Array.from({ length: 10 }).map((_, i) => `${8 + i}:00`); // 8:00 - 17:00

export default function CalendarOverview() {
  const [slots, setSlots] = useState<Slot[][]>(() =>
    DAYS.map(() => SLOTS.map(() => ({ dayIndex: 0, slotIndex: 0, type: 'court' as Slot['type'] })))
  );
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getScheduleBlocks(), api.getCalendar(new Date().getFullYear(), new Date().getMonth() + 1)])
      .then(([blocksRes, calendarRes]) => {
        if (!mounted) return;
        const fetchedBlocks = blocksRes.data || [];
        setBlocks(fetchedBlocks);
        // Build default grid — treat schedule blocks with block_type 'day-off' to mark full-day off
        const grid = DAYS.map((_, dIdx) => SLOTS.map((_, sIdx) => ({ dayIndex: dIdx, slotIndex: sIdx, type: 'court' as Slot['type'] })));
        fetchedBlocks.forEach((b: any) => {
          if (b.block_type === 'day-off') {
            // assume b.day contains weekday name
            const dayIdx = DAYS.indexOf(b.day);
            if (dayIdx >= 0) {
              grid[dayIdx] = grid[dayIdx].map((g) => ({ ...g, type: 'off' }));
            }
          }
        });
        setSlots(grid);
      })
      .catch((err) => console.error('Failed to load schedule blocks', err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const toggleSlot = (dIdx: number, sIdx: number) => {
    setSlots((prev) => {
      const next = prev.map((col) => col.slice());
      const current = next[dIdx][sIdx];
      const nextType = current.type === 'clinic' ? 'court' : current.type === 'court' ? 'clinic' : 'off';
      next[dIdx][sIdx] = { ...current, type: nextType };
      return next;
    });
  };

  const markDayOff = async (dIdx: number) => {
    const dayName = DAYS[dIdx];
    try {
      await api.createScheduleBlock({ day: dayName, start_time: '00:00', end_time: '23:59', reason: 'Admin day off', block_type: 'day-off' });
      setSlots((prev) => {
        const next = prev.map((col) => col.slice());
        next[dIdx] = next[dIdx].map((s) => ({ ...s, type: 'off' }));
        return next;
      });
    } catch (err) {
      console.error('Failed to mark day off', err);
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading calendar overview...</div>;

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-28 p-2"></th>
              {DAYS.map((d, i) => (
                <th key={d} className="p-2 text-left">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{d}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => markDayOff(i)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">Day Off</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slotLabel, sIdx) => (
              <tr key={slotLabel} className="align-top">
                <td className="p-2 text-xs text-gray-500">{slotLabel}</td>
                {DAYS.map((_, dIdx) => {
                  const cell = slots[dIdx][sIdx];
                  return (
                    <td key={`${dIdx}-${sIdx}`} className="p-1">
                      <button onClick={() => toggleSlot(dIdx, sIdx)} className={`w-full py-2 rounded ${cell.type === 'clinic' ? 'bg-yellow-100 text-yellow-800' : cell.type === 'court' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                        {cell.type === 'clinic' ? 'Clinic' : cell.type === 'court' ? 'Court' : 'Off'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">Tip: Click any slot to toggle Clinic vs Court; use "Day Off" to block the full day.</div>
    </div>
  );
}
