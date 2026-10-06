# Jury demo — working prototype (6 October 2026)

Not an App Store or Play Store release. Not OCIF acceptance.

The showing is a laptop browser on isolated Test. No store install.

- Start: in `/tmp/grpd-d03-worktree`, with gitignored `.env.local` (PIN mode, Test API, bypass), run `npx expo start --web`
- Open: http://localhost:8081
- API: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- Auth: PIN on Test only. Phones `+212600000001` (organizer), `+212600000002` (participant), `+212600000003` (outsider). PINs stay with Nouamane and are not written here.
- First screen: **J'ai déjà un compte**, then the phone, then the PIN.
- Android APK `b28bc5c0` remains available and is not required for this showing.

## What to tap

1. Organizer (`+212600000001`) signs in. Home → **Créer mon club**. Set access to **Public**, add any purpose, create it.
2. Club tab → **Organiser une sortie du club**. Publish a future date (`AAAA-MM-JJ`, `HH:MM`).
3. Participant (`+212600000002`) signs in. Home lists that public outing.
4. For the private half, create a second club with access **Sur invitation**. Club → **Invitations et demandes**, create a code. Participant enters it.
5. Outsider (`+212600000003`) signs in. The private club and its outing are absent.
6. Participant joins the outing, then leaves it.
7. Force-close and reopen. The club and attendance are still there.
8. Try to create a club with an empty name. The error shows. Retry with a name.

Device Must on this APK has not been run yet. API journeys for the same steps passed on Test on 21 September. Health was rechecked on 6 October (`ok=true`, `database=ready`).

iOS internal build is optional for this showing. Apple distribution credentials are still missing, and a store listing is not required.
