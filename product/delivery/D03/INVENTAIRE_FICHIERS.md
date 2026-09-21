# D03 file inventory — Must-journey carry-over

Branch: `cursor/d03-mobile-mvp` (from `codex/d02-backend-verification` @ 4849c8b).
Source of mobile WIP: dirty local checkout `/Users/noa/Desktop/grpd3.0` on `main` (preserved).

## Intentionally carried (Must journeys / wiring)

### Auth
- `app/(auth)/phone.tsx`
- `app/(auth)/verify.tsx`
- `lib/authMode.ts`
- `lib/authIdentifier.ts`
- `lib/phone-normalize.ts`
- `lib/loginFlowStore.ts`
- `lib/supabase.ts` (PIN mode disables Supabase enablement)
- `lib/api/client.ts` (optional Preview bypass header)
- `lib/api/auth.ts`
- `.env.example`

### Club / outing / discovery
- `app/(tabs)/club/create.tsx`
- `app/(tabs)/club/index.tsx`
- `app/(tabs)/club/access.tsx`
- `app/(tabs)/club/settings.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/my-sessions.tsx`
- `app/outing/create.tsx`
- `app/outing/[id].tsx`
- `lib/api/clubs.ts`
- `lib/clubMetadata.ts`
- `lib/experiences.ts`
- `components/experiences/ExperienceUI.tsx`

### Build identity
- `app.json` (android.package, version codes)
- `eas.json`

### Delivery docs
- `product/delivery/D03/**`
- `CURSOR_HANDOFF.md`

## Explicitly not overwritten from dirty main in this pass
Unrelated redesign/workout/profile/PR/inbox-only WIP remains on local `main` working tree. Do not reset or stage-everything.

## Local-only (never commit)
- `.env.local` — Test Preview URL + bypass
- `/tmp/grpd-d02-preview-secrets.env` — PIN roles for Nouamane distribution
