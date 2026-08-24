/**
 * CLINICORE — Day 2 Seed Script
 *
 * Kya karta hai:
 * 1. Supabase connection test karta hai
 * 2. Ek clinic row insert karta hai (agar pehle se nahi hai)
 * 3. Ek owner user create karta hai Supabase Auth mein
 * 4. Sab tables verify karta hai
 *
 * Run: npx ts-node src/db/seed.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL aur SUPABASE_SERVICE_KEY .env mein set karo');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Config — apni clinic ki info yahan dalo ──────────────────────────────────
const CLINIC_CONFIG = {
  name: 'Clinicore Demo Clinic',
  phone: '+923001234567',
  email: 'admin@clinicore.demo',
  address: 'Karachi, Pakistan',
  business_hours: {
    monday:    { open: '09:00', close: '17:00' },
    tuesday:   { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday:  { open: '09:00', close: '17:00' },
    friday:    { open: '09:00', close: '17:00' },
    saturday:  { open: '10:00', close: '14:00' },
    sunday:    null,
  },
  appt_duration_mins: 30,
};

const OWNER_CONFIG = {
  email: 'owner@clinicore.demo',
  password: 'Clinicore@123', // Change this in production!
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Clinicore Day 2 — Seed Script\n');
  console.log('━'.repeat(50));

  // ── Step 1: Connection Test ──
  console.log('\n[1/4] Supabase connection test...');
  const { error: pingError } = await supabase.from('clinics').select('id').limit(1);
  if (pingError && pingError.code !== 'PGRST116') {
    console.error('❌ Connection failed:', pingError.message);
    console.error('   → Supabase URL aur Service Key check karo');
    console.error('   → SQL schema pehle run karo (src/db/schema.sql)');
    process.exit(1);
  }
  console.log('   ✅ Supabase connected!');

  // ── Step 2: Tables Verify ──
  console.log('\n[2/4] Tables verify kar raha hoon...');
  const expectedTables = [
    'clinics', 'doctors', 'patients', 'appointments',
    'calls', 'visit_history', 'mood_events', 'revenue_events',
  ];

  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.error(`   ❌ Table "${table}" nahi mili: ${error.message}`);
      console.error('   → pehle schema.sql Supabase SQL Editor mein run karo');
      process.exit(1);
    }
    console.log(`   ✅ ${table}`);
  }

  // ── Step 3: Clinic Row ──
  console.log('\n[3/4] Clinic row check/create...');

  const { data: existingClinics } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('email', CLINIC_CONFIG.email)
    .limit(1);

  let clinicId: string;

  if (existingClinics && existingClinics.length > 0) {
    clinicId = existingClinics[0].id;
    console.log(`   ⚡ Clinic already exists: ${existingClinics[0].name}`);
    console.log(`   ID: ${clinicId}`);
  } else {
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert(CLINIC_CONFIG)
      .select()
      .single();

    if (clinicError || !clinic) {
      console.error('   ❌ Clinic insert failed:', clinicError?.message);
      process.exit(1);
    }

    clinicId = clinic.id;
    console.log(`   ✅ Clinic created: ${clinic.name}`);
    console.log(`   ID: ${clinicId}`);
  }

  // ── Step 4: Owner User ──
  console.log('\n[4/4] Owner user check/create...');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === OWNER_CONFIG.email);

  if (existingUser) {
    console.log(`   ⚡ User already exists: ${OWNER_CONFIG.email}`);

    // Update metadata with clinic_id if missing
    if (!existingUser.user_metadata?.clinic_id) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { clinic_id: clinicId, role: 'owner' },
      });
      console.log('   ✅ clinic_id metadata updated');
    }
  } else {
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: OWNER_CONFIG.email,
      password: OWNER_CONFIG.password,
      email_confirm: true,
      user_metadata: {
        clinic_id: clinicId,
        role: 'owner',
        name: 'Clinic Owner',
      },
    });

    if (userError || !newUser) {
      console.error('   ❌ User create failed:', userError?.message);
      process.exit(1);
    }

    console.log(`   ✅ Owner user created: ${OWNER_CONFIG.email}`);
    console.log(`   User ID: ${newUser.user.id}`);
  }

  // ── Summary ──
  console.log('\n' + '━'.repeat(50));
  console.log('✅ DAY 2 COMPLETE!\n');
  console.log('📋 Demo Credentials:');
  console.log(`   Email    : ${OWNER_CONFIG.email}`);
  console.log(`   Password : ${OWNER_CONFIG.password}`);
  console.log(`   Clinic ID: ${clinicId}`);
  console.log('\n📌 .env mein yeh add karo:');
  console.log(`   CLINIC_ID=${clinicId}`);
  console.log('\n🧪 Test karo:');
  console.log('   npm run dev');
  console.log('   curl http://localhost:3000/health');
  console.log('\n🗓️  Agle kadam (Day 3):');
  console.log('   → auth.routes.ts mein clinic_id fetch karo patients table se');
  console.log('   → patients CRUD implement karo');
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Seed script fail ho gaya:', err);
  process.exit(1);
});
