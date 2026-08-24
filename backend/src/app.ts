import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './common/middleware/error.middleware';
import { apiRateLimit } from './common/middleware/rate-limit.middleware';

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patients/patients.routes';
import doctorRoutes from './modules/doctors/doctors.routes';
import appointmentRoutes from './modules/appointments/appointments.routes';
import callRoutes from './modules/calls/calls.routes';
import crmRoutes from './modules/crm/crm.routes';
import moodRoutes from './modules/mood/mood.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import webhookRoutes from './modules/webhooks/webhooks.routes';
import smsRoutes from './modules/sms/sms.routes';
import clinicRoutes from './modules/clinics/clinics.routes';
import revenueRoutes from './modules/revenue/revenue.routes';
import aiRoutes from './modules/ai/ai.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import vapiRoutes from './modules/vapi/vapi.routes';

const app: Application = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://frontend-beta-amber-s2mrth6g7n.vercel.app',
  env.DASHBOARD_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());

// ─── JSON Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {

  console.log("================================");
  console.log(req.method);
  console.log(req.originalUrl);
  console.log(req.headers["content-type"]);
  console.log(req.body);
  console.log("================================");

  next();

});

// ─── Webhooks — raw body se pehle ─────────────────────────────────────────────
app.use('/webhooks', webhookRoutes);
app.use('/vapi', vapiRoutes);         // Vapi tools + events


// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'clinicore-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', apiRateLimit, authRoutes);
app.use('/patients', apiRateLimit, patientRoutes);
app.use('/doctors', apiRateLimit, doctorRoutes);
app.use('/appointments', apiRateLimit, appointmentRoutes);
app.use('/calls', apiRateLimit, callRoutes);
app.use('/crm', apiRateLimit, crmRoutes);
app.use('/mood', apiRateLimit, moodRoutes);
app.use('/dashboard', apiRateLimit, dashboardRoutes);
app.use('/sms', apiRateLimit, smsRoutes);
app.use('/clinics', apiRateLimit, clinicRoutes);
app.use('/revenue', apiRateLimit, revenueRoutes);
app.use('/ai', apiRateLimit, aiRoutes);
app.use('/jobs', apiRateLimit, jobsRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;