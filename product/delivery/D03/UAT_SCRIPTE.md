# D03 — scripted UAT pack (initial round)

Status: prepared. Not yet executed with participants. Does not establish OCIF-approved D04 minimum.

## Participants
- Nouamane (organizer script)
- Participant 1 (guest role)
- Optional Participant 2 / outsider privacy check

## Build under test
- App version: `1.0.0` (iOS buildNumber 3 / Android versionCode 3)
- API: Preview Test — record exact deployment URL and SHA at session time
- Install: Android internal APK and/or iOS internal build when available; Expo Go only for rehearsal

## Scenarios (expected / actual / issues)

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| U1 | Organizer PIN login | Tabs open as host | | |
| U2 | Create club with free-text purpose | Club persists after reopen | | |
| U3 | Create outing on that club | Outing shows name, spot, programme, date | | |
| U4 | Participant discovers public outing | Visible on Découvrir without invite | | |
| U5 | Participant joins public outing | Appears in Mes sorties | | |
| U6 | Organizer creates invite; participant redeems | Member of private club | | |
| U7 | Outsider cannot open private club/outing | Not listed / access denied | | |
| U8 | Participant leaves selected outing | Removed; other outing kept | | |
| U9 | Kill app and reopen | Membership + participation persist | | |
| U10 | Invalid date / empty club name | Clear error; retry works | | |

## Acceptance of record
Signature/date of Nouamane: _______________  
Participant 1: _______________  
Participant 2: _______________
