import { Request } from 'express';
import { UserRole } from '@prisma/client'; // ← Prisma se import

// Re-export karo taaki poori app mein ek jagah se mile
export { UserRole };

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  clinicId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── Appointment Enums (schema mein String hai isliye yahan define) ───────────
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  GENERAL = 'general',
  FOLLOW_UP = 'follow_up',
  NEW_PATIENT = 'new_patient',
}

// ─── Call Enums ───────────────────────────────────────────────────────────────
export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CallStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ─── Mood ─────────────────────────────────────────────────────────────────────
export type MoodType = 'calm' | 'frustrated' | 'angry' | 'anxious' | 'happy';
export type MoodAction = 'none' | 'empathy_phrase' | 'tone_soften' | 'escalate' | 'slow_down';
export type MoodSensitivity = 'low' | 'medium' | 'high';

export interface MoodAnalysisResult {
  mood: MoodType;
  intensity: number;
  action: MoodAction;
  confidence: number;
}

// ─── CRM ──────────────────────────────────────────────────────────────────────
export interface PatientContext {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisitDate: string | null;
  lastComplaint: string | null;
  lastMood: MoodType | null;
  preferredDoctorId: string | null;
  preferredDoctorName: string | null;
  crmTags: string[];
  preferredTimeSlot: string | null;
  isReturning: boolean;
}