# Semantic / product-logic audit

**SHA:** `c2a1e1eda1eb25597d69c45b6335cc89b56e5270`  
**Generated:** 2026-10-13T03:46:56.814Z  
**Surfaces:** demo (executed) · same-device switch (executed) · hosted (**BLOCKED**) · cross-device (**BLOCKED**)

## Summary

| Result | Count |
|--------|------:|
| PASS | 13 |
| FAIL | 0 |
| BLOCKED | 2 |
| Contradictions flagged | 2 |

Green design preserved. This is **not** an MVP-ready claim.

## Meaning map (membership ≠ attendance ≠ pace group)

| Concept | Meaning in product |
|---------|-------------------|
| Club membership | Access boundary to a club (pending | approved). Invite **code** → approved; **request** → pending. |
| Outing attendance | Explicit S'inscrire / Quitter on a session. Must not be implied by membership. |
| Pace group | Optional allure bucket for a session; not club membership. |
| Visibility public | Anyone can attempt join (subject to other gates). |
| Visibility members | Requires approved membership of that club; outsiders get request/lock. |
| Organizer controls | Modifier/Supprimer only when `hostUserId` matches viewer — not merely `isCustom`. |

## Ranked contradiction register

### 1. [P2] UNSUPPORTED: hosted cross-device persistence not verified in this run
- **Impact:** Cannot claim attendance survives devices/backends
- **Scenario:** S10-unsupported-policies
- **Evidence:** No hosted preview URL/credentials in cloud agent

### 2. [P2] UNSUPPORTED: expired invites / cancel outing / capacity-full lifecycle
- **Impact:** No product path exercised for expire/cancel/full in demo mock
- **Scenario:** S10-unsupported-policies
- **Evidence:** Mock invite codes do not expire; no cancel-outing control found


## Scenario log

### S1-two-clubs — PASS
- **Title:** Organizer creates two distinct clubs with distinct invites
- **Persona:** organizer
- **Setup:** Fresh DEMO_MODE; real OTP login
- **Steps:** 
  1. Login as organizer
  1. Create Club Alpha + generate invite
  1. Create Club Beta + generate invite
  1. Verify Clubs list shows both; codes differ
- **Expected meaning:** Each club is a separate membership boundary with its own invite code
- **Actual:** clubsVisible A=true B=true; codeA=AUDIT2CR codeB=AUDITMQL; betaFocused=true
- **Surface:** demo
- **Screenshot:** screenshots/S1-club-b-invite.png

### S2-invite-joins-intended-club — PASS
- **Title:** Invite code joins the intended club; membership ≠ attendance
- **Persona:** member
- **Setup:** Fresh login; use invite AUDIT2CR
- **Steps:** 
  1. Login as member phone
  1. Club access → enter Club A invite → Rejoindre
  1. Check Clubs list for Alpha only
  1. Check Mes sorties not auto-filled
- **Expected meaning:** Code grants membership to that club only; does not enroll in outings
- **Actual:** joinedMsg=true; pending=false; clubList A=true B=false; autoAttended=false
- **Surface:** demo
- **Screenshot:** screenshots/S2-after-invite-join.png

### S3-outsider-not-auto-member — PASS
- **Title:** Outsider login is not silently a Casa club member
- **Persona:** outsider
- **Setup:** Fresh login with non-demo phone
- **Steps:** 
  1. Login
  1. Open Clubs
  1. Assert no approved Casa membership
- **Expected meaning:** Only invite/request (or canonical demo phone) creates membership
- **Actual:** hasCasa=false; memberBadge=false; emptyOrJoinCTA=true
- **Surface:** demo
- **Screenshot:** screenshots/S3-outsider-clubs.png

### S4-pending-not-approved — PASS
- **Title:** Club join request stays pending (not approved)
- **Persona:** pending
- **Setup:** Fresh login; request Club Alpha by name
- **Steps:** 
  1. Login
  1. Accès club → Demander à rejoindre
  1. Check Clubs status
- **Expected meaning:** Pending applicant cannot act as approved member
- **Actual:** filled=true; pendingUI=true; approvedAsMember=false; snippet=‹
Club
Accès club
Invitations, demandes et administration.
REJOINDRE AVEC CODE
Code d'invitation
Rejoindre
DEMANDER À REJOINDRE
Nom du club
Si tu n'as pas de code, entre le nom du club.
Message (optionnel)
Envoyer la dem
- **Surface:** demo
- **Screenshot:** screenshots/S4-after-request.png

### S5-join-leave-consistency — PASS
- **Title:** Join/leave updates detail + persists across reload; Mes sorties consistent
- **Persona:** member
- **Setup:** Member account; public seed outing
- **Steps:** 
  1. Open public outing
  1. S'inscrire → assert leave CTA
  1. Check Mes sorties
  1. Reload detail → still joined
  1. Quitter → join CTA returns
- **Expected meaning:** Attendance is explicit, durable in-session, and reflected in My outings
- **Actual:** before={"join":true,"leave":false,"modify":false}; afterJoin={"leave":true,"join":false}; inMy=true; afterReload={"leave":true,"join":false}; afterLeave={"leave":false,"join":true}
- **Surface:** demo
- **Screenshot:** screenshots/S5-after-join.png

### S6-members-only-privacy — PASS
- **Title:** Members-only outing: outsider direct link cannot join or see logistics
- **Persona:** organizer→outsider
- **Setup:** Organizer publishes members-only; outsider opens /session/:id
- **Steps:** 
  1. Organizer create members-only outing
  1. Outsider login
  1. Open direct session URL
  1. Assert no join + no private logistics
- **Expected meaning:** Visibility=members gates attendance and sensitive details
- **Actual:** canJoin=false; requestOnly=false; privateLogistics=false; text=←
Retour
Créer une séance
TYPE DE SÉANCE
Choisis si tu veux utiliser un workout structuré ou créer une séance libre.
Workout structuré
Course libre
Découverte
Marche
Type de séance structurée
✓
FARTLEK
SORTIE LONGUE
SEUIL
INFOS DE BASE
Spot
- **Surface:** demo
- **Screenshot:** screenshots/S6-outsider-direct-link.png

### S7-standalone-no-club-context — PASS
- **Title:** Standalone public outing does not inherit club membership context
- **Persona:** organizer
- **Setup:** Organizer with clubs; publish Public outing
- **Steps:** 
  1. Create session
  1. Select Public
  1. Publish
  1. Assert no members-only club framing
- **Expected meaning:** Public outings are independent of club membership
- **Actual:** url=http://localhost:8081/session/session_1791863035523_wzsg2lpl; inheritedClub=false; looksPublic=true; snippet=‹
Marina
Modifier
FARTLEK
FARTLEK
MARDI 13 OCTOBRE 06:00 · Marina
Infos
— km
DISTANCE
Allure libre
/KM
—
COUREURS
INFORMATIONS
Type de course
FARTLEK ›
Distance
—
Rendez-vous
Marina
Organisateur
Équip
- **Surface:** demo
- **Screenshot:** screenshots/S7-after-publish.png

### S8-walk-language-no-run-assumptions — PASS
- **Title:** Walking/language users are not forced into running goals/pace/coach
- **Persona:** outsider
- **Setup:** Fresh outsider; inspect Découvrir filters + create + profile
- **Steps:** 
  1. Open Découvrir community/langues filters
  1. Open Créer une séance
  1. Open Profil
  1. Assert walk path exists; no mandatory 10k/VO2
- **Expected meaning:** Community/walk experiences are first-class without run PR framing
- **Actual:** forcesRunOnlyCreate=false; hasWalkPath=true; profileForces10k=false
- **Surface:** demo
- **Screenshot:** screenshots/S8-discover-filters.png

### S9-account-switch — PASS
- **Title:** Same-device account switch does not leak attendance
- **Persona:** member→outsider
- **Setup:** Member joins outing; switch account via real OTP (auth cleared, club world preserved)
- **Steps:** 
  1. Member join
  1. Outsider login (auth cleared, clubs preserved)
  1. Open same outing
- **Expected meaning:** Attendance is per-identity, not device-global after switch
- **Actual:** memberJoined=true; outsider={"leave":false,"join":true}
- **Surface:** demo-same-device-switch
- **Screenshot:** screenshots/S9-outsider-after-switch.png

### S10-unsupported-policies — PASS
- **Title:** Unsupported policies flagged honestly (expire/cancel/full/hosted)
- **Persona:** organizer
- **Setup:** Inspect session + invite UI for claimed vs implemented policies
- **Steps:** 
  1. Open outing detail
  1. Open club access
  1. Record claims vs support
- **Expected meaning:** Product must not silently invent expire/cancel/full/hosted guarantees
- **Actual:** UI claims full/waitlist=false; cancelOuting=false; expireInvite=false
- **Surface:** demo
- **Screenshot:** screenshots/S10-session-detail.png

### S11-action-labels — PASS
- **Title:** Action labels: Publier (create) vs S'inscrire/Demander/Quitter (detail)
- **Persona:** member
- **Setup:** Compare create CTA vs detail CTAs
- **Steps:** 
  1. Open create
  1. Open detail
  1. Record CTA copy
- **Expected meaning:** Publish ≠ attend; request ≠ join; leave ≠ delete outing
- **Actual:** publishOnCreate=true; detail={"join":"S&apos;inscrire"}
- **Surface:** demo
- **Screenshot:** screenshots/S11-labels.png

### S14-leave-club-while-attending — PASS
- **Title:** Leave club while attending members-only outing clears membership and attendance
- **Persona:** member
- **Setup:** Member of Club Alpha attending a members-only outing of that club
- **Steps:** 
  1. Ensure approved membership + members-only outing
  1. S'inscrire on members-only outing
  1. Quitter le club
  1. Assert not member; outing attendance revoked; Mes sorties consistent
- **Expected meaning:** Leaving membership revokes members-only attendance (membership gate), without inventing public-outing cleanup
- **Actual:** leftOk=true; stillMember=false; outing={"join":false,"leave":false,"missing":true}; stillInMy=false; privacyOrCleared=true
- **Surface:** demo
- **Screenshot:** screenshots/S14-after-leave-club.png

### S15-toi-matches-roster-count — PASS
- **Title:** Pace-group TOI uses same assignment as roster member counts
- **Persona:** member
- **Setup:** Approved member viewing Clubs → Groupes de pace
- **Steps:** 
  1. Join/open Club Alpha
  1. Read TOI badge and member counts on pace rows
  1. Assert exactly one TOI and that group's count ≥ 1
- **Expected meaning:** Your pace group label (TOI) must be the same bucket that counts you in the roster
- **Actual:** clubVisible=true; groups=[{"gid":"A","hasToi":false,"count":0,"text":"Groupe A — ÉliteSub 4:30/km · 0 membres · 0 séances cette sem.›"},{"gid":"B","hasToi":true,"count":1,"text":"Groupe B — IntermédiaireTOI4:30–5:30/km · 1 membre · 1 séance cette sem.?›"},{"gid":"C","hasToi":false,"count":0,"text":"Groupe C — Découverte5:30–7:00/km · 0 membres · 0 séances cette sem.›"},{"gid":"D","hasToi":false,"count":1,"text":"Groupe D — Social7:00+/km · 1 membre · 1 séance cette sem.?›"}]
- **Surface:** demo
- **Screenshot:** screenshots/S15-pace-groups.png

### S12-hosted-blocked — BLOCKED
- **Title:** Hosted journey acceptance
- **Persona:** n/a
- **Setup:** Cloud agent environment
- **Steps:** 
  1. Check for hosted preview URL
- **Expected meaning:** Hosted persistence separate from demo localStorage
- **Actual:** No hosted preview credentials/URL in this run
- **Surface:** hosted
- **Screenshot:** —

### S13-cross-device-blocked — BLOCKED
- **Title:** Cross-device persistence
- **Persona:** n/a
- **Setup:** Requires two devices or hosted backend
- **Steps:** 
  1. Join on device A
  1. Login on device B
- **Expected meaning:** Attendance follows account across devices
- **Actual:** Not executable without hosted API + second device
- **Surface:** cross-device
- **Screenshot:** —


## Preview

```bash
EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
# http://localhost:8081/reference/green-home
# http://localhost:8081/
```

## Remaining gaps (honest / not silently invented)

| Gap | Status | Notes |
|-----|--------|-------|
| Past / full / cancelled outing lifecycle | UNSUPPORTED in demo mock | No expire/cancel/capacity enforcement exercised |
| Hosted journey | BLOCKED | No hosted preview URL in cloud agent |
| Cross-device persistence | BLOCKED | Requires hosted API + second device |
| Expired invites | UNSUPPORTED | Mock invite codes do not expire |
| Toast overlapping form labels on Accès club | Visual QA | Absolute toast can cover section headers |

## Fixes applied during this audit (within existing behavior)

1. Leaving a club in DEMO_MODE revokes members-only attendance for that club
2. Pace-group TOI uses `assignMemberToClubGroup` (same as roster bucket counts)
3. Leave-club clears focused club id; `club-leave-btn` / pace-group testIDs for audit
4. Earlier: no silent Casa auto-approve; hostUserId organizer gate; public `clubId: null`; multi-club switcher; unique invites

Green design preserved. **Not an MVP-ready claim.**

No merge / production / spend / credential changes / OCIF submission.
