/*
  Warnings:

  - The primary key for the `doctor_availability` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `doctor` on the `doctor_availability` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctor_availability" DROP CONSTRAINT "doctor_availability_pkey",
DROP COLUMN "doctor",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "doctor_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "doctor_availability_id_seq";

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
