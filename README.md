<div align="center">

# 🏥 Clinicore — Healthcare & Multi-Tenant Clinic Management System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge&logo=appveyor" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-blue?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2F%20Vite%20%2F%20Tailwind-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-336791?style=for-the-badge&logo=postgresql" />
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

A modern, scalable, multi-tenant SaaS application built for healthcare providers, doctors, and clinic administrators to streamline patient records, appointments, AI voice calls, mood analytics, and medical operations.

</div>

---

## 📌 Architecture & System Overview

**Clinicore** is architected as a decoupled client-server (SPA + REST API) multi-tenant SaaS application. Each clinic operates within its isolated tenant boundary in the database while sharing robust middleware security, automated job schedulers, and AI-powered intelligence.

### 🌟 Core Feature Highlights
* **🔐 Multi-Tenant Onboarding:** Secure clinic owner registration flow (`/auth/register`) with email OTP verification (`/auth/verify-otp`) and JWT access/refresh token rotation.
* **👥 Role-Based Access Control (RBAC):** Granular permissions for `owner`, `staff`, and `doctor` roles.
* **🧑‍⚕️ Patient CRM & History:** Comprehensive patient management with duplicate prevention by phone/clinic, chief complaints, visit logs, and CRM auto-tagging.
* **📅 Appointment & Schedule Management:** Granular doctor weekly availability slots (`DoctorAvailability`), automated SMS confirmations via Twilio, and Google Calendar synchronization.
* **🎙️ AI Voice Agent & Vapi Integration:** Inbound/outbound voice call handling, real-time transcripts, and automated tool callbacks.
* **🧠 Real-Time Mood & Sentiment Analytics:** AI emotion scoring (calm, angry, anxious, frustrated, happy) during calls, intensity tracking, trends visualization via Recharts, and automated daily report generation.
* **💰 Revenue Tracking:** Financial event logging for consultations, new vs. returning patients, and recovered no-shows.

---

## 🛠️ Tech Stack & Dependencies

### Frontend (`frontend/`)
| Library / Tool | Purpose |
| :--- | :--- |
| **React 19 & Vite** | High-performance SPA dashboard UI |
| **React Router v7** | Client-side routing and protected routes |
| **Tailwind CSS & PostCSS** | Responsive styling and design system |
| **Recharts** | Interactive charts for mood trends and revenue metrics |
| **Lucide React** | Modern iconography |
| **Axios** | API client with automatic token refresh interceptors |

### Backend (`backend/`)
| Library / Tool | Purpose |
| :--- | :--- |
| **Node.js & Express.js** | REST API server |
| **Prisma ORM & PostgreSQL** | Type-safe database queries and migrations |
| **JWT & Bcryptjs** | Secure token issuance and password hashing |
| **Zod** | Runtime request body validation middleware |
| **Node-Cron** | Automated background jobs (daily reports, patient recalls) |
| **Twilio & Resend** | SMS notifications and email dispatch |
| **Googleapis** | Google Calendar API integration |

---

## 📁 Project Directory Hierarchy

```text
Clinicore/
├── backend/                  # Express API server & Prisma ORM
│   ├── prisma/               # Database schema & migration history
│   ├── src/
│   │   ├── common/           # Error handlers, JWT utils, middleware
│   │   ├── config/           # Environment validation (Zod)
│   │   ├── db/               # Database client & seeders
│   │   ├── jobs/             # Scheduled cron jobs (mood report, recall)
│   │   └── modules/          # Modular domain slices:
│   │       ├── ai/           # AI extraction & processing
│   │       ├── appointments/ # Appointment scheduling & CRUD
│   │       ├── auth/         # Registration, login, OTP verification
│   │       ├── calendar/     # Google Calendar sync
│   │       ├── calls/        # Call transcripts & logs
│   │       ├── clinics/      # Tenant clinic settings & Vapi agent
│   │       ├── crm/          # Patient history & CRM search
│   │       ├── dashboard/    # Overview stats & reports
│   │       ├── doctors/      # Doctor profiles & availability slots
│   │       ├── jobs/         # Background job triggers
│   │       ├── mood/         # Sentiment analysis & trends
│   │       ├── patients/     # Patient management
│   │       ├── revenue/      # Revenue tracking & stats
│   │       ├── sms/          # Twilio notifications
│   │       ├── vapi/         # AI voice agent webhooks & tools
│   │       └── webhooks/     # External webhook ingestion
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Vite SPA Dashboard
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── assets/           # Images & vector assets
│   │   ├── components/       # Reusable UI components & layout
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Axios API client & auth helpers
│   │   └── pages/            # View pages (Dashboard, Patients, CRM, Mood, Appointments, Doctors, Calls, Setup, Login, Register)
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── USER_GUIDE.md             # Comprehensive user & technical guide
└── README.md
```

---

## 🚀 Step-by-Step Local Setup Guide

### Prerequisites
* **Node.js** (v18 or higher)
* **PostgreSQL** (Local instance or Neon/Supabase cloud DB)

### 1. Clone the Repository
```bash
git clone https://github.com/moizmalik13588/Clinicore.git
cd Clinicore
```

### 2. Backend Setup & Run
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory (refer to [Environment Variables](#-environment-variables)). Run database migrations and start the development server:
```bash
npx prisma migrate dev
npm run dev
```
*(Backend runs on `http://localhost:3000`)*

### 3. Frontend Setup & Run
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory pointing to your backend API. Start the Vite dev server:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🔒 Environment Variables Configuration

Create `.env` files in both directories. Never commit secrets to version control.

### Backend (`backend/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/clinicore?schema=public
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_min_32_chars
API_BASE_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:5173

# Optional Integrations
RESEND_API_KEY=re_xxxxxx
RESEND_FROM=onboarding@resend.dev
RETELL_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_DEFAULT_NUMBER=
OPENROUTER_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Frontend (`frontend/.env` or `.env.production`)
```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

---

## 📦 Production Deployment Guide

* **Backend (Railway)**:
  - Deployed as a Node.js service connected to a managed PostgreSQL database.
  - Build Command: `npx prisma generate && npm run build`
  - Start Command: `npx prisma migrate deploy && npm start`
* **Frontend (Vercel)**:
  - Deployed as a static Vite SPA connected via environment variables (`VITE_API_URL`).

---

## 🌐 Live Deployments
- **Frontend App:** [Clinicore Dashboard](https://frontend-beta-amber-s2mrth6g7n.vercel.app)
- **Backend REST API:** [Clinicore API Server](https://cheerful-balance-production-e7e3.up.railway.app/health)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
