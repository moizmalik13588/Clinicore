/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Otp` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'staff', 'doctor');

-- DropForeignKey
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_user_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'staff';

-- DropTable
DROP TABLE "Otp";

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "type" "OtpType" NOT NULL DEFAULT 'email_verify',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" SERIAL NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "doctor" TEXT NOT NULL DEFAULT 'doctor',

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_tokens" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expiry_date" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_events" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "appointment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'consultation',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_user_id_idx" ON "otps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_tokens_clinic_id_key" ON "google_tokens"("clinic_id");

-- CreateIndex
CREATE INDEX "revenue_events_clinic_id_created_at_idx" ON "revenue_events"("clinic_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
