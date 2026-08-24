<div align="center">

# 🏥 Clinicore — Healthcare & Multi-Tenant Clinic Management SaaS

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge&logo=appveyor" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-blue?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2F%20Vite%20%2F%20Tailwind-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/AI%20Voice-Vapi.ai%20Integration-FF4F00?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deployment-Railway%20%2F%20Vercel-black?style=for-the-badge&logo=vercel" />
</p>

<p align="center">
  <a href="https://frontend-beta-amber-s2mrth6g7n.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐%20Live%20App-Clinicore-2EA44F?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://cheerful-balance-production-e7e3.up.railway.app/health" target="_blank">
    <img src="https://img.shields.io/badge/⚡%20Backend%20API-Railway-blueviolet?style=for-the-badge" alt="API Status" />
  </a>
</p>

A modern, scalable, multi-tenant SaaS application built for healthcare providers, doctors, and clinic administrators to streamline patient records, appointments, autonomous AI voice calls, real-time mood analytics, and medical revenue operations.

</div>

---

## 📌 System Architecture & High-Level Overview

Clinicore is architected as a decoupled client-server (SPA + REST API) multi-tenant SaaS application. Each clinic operates within its isolated tenant boundary in PostgreSQL, protected by custom JWT authentication middleware and Zod schema validations, while sharing robust automated job schedulers and AI-powered intelligence.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CLINICORE SAAS PLATFORM                                         │
├────────────────────────────┬────────────────────────────────────────────┬───────────────────────────────┤
│     React 19 SPA Frontend  │           Express.js REST API Server       │   PostgreSQL + Prisma Database│
│ (Tailwind, Recharts, Vite) │ (Modular Slices, JWT, Zod, Cron, Webhooks) │ (Multi-Tenant Data Isolation) │
└──────────────┬─────────────┴─────────────────────┬──────────────────────┴───────────────┬───────────────┘
               │                                   │                                      │
               ▼                                   ▼                                      ▼
     [ Client Dashboard ] ──────────► [ Vapi AI Voice Receptionist ] ────────► [ Twilio SMS & Resend Email ]
                                                   │
                                                   ▼
                                      [ Real-time Mood Analytics ]
```

---

## 🎙️ AI Voice Agent Integration (Vapi.ai)

Clinicore features a 24/7 autonomous AI Voice Receptionist powered by Vapi.ai. It handles live phone calls, speaks with patients in natural human voice, executes real-time database tools via webhooks, and performs sentiment analysis automatically.

### 🤖 AI Agent Capabilities & Tool Actions:
* **24/7 Autonomous Receptionist:** Answers incoming patient calls instantly, eliminating phone wait times and front-desk bottlenecks.
* **Real-Time Slot Verification:** Dynamically queries doctor availability slots (`DoctorAvailability`) during live conversation before scheduling.
* **Instant Appointment Booking:** Automatically writes appointment records directly into PostgreSQL during the call.
* **Patient Verification & CRM Auto-Creation:** Searches existing records by caller phone number or auto-generates a new patient profile with chief complaints.
* **Real-Time Call Transcript Ingestion:** Streams and stores full audio call transcripts for medical review and compliance.
* **Automated Tool Callbacks (`/api/vapi/webhook`):** Triggers backend handlers to dispatch Twilio SMS confirmations and sync Google Calendar events upon call completion.

---

## 🌟 Complete Feature Breakdown

### 🏢 1. Multi-Tenant Architecture & Onboarding
* **Secure Tenant Registration:** Multi-step clinic owner onboarding (`/auth/register`) with instant workspace creation.
* **Email OTP Verification:** Automated OTP generation & validation (`/auth/verify-otp`) powered by Resend API.
* **JWT Dual-Token Security:** Secure authentication using short-lived Access Tokens and Refresh Token rotation with secure cookie/header storage.

### 👥 2. Granular Role-Based Access Control (RBAC)
* Strict permission guards separating Clinic Owner, Staff, and Doctor profiles.
* Protected API endpoints enforcing tenant boundaries so clinic data never leaks across organizations.

### 🧑‍⚕️ 3. Comprehensive Patient CRM & Medical Logs
* Full patient profile management with unique phone number constraint per clinic.
* Detailed medical history, chief complaints, visit logs, and auto-generated CRM tags (e.g., VIP, Frequent, High No-Show Risk).
* Duplicate record prevention and instant live patient search.

### 📅 4. Appointment & Doctor Schedule Management
* **Granular Availability Slots:** Weekly schedule configuration per doctor with custom consultation hours, buffer times, and break slots.
* Full lifecycle management (Pending, Confirmed, Completed, Cancelled, Rescheduled).
* **Google Calendar Sync:** Real-time 2-way synchronization of booked consultations directly to doctors' personal Google Calendars.
* **Automated Twilio SMS Notifications:** Instant booking receipts, reminder alerts, and rescheduling links sent via SMS.

### 🧠 5. Real-Time Mood & Sentiment Analytics Engine
* **AI Emotion Scoring:** Evaluates caller transcript sentiment across 5 core emotional spectrums (Calm, Happy, Anxious, Frustrated, Angry).
* **Emotional Intensity Tracking:** Quantifies emotional stress on a scale of 1 to 10 for clinical triage.
* **Trend Visualization:** Interactive area & bar charts using Recharts for daily/weekly mood trends.
* **Automated Daily Mood Reports:** Background cron job computes sentiment averages and dispatches summary reports to clinic owners.

### 💰 6. Financial & Revenue Tracking Operations
* Real-time revenue analytics categorized by consultation fees, new vs. returning patient contributions, and recovered no-shows.
* Visual financial stats cards and revenue breakdown over configurable date ranges.

### ⏱️ 7. Scheduled Background Jobs & Automated Tasks
* Powered by Node-Cron for continuous background execution:
  - **Patient Recall System:** Auto-identifies inactive patients and queues follow-up reminder SMS.
  - **Daily Mood & Call Digest:** Compiles call volumes and emotional distribution every midnight.

---

## 🛠️ Tech Stack & Dependencies

### Frontend (`frontend/`)
| Framework / Library | Purpose |
| :--- | :--- |
| **React 19 & Vite** | High-performance SPA dashboard UI |
| **React Router v7** | Client-side routing with protected layout guards |
| **Tailwind CSS & PostCSS** | Modern utility-first styling and custom design system |
| **Recharts** | Interactive charts for mood trends and revenue metrics |
| **Lucide React** | Modern iconography set |
| **Axios** | API HTTP client with custom automatic token refresh interceptors |

### Backend (`backend/`)
| Framework / Library | Purpose |
| :--- | :--- |
| **Node.js & Express.js** | Modular RESTful API backend server |
| **Prisma ORM & PostgreSQL** | Type-safe database queries, schema migrations, and indexing |
| **Zod** | Strict runtime request body & environment validation middleware |
| **JWT & Bcryptjs** | Secure password hashing & access/refresh token issuing |
| **Vapi SDK & Webhooks** | Real-time AI voice call orchestration and tool callbacks |
| **Node-Cron** | Automated background job scheduling |
| **Twilio SDK & Resend** | Automated SMS notification and email delivery engines |
| **Googleapis** | Google Calendar API integration |

---

## 📁 Project Directory Hierarchy

```text
Clinicore/
├── backend/                  # Express API server & Prisma ORM
│   ├── prisma/               # Database schema & migration history
│   ├── src/
│   │   ├── common/           # Error handlers, JWT utils, RBAC middleware
│   │   ├── config/           # Environment validation (Zod schema)
│   │   ├── db/               # Prisma database client & seeders
│   │   ├── jobs/             # Cron schedulers (daily report, recall)
│   │   └── modules/          # Modular domain architecture:
│   │       ├── ai/           # AI processing & sentiment scoring
│   │       ├── appointments/ # Appointment booking & availability logic
│   │       ├── auth/         # Registration, OTP, JWT refresh cycle
│   │       ├── calendar/     # Google Calendar OAuth & sync
│   │       ├── calls/        # Call logs & transcript storage
│   │       ├── clinics/      # Tenant settings & Vapi agent config
│   │       ├── crm/          # Patient history & CRM search
│   │       ├── dashboard/    # Overview statistics & metrics
│   │       ├── doctors/      # Doctor profiles & availability slots
│   │       ├── mood/         # Sentiment analytics engine
│   │       ├── patients/     # Patient CRUD & medical logs
│   │       ├── revenue/      # Revenue tracking & financial stats
│   │       ├── sms/          # Twilio SMS dispatch handlers
│   │       ├── vapi/         # AI voice agent webhooks & tools
│   │       └── webhooks/     # Inbound external webhook handlers
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React 19 Vite SPA Dashboard
│   ├── src/
│   │   ├── assets/           # Images & vector icons
│   │   ├── components/       # Reusable UI cards, tables, layout
│   │   ├── hooks/            # Custom React hooks (auth, data fetch)
│   │   ├── lib/              # Axios instance & token interceptors
│   │   └── pages/            # View pages (Dashboard, Patients, CRM, Mood,
│   │                         # Appointments, Doctors, Calls, Setup, Auth)
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── USER_GUIDE.md             # Detailed user & technical manual
└── README.md
```

---

## 🚀 Step-by-Step Local Setup Guide

### Prerequisites
* **Node.js** (v18 or higher)
* **PostgreSQL** (Local DB or Cloud instance like Neon/Supabase)

### 1. Clone Repository
```bash
git clone https://github.com/moizmalik13588/Clinicore.git
cd Clinicore
```

### 2. Backend Setup & Run
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` directory (see [Environment Variables Configuration](#-environment-variables-configuration)). Then execute database migrations and start dev server:
```bash
npx prisma migrate dev
npm run dev
```
*(Backend running on `http://localhost:3000`)*

### 3. Frontend Setup & Run
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend running on `http://localhost:5173`)*

---

## 🔒 Environment Variables Configuration

Create `.env` files in respective folders. Secrets must never be committed to git.

### Backend (`backend/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/clinicore?schema=public
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_min_32_chars
API_BASE_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:5173

# Integrations
RESEND_API_KEY=re_xxxxxx
RESEND_FROM=onboarding@resend.dev
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_DEFAULT_NUMBER=+1234567890
OPENROUTER_API_KEY=your_openrouter_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🌐 Live Deployments
- **Frontend App:** [Clinicore Dashboard](https://frontend-beta-amber-s2mrth6g7n.vercel.app)
- **Backend REST API:** [Clinicore API Health](https://cheerful-balance-production-e7e3.up.railway.app/health)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
