-- Additive: existing training records and identifiers are preserved.
ALTER TABLE "sessions" ADD COLUMN "experience" JSONB;
