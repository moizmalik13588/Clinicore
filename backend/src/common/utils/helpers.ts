import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

// ─── Response Helpers ─────────────────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResponse<T>
): void {
  res.status(200).json({ success: true, ...result });
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function getPaginationParams(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── Phone Normalization ──────────────────────────────────────────────────────

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure starts with + for international format
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function getTodayRange(): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─── Async Wrapper ────────────────────────────────────────────────────────────

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return ((...args: any[]) => {
    const next = args[args.length - 1];
    return Promise.resolve(fn(...args)).catch(next);
  }) as T;
}
