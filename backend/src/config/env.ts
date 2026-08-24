import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().default('http://localhost:3000'),
  DASHBOARD_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Postgres URI'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  CLINIC_ID: z.string().optional(),

  // ─── Resend ───────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM: z.string().default('onboarding@resend.dev'),

  // ─── Retell ───────────────────────────────────────────────────────────────
  RETELL_API_KEY: z.string().optional(),
  RETELL_AGENT_ID: z.string().optional(),
  RETELL_WEBHOOK_SECRET: z.string().optional(),
  RETELL_LLM_WEBSOCKET_URL: z.string().default('ws://localhost:3000/retell/llm'),

  // ─── Twilio ───────────────────────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_DEFAULT_NUMBER: z.string().optional(),

  // ─── OpenRouter ───────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),

  // ─── Google Calendar ──────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/auth/google/callback'),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),

  MOOD_SENSITIVITY: z.enum(['low', 'medium', 'high']).default('medium'),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = _parsed.data;
export type Env = z.infer<typeof envSchema>;