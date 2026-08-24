# Clinicore Clinic OS — User & Technical Guide

---

## 1. Executive Summary & Architecture

**Clinicore** is a comprehensive Clinic Operating System (Clinic OS) designed to modernize medical practice management. It bridges traditional clinic administration (Patient CRM, Doctor Availability, Appointment Scheduling, and Revenue Tracking) with cutting-edge **AI Voice Agent integration (Vapi)** and **real-time patient sentiment/mood analytics** during calls.

### Tech Stack
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS, React Router v7, Recharts, Axios.
- **AI & Integrations**: Vapi (Voice Agent & Webhooks), OpenRouter / Claude (Emotion analysis), Twilio (SMS notifications), Google Calendar API.

---

## 2. Project Structure & Core Modules

### Backend Modules (`backend/src/modules/`)
1. **Auth (`/auth`)**: JWT-based authentication (Access & Refresh tokens), email verification, and OTP login (`Otp` model).
2. **Clinics (`/clinics`)**: Clinic management, business hours, appointment duration settings, and Retell/Vapi agent configuration.
3. **Patients & CRM (`/patients`, `/crm`)**: Comprehensive patient records, duplicate prevention by phone/clinic ID, visit history, chief complaints, and CRM auto-tagging.
4. **Doctors & Availability (`/doctors`)**: Doctor profiles, specialties, status toggle, and granular weekly availability schedule slots (`DoctorAvailability`).
5. **Appointments & Calendar (`/appointments`, `/calendar`)**: Appointment scheduling, status tracking (scheduled, confirmed, completed, cancelled), SMS reminders, and Google Calendar sync.
6. **Calls & Vapi (`/calls`, `/vapi`, `/webhooks`)**: Inbound/outbound call logs, audio transcripts, Vapi webhook processing, and real-time tool calling.
7. **Mood Analytics (`/mood`)**: AI-driven emotion analysis during patient calls (calm, frustrated, angry, anxious, happy), intensity tracking, confidence scores, and escalation triggers.
8. **Dashboard (`/dashboard`)**: Overview stats, daily metrics, timeline events, and revenue summaries.
9. **Revenue (`/revenue`)**: Financial tracking for consultations, new vs. returning patients, and no-show recovery.
10. **SMS (`/sms`)**: Twilio integration for automated patient confirmations, reminders, and recall notices.
11. **Jobs (`/jobs`)**: Background cron jobs for daily mood summary reports and patient recall notifications.

### Frontend Pages (`frontend/src/pages/`)
1. **Login (`/login`)**: Authentication screen for clinic staff, doctors, and owners.
2. **Dashboard (`/dashboard`)**: Central command center displaying key clinic stats, appointments overview, and recent activity.
3. **Patients & Patient CRM (`/patients`, `/patients/:id`)**: Patient directory, search, detailed patient history, visit logs, and mood logs.
4. **Appointments (`/appointments`)**: Schedule manager, calendar integration, and appointment status updates.
5. **Doctors (`/doctors`)**: Doctor directory, specialization management, and availability schedule setup.
6. **Calls (`/calls`)**: Call logs list, transcripts viewer, and call mood timelines.
7. **Mood Analytics (`/mood`)**: Sentiment trends over time (7d, 30d, 90d) and emotional breakdown across patient calls.
8. **Analytics & Revenue (`/analytics`, `/revenue`)**: Financial statistics and clinic performance reports.
9. **Setup (`/setup`)**: Initial clinic configuration and agent linking.

---

## 3. User Workflows & Step-by-Step Guide

### A. Authentication & Onboarding
1. **Login**: Navigate to `/login`, enter staff/owner credentials. Upon successful authentication, access tokens are securely managed and stored, and you are redirected to the **Dashboard**.
2. **Clinic Setup**: Configure clinic details, business hours, default appointment duration, and Vapi agent integration in the **Setup** module.

### B. Managing Patients & CRM
1. **Patient Directory**: Go to **Patients** to view all registered patients.
2. **Patient Profile & CRM**: Click on any patient to view their complete **Patient CRM** view:
   - Last visit date, chief complaint, last detected mood, and preferred time slot.
   - CRM tags (`anxious`, `high-risk`, `needs-followup`).
   - Visit history and past consultation notes.

### C. Scheduling Appointments & Doctor Availability
1. **Doctor Setup**: Visit **Doctors** to manage doctor profiles and specialties. Configure weekly availability slots (Day of week, start time, end time, slot duration).
2. **Booking Appointments**: Go to **Appointments**, select patient, doctor, date, time slot, and appointment type.
3. **Automated Sync**: Upon creation, an automated SMS confirmation is dispatched, and (if connected) a Google Calendar event is created.

### D. AI Voice Agent & Call Management
1. **Vapi Webhooks**: Inbound calls handled by the Vapi voice assistant interact with backend tools (`/vapi/tools`) and events (`/vapi/events`).
2. **Call Logs**: Review transcripts, duration, participant numbers, and dominant mood in the **Calls** section.

### E. Mood & Sentiment Analytics
1. **Real-time Mood Detection**: During calls, AI analyzes patient speech excerpts, scoring emotional states (calm, angry, anxious, frustrated, happy) with confidence levels.
2. **Mood Trends**: Access **Mood Analytics** to view emotional distribution trends over 7, 30, or 90 days. Automated background jobs summarize daily moods and trigger alerts if anger or anxiety thresholds are exceeded.

### F. Revenue Tracking
1. **Financial Overview**: View revenue events generated from consultations, new patients, and recovered no-shows in the **Revenue** dashboard.

---

## 4. API Reference Summary

| Endpoint Group | Base Path | Key Methods | Description |
|----------------|-----------|-------------|-------------|
| **Auth** | `/auth` | POST `/login`, `/register`, `/refresh` | User authentication & token management |
| **Patients** | `/patients` | GET, POST, PUT, DELETE `/patients` | Patient CRUD operations |
| **Doctors** | `/doctors` | GET, POST, PUT, PATCH `/doctors` | Doctor profiles & availability |
| **Appointments**| `/appointments` | GET, POST, PUT, DELETE `/appointments` | Appointment scheduling & updates |
| **Calls** | `/calls` | GET `/calls`, `/calls/:id/mood-timeline` | Call transcripts & mood metrics |
| **CRM** | `/crm` | GET `/crm/patient`, `/crm/patient/:id/history` | Patient CRM lookup & history |
| **Mood** | `/mood` | POST `/mood/analyze`, GET `/mood/trends` | Sentiment analysis & trends |
| **Dashboard** | `/dashboard` | GET `/dashboard/overview`, `/stats`, `/revenue`| Summary analytics |
| **Revenue** | `/revenue` | GET, POST `/revenue` | Financial events & statistics |
| **Vapi Webhooks**| `/vapi` | POST `/vapi/tools`, `/vapi/events` | AI voice agent integration |

---

## 5. System Deployment & Maintenance

- **Database Migrations**: Run `npx prisma migrate deploy` to apply pending database migrations.
- **Backend Build**: Run `npm run build` (`tsc`) to compile TypeScript.
- **Production Start**: Run `npm start` (`node dist/server.js`).
- **Railway Deployment**: Configured via package scripts (`build`, `start`, `postinstall`) with PostgreSQL database connection via `DATABASE_URL`.
