# D03 — jury prototype

Updated 6 October 2026. Show a small app that works. Do not add features the jury never asked for.

## What we show
Internal Android APK `b28bc5c0` against isolated Test. Script: `DEMO_JURY.md`.

Not App Store, Play Store, or an iOS build.

## Must path
1. Organizer PIN login, then a club with a free-text purpose. Choose **Public** when the outing should be discoverable. Choose **Sur invitation** for the private club.
2. Outing on that club.
3. Participant sees the public outing on Home.
4. Participant redeems the invite code from Club → Invitations et demandes.
5. Outsider does not see the private club or outing.
6. Participant joins and leaves the outing.
7. Data remains after the app is closed.
8. Empty club name shows an error, then retry works.

## Leave alone
Workouts, PRs, coach, pace groups, payments, matching, store submission, production auth.

## Flag for Codex
Invite flow shares a code, not an editable draft message. Test PIN login is not production auth.
