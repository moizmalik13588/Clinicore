/**
 * CLINICORE — Quick DB Connection Test
 * Run: npx ts-node src/db/test-connection.ts
 *
 * Yeh script sirf connection check karta hai, koi data change nahi karta
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

async function testConnections() {
  console.log('\n🔍 Clinicore — Connection Test\n');
  let allPassed = true;

  // ── Supabase Anon ──
  process.stdout.write('  Supabase (anon key)... ');
  try {
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { error } = await anon.from('clinics').select('id').limit(0);
    if (error && error.code !== 'PGRST301') throw error; // 301 = RLS block = still connected
    console.log('✅');
  } catch (e: any) {
    console.log('❌', e.message);
    allPassed = false;
  }

  // ── Supabase Service ──
  process.stdout.write('  Supabase (service key)... ');
  try {
    const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await service.from('clinics').select('id').limit(1);
    if (error) throw error;
    console.log(`✅  (${data?.length ?? 0} clinic rows found)`);
  } catch (e: any) {
    console.log('❌', e.message);
    allPassed = false;
  }

  // ── Prisma ──
  process.stdout.write('  Prisma (DATABASE_URL)... ');
  const prisma = new PrismaClient({ log: [] });
  try {
    await prisma.$connect();
    const count = await prisma.clinic.count();
    console.log(`✅  (${count} clinic(s) in DB)`);
  } catch (e: any) {
    console.log('❌', e.message);
    console.log('     → DATABASE_URL check karo in .env');
    console.log('     → format: postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres');
    allPassed = false;
  } finally {
    await prisma.$disconnect();
  }

  // ── Result ──
  console.log('');
  if (allPassed) {
    console.log('✅ All connections working! Day 2 ready.\n');
  } else {
    console.log('❌ Some connections failed. Fix the errors above, then re-run.\n');
    process.exit(1);
  }
}

testConnections();
