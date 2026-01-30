-- Add PR sharing fields to club_memberships
ALTER TABLE "club_memberships"
  ADD COLUMN IF NOT EXISTS "displayName" TEXT,
  ADD COLUMN IF NOT EXISTS "sharePrs" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "prSummary" JSONB;
