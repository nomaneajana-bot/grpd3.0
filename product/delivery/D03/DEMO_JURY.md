# Jury demo — working prototype (6 October 2026)

Not an App Store or Play Store release. Not OCIF acceptance.

The showing artifact is the internal Android APK already built against isolated Test.

- Build: `b28bc5c0-9261-45fe-ad0b-e3d4362e1510`
- Commit baked into that APK: `59d4836`
- Install: https://expo.dev/accounts/noasmap/projects/grpd30/builds/b28bc5c0-9261-45fe-ad0b-e3d4362e1510
- API: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- Auth: PIN on Test only. Phones `+212600000001` (organizer), `+212600000002` (participant), `+212600000003` (outsider). PINs stay with Nouamane and are not written here.

## What to show

1. Organizer signs in and creates a club with any purpose text.
2. Organizer creates an outing on that club.
3. Participant signs in on a second phone, or after logout, and finds the public outing.
4. Organizer shares an invite code. Participant enters it.
5. Outsider does not see the private club or outing.
6. Participant joins the outing, then leaves it.
7. Close and reopen the app. The club and attendance are still there.
8. Submit an empty club name and show the error, then retry.

Device Must on this APK has not been run yet. API journeys for the same steps passed on Test on 21 September. Health was rechecked on 6 October (`ok=true`, `database=ready`).

iOS internal build is optional for this showing. Apple distribution credentials are still missing, and a store listing is not required.
