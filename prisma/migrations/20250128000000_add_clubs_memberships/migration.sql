-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('public', 'members');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('member', 'coach', 'admin');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('pending', 'approved', 'rejected', 'banned');

-- CreateEnum
CREATE TYPE "SessionVisibility" AS ENUM ('public', 'members');

-- CreateEnum
CREATE TYPE "GenderRestriction" AS ENUM ('mixed', 'women', 'men');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('joined', 'requested', 'waitlisted', 'declined');

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "description" TEXT,
    "visibility" "ClubVisibility" NOT NULL DEFAULT 'public',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "status" "MembershipStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_invites" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "invitedPhone" TEXT,
    "invitedEmail" TEXT,
    "role" "MembershipRole",
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "spot" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "dateISO" TEXT,
    "timeMinutes" INTEGER,
    "typeLabel" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "targetPace" TEXT NOT NULL,
    "estimatedDistanceKm" DOUBLE PRECISION NOT NULL,
    "recommendedGroupId" TEXT NOT NULL,
    "clubId" TEXT,
    "visibility" "SessionVisibility" NOT NULL DEFAULT 'public',
    "genderRestriction" "GenderRestriction" NOT NULL DEFAULT 'mixed',
    "hostUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutId" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'requested',
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "clubs_slug_idx" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "clubs_createdById_idx" ON "clubs"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_userId_clubId_key" ON "club_memberships"("userId", "clubId");

-- CreateIndex
CREATE INDEX "club_memberships_userId_idx" ON "club_memberships"("userId");

-- CreateIndex
CREATE INDEX "club_memberships_clubId_idx" ON "club_memberships"("clubId");

-- CreateIndex
CREATE INDEX "club_memberships_clubId_status_idx" ON "club_memberships"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "club_invites_code_key" ON "club_invites"("code");

-- CreateIndex
CREATE INDEX "club_invites_code_idx" ON "club_invites"("code");

-- CreateIndex
CREATE INDEX "club_invites_clubId_idx" ON "club_invites"("clubId");

-- CreateIndex
CREATE INDEX "club_invites_expiresAt_idx" ON "club_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_clubId_idx" ON "sessions"("clubId");

-- CreateIndex
CREATE INDEX "sessions_hostUserId_idx" ON "sessions"("hostUserId");

-- CreateIndex
CREATE INDEX "sessions_dateISO_idx" ON "sessions"("dateISO");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendance_sessionId_userId_key" ON "session_attendance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "session_attendance_sessionId_idx" ON "session_attendance"("sessionId");

-- CreateIndex
CREATE INDEX "session_attendance_userId_idx" ON "session_attendance"("userId");

-- CreateIndex
CREATE INDEX "session_attendance_sessionId_status_idx" ON "session_attendance"("sessionId", "status");

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invites" ADD CONSTRAINT "club_invites_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
