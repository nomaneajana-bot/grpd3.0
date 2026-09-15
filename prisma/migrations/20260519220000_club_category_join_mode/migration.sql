-- CreateEnum
CREATE TYPE "ClubCategory" AS ENUM ('mixed', 'women_only', 'technical', 'team');
CREATE TYPE "ClubJoinMode" AS ENUM ('open', 'invite', 'approval');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "clubCategory" "ClubCategory" NOT NULL DEFAULT 'mixed';
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "joinMode" "ClubJoinMode" NOT NULL DEFAULT 'invite';
