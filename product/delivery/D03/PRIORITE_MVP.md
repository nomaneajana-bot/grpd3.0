# D03 — prioritized mobile MVP cut (rehearsal)

Updated 21 September 2026. Implementation priorities only; approved OCIF scope unchanged.

## Label in force
Working toward **MVP ready for rehearsal** (not “D03 delivered”, not OCIF complete).

## Must journeys (demo script aligned)
1. Organizer PIN auth → create club (unrestricted purpose / description).
2. Organizer create outing linked to that club.
3. Participant discovers public club/outing.
4. Participant redeems private invitation.
5. Outsider cannot discover/access private info.
6. Participant joins and leaves selected outing.
7. Persistence across restart (server Test DB).
8. Usable missing/invalid/failure/retry handling on those paths.

## Not priorities this cut (preserve, do not expand)
Workouts, PRs, coach assignment, pace groups, inbox expansion, payments, romantic matching.

## Discrepancies flagged (not silent scope changes)
- D01-M04 describes an editable invitation *draft text*; mobile currently shares **invite codes**. Flagged for Codex dossier language; code flow keeps Must privacy journey.
- Demo auth is PIN allowlist on isolated Test — **not** approved production auth.
- Preview + `grpd_d02_test` does **not** satisfy D05.
- Expo Go may rehearse; native APK / internal iOS still required for D03.4 evidence.

## Implementation order (this pass)
1. Wire PIN + Preview API (stop mock force; phone identifier; PIN wins over Supabase leftovers).
2. Optional `EXPO_PUBLIC_VERCEL_BYPASS` header for protected Preview device calls.
3. Three Test roles on Preview allowlist: host, guest, outsider.
4. Android `package` + version identifiers in `app.json`.
5. Inventory dirty Must-journey files onto `cursor/d03-mobile-mvp`.
6. Attempt internal Android preview build; record iOS signing blockers early.
7. Scripted UAT pack prepared (Nouamane + 1–2 participants) — execution after installable build.

## Backend baseline
Published D02 Preview: commit `05f73a4`, deployment `dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2`, DB `grpd_d02_test`. Hosted-check 8/8 PASS evidence under `product/delivery/D02/evidence/2026-09-21/`.
