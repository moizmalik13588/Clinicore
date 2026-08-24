import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './db/client';
import { startAllJobs } from './jobs';

const PORT = parseInt(process.env.PORT || env.PORT || '3000', 10);

async function startServer() {

  // ─── DB check ─────────────────────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  // ─── HTTP server ──────────────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  // ─── Background Jobs ──────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    startAllJobs();
  }

  // ─── Listen ───────────────────────────────────────────────────────────────
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         CLINICORE BACKEND v1.0           ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Port    : ${PORT}                          ║`);
    console.log(`║  Env     : ${env.NODE_ENV.padEnd(30)}║`);
    console.log(`║  Health  : http://localhost:${PORT}/health   ║`);
    console.log(`║  Vapi    : POST /vapi/tools               ║`);
    console.log(`║  Vapi    : POST /vapi/events              ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Shutting down...`);
    httpServer.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
  });
}

startServer();