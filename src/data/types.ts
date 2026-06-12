/**
 * Type definitions for Gina's Tennis World frontend.
 *
 * These types mirror the Pydantic schemas in the FastAPI backend.
 * The actual data comes from the API via src/lib/api.ts.
 */

export type UserRole = 'customer' | 'admin';
export type SkillLevel = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  birth_date?: string;
  skill_level?: SkillLevel;
  assessment_completed?: boolean;
  sessions_taken?: number;
  status?: string;
  children?: SubAccount[];
  classes?: string[];
  bookings?: string[];
  createdAt?: string;
}

export interface SubAccount {
  id: string;
  name: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  relationship: 'child' | 'spouse' | 'other';
  skill_level?: SkillLevel;
  assessment_completed?: boolean;
  sessions_taken?: number;
}

export interface CourtBooking {
  id: string;
  userId: string;
  courtNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  contractType?: string;
  ballMachine?: boolean;
  partySize: number;
  notes?: string;
  createdAt?: string;
}

export interface ClassSession {
  id: string;
  title: string;
  instructorName: string;
  type: 'junior-clinic' | 'adult-clinic' | 'private' | 'semi-private' | 'assessment' | 'group';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  maxStudents: number;
  currentStudents: number;
  price: number;
  description: string;
}

export interface ClassEnrollment {
  id: string;
  userId: string;
  classId: string;
  status: 'pending' | 'approved' | 'waitlisted' | 'active';
  enrolledAt: string;
}

export interface OpenTime {
  id: string;
  day: string;
  time: string;
  court: string;
  status: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  sub_account_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'completed' | 'cancelled';
  skill_level_assigned: SkillLevel;
  notes: string;
  created_at?: string;
}