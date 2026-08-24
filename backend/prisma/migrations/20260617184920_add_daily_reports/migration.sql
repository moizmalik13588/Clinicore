-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "total_calls" INTEGER NOT NULL DEFAULT 0,
    "total_mood_events" INTEGER NOT NULL DEFAULT 0,
    "calm_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "angry_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anxious_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frustrated_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "happy_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flagged_calls" INTEGER NOT NULL DEFAULT 0,
    "dominant_mood" TEXT NOT NULL DEFAULT 'calm',
    "alert_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_clinic_id_report_date_key" ON "daily_reports"("clinic_id", "report_date");

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
