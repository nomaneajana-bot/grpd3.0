-- Club home pace group (TOI) on membership — distinct from session attendance.groupId
ALTER TABLE "club_memberships" ADD COLUMN IF NOT EXISTS "homeGroupId" TEXT;
