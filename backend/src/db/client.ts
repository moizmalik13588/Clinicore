import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { env } from '../config/env';

// ─── Neon ke liye pg Pool ─────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,                          // Neon free tier ke liye kam connections
  idleTimeoutMillis: 10000,        // 10 sec idle ke baad connection close
  connectionTimeoutMillis: 10000,  // 10 sec mein connect na hua to error
  allowExitOnIdle: true,           // process idle ho to pool close ho jaye
});

// Connection errors handle karo
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error:', err.message);
});

// ─── Prisma with pg adapter ───────────────────────────────────────────────────
const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

export default prisma;