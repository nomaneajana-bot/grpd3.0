# Dependencies — status 6 October 2026

Jury target: internal Android prototype. Store listing and iOS signing are not required for that showing.

| ID | Dependency | Threatens | Status 6 Oct |
| --- | --- | --- | --- |
| DEP-01 | EAS login and linked project | Android rebuilds | Done. Account `noasmap`, project `4b7aa073-d7c7-4bdb-a525-3cb6ce3a9ef3`, committed on `cursor/d03-mobile-mvp`. |
| DEP-02 | Apple distribution credentials | iOS build only | Open, and **not** on the jury path. |
| DEP-03 | Internal Android APK | Jury phone demo | APK `b28bc5c0` exists. This machine still has no phone or emulator, so the script is not yet run. |
| DEP-04 | Test PINs for the three demo phones | Live login during the showing | Phones are `+212600000001` / `002` / `003`. PIN values are not on this machine. Nouamane must have them at the demo. |
| DEP-05 | D02 hosted evidence | Dossier, not the demo | Last full suite 21 Sep. Health rechecked 6 Oct: `database=ready`. Authenticated suite not re-run. |
| DEP-12 | Production authorization | D05 go-live | Not requested. Do not merge `main` or promote Production. |

Codex still owns annexes, invoices, bank originals, and OCIF assembly. Those do not block the Android showing.
