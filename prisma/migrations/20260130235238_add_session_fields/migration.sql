-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "coachAdvice" TEXT,
ADD COLUMN     "coachName" TEXT,
ADD COLUMN     "coachPhone" TEXT,
ADD COLUMN     "hostGroupName" TEXT,
ADD COLUMN     "meetingPoint" TEXT,
ADD COLUMN     "paceGroups" JSONB;
