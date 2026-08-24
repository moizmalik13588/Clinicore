# 🏥 Clinicore — Healthcare & Multi-Tenant Clinic Management System

A modern, scalable, multi-tenant SaaS application built for healthcare providers, doctors, and clinic administrators to streamline patient records, appointments, and medical operations.

---

## 📌 Architecture & Features

* **🔐 Multi-Tenant Onboarding:** Secure clinic owner registration and role-based access management (SuperAdmin, Clinic Owner, Doctor, Patient).
* **⚡ High-Performance API:** RESTful architecture powered by Express.js and PostgreSQL with strict data validation.
* **🎨 Responsive UI/UX:** Fast, accessible dashboard built with React, Tailwind CSS, and optimized layout routing.
* **📦 Production Ready:** Structured code isolation with dedicated `frontend/` and `backend/` micro-services layout.

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Vite, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt |
| **Deployment** | Vercel (Frontend), Railway (Backend) |

---

## 📁 Project Hierarchy

```text
Clinicore/
├── backend/          # Express API server & DB logic
├── frontend/         # React SPA dashboard & UI components
├── .gitignore        # Root ignored files (env, node_modules)
└── README.md         # System documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js (v18+)
* PostgreSQL DB instance

### Local Setup

**Clone Repository:**
```bash
git clone https://github.com/moizmalik13588/Clinicore.git
cd Clinicore
```

**Backend Config:**
```bash
cd backend
npm install
# Create a .env file with DATABASE_URL and JWT_SECRET
npm run dev
```

**Frontend Config:**
```bash
cd ../frontend
npm install
# Create a .env file with VITE_API_BASE_URL
npm run dev
```

---

## 🔒 Environment Variables

Ensure `.env` files are configured locally (never committed to version control):

**Backend (`backend/.env`):**
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/clinicore
JWT_SECRET=your_jwt_secret_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📄 License

Distributed under the MIT License.
