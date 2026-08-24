/*
  Warnings:

  - You are about to drop the `otps` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('email_verify', 'login');

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_user_id_fkey";

-- DropTable
DROP TABLE "otps";

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
