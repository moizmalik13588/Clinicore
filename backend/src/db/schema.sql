-- ============================================================
-- CLINICORE — SUPABASE SQL SCHEMA
-- Day 2: Supabase SQL Editor mein yeh poora script run karo
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CLINICS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinics (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT        NOT NULL,
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  business_hours      JSONB,
  appt_duration_mins  INT         NOT NULL DEFAULT 30,
  retell_agent_id     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DOCTORS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  specialty   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PATIENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  phone                 TEXT        NOT NULL,
  email                 TEXT,
  date_of_birth         DATE,
  gender                TEXT,
  preferred_doctor_id   UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  total_visits          INT         NOT NULL DEFAULT 0,
  last_visit_date       TIMESTAMPTZ,
  last_complaint        TEXT,
  last_mood             TEXT,
  crm_tags              TEXT[]      DEFAULT '{}',
  preferred_time_slot   TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone, clinic_id)
);

-- Phone lookup index — must be fast (<100ms for CRM)
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone, clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id        UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id         UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date  TIMESTAMPTZ NOT NULL,
  duration          INT         NOT NULL DEFAULT 30,
  status            TEXT        NOT NULL DEFAULT 'scheduled',
  -- scheduled | confirmed | completed | cancelled | no_show
  type              TEXT        NOT NULL DEFAULT 'general',
  -- general | follow_up | new_patient
  notes             TEXT,
  reminder_sent     BOOLEAN     NOT NULL DEFAULT FALSE,
  calendar_event_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date
  ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON appointments(reminder_sent, appointment_date)
  WHERE status = 'scheduled';

-- ─── CALLS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID        REFERENCES patients(id) ON DELETE SET NULL,
  retell_call_id  TEXT        UNIQUE,
  from_number     TEXT,
  to_number       TEXT,
  direction       TEXT        NOT NULL DEFAULT 'inbound',
  status          TEXT        NOT NULL DEFAULT 'in_progress',
  duration        INT,                   -- seconds
  transcript      TEXT,
  dominant_mood   TEXT,
  avg_intensity   FLOAT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_clinic ON calls(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_retell ON calls(retell_call_id);

-- ─── VISIT HISTORY ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_history (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id        UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id    UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id         UUID        REFERENCES doctors(id) ON DELETE SET NULL,
  visit_date        TIMESTAMPTZ NOT NULL,
  chief_complaint   TEXT,
  diagnosis         TEXT,
  treatment_notes   TEXT,
  follow_up_days    INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_history_patient
  ON visit_history(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visit_history_clinic
  ON visit_history(clinic_id, visit_date DESC);

-- ─── MOOD EVENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_events (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  call_id               UUID        NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  patient_id            UUID        REFERENCES patients(id) ON DELETE SET NULL,
  detected_mood         TEXT        NOT NULL,
  -- calm | frustrated | angry | anxious | happy
  intensity             FLOAT       NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
  confidence            FLOAT       NOT NULL DEFAULT 0.8,
  timestamp_offset      INT         NOT NULL DEFAULT 0,
  ai_action_taken       TEXT,
  transcript_excerpt    VARCHAR(300),
  escalation_triggered  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_events_call
  ON mood_events(call_id, timestamp_offset);
CREATE INDEX IF NOT EXISTS idx_mood_events_patient
  ON mood_events(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_events_clinic_date
  ON mood_events(clinic_id, created_at DESC);

-- ─── REVENUE EVENTS ───────────────────────────────────────────────────────────
-- Day 14 mein use hoga, abhi table bana lo
CREATE TABLE IF NOT EXISTS revenue_events (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id      UUID        REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id  UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  type            TEXT        NOT NULL DEFAULT 'consultation',
  -- new_patient | returning_patient | no_show_recovered | consultation
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_clinic_date
  ON revenue_events(clinic_id, created_at DESC);

-- ─── AUTO-UPDATE updated_at TRIGGER ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
-- Enable RLS on all tables (Supabase best practice)
ALTER TABLE clinics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls           ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events  ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — backend uses service key so yeh sab automatically bypass ho jaata hai
-- Frontend (anon key) ke liye policies Day 3 mein add karenge

-- ─── VERIFY: Check tables created ─────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
