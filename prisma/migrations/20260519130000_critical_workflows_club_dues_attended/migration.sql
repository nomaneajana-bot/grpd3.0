-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'attended';

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "duesAmountCents" INTEGER;
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "duesLabel" TEXT;

-- AlterTable
ALTER TABLE "club_memberships" ADD COLUMN IF NOT EXISTS "duesPaid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "session_attendance" ADD COLUMN IF NOT EXISTS "actualDistanceKm" DOUBLE PRECISION;
ALTER TABLE "session_attendance" ADD COLUMN IF NOT EXISTS "actualDurationMin" INTEGER;
ALTER TABLE "session_attendance" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
