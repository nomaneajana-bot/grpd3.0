# Product Rules / Decision Map (canonical)

**Branch:** `cursor/green-home-ux-join-3184`  
**Pinned product baseline:** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Docs tip:** branch HEAD (documentation revision only)  
**Legend:** **I** = implemented behavior in code · **R** = intended behavior supported by user requirements / prior agreement · **U** = unresolved (needs product decision)

---

## 1. Membership vs attendance vs pace group

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Club membership is access boundary (`pending` \| `approved` \| …) | I | R | | Invite code → approved; name request → pending |
| Outing attendance requires explicit S'inscrire / Quitter | I | R | | Membership must not auto-enroll outings |
| Session creator auto-joins their new outing | I | | **U** | Implemented in create flow; **not** user-approved as requirement — confirm for members-only and public |
| Pace groups A–D are session/roster buckets, not membership | I | R | | Club home-group (TOI) separate from session groupId |
| TOI uses same assignment as roster counts | I | R | | `assignMemberToClubGroup` + `bucketMembersByGroup`; Batch 4 ISSUE-011 demo evidence PASS at `de5402a` (awaiting Codex) |
| Assign/suggest ≠ joined | I | R | | Invariant (b) |

## 2. Visibility vs club association (do not conflate)

**Visibility** (who may see/join) is distinct from **association** (whether an outing is linked to a club for discovery, branding, or roster context).

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Standalone public outing: no *inherited* club from focused membership | I | R | | Choosing public without opting into a club must not silently inherit focused `clubId` |
| Every `visibility: public` create forces `clubId: null` | I | | **U** | Current code simplification — **not** a user-approved requirement. Does **not** establish that every public *club* outing must lose association |
| Public outing that remains associated with a club (soft link) | | | **U** | Unresolved product question — see § Unresolved |
| `visibility: members` ⇒ `clubId` required | I | R | | Invariant (a) |
| Demo public seeds must not carry accidental clubId | I | R | | Fixed in `demoSeed` on tip |
| Members-only private logistics hidden from non-members | I (demo mock + hosted GET) | R | | **Current baseline — preserve.** Prefer gated 404 / inaccessible over leaking spot/time/private copy. No permission needed to keep this. |
| Members-only list filtered for non-members | I (hosted list) | R | | Demo list paths may still differ — verify per surface in privacy batch |
| Outsiders see MEMBRES tag / teaser without logistics | | | **U** | Optional UX later; **not** required to reopen privacy baseline |

## 3. Invitations / pending / approval

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Invite code joins the club that owns the code | I | R | | Unique codes; multi-club picker for generate |
| Pending applicant is not approved member | I | R | | Session join blocked while pending; privacy negative control |
| Approve/reject pending in admin UI | Partial I | R | U | Confirm connected API coverage |
| Invite expiry | NOT IMPLEMENTED (UI never sets expiresAt; mock never expires) | | U | Do not PASS as supported |
| Leave club / cancel pending client calls | I mock + I hosted routes | R | | Hosted `POST …/leave` + `…/cancel-request` at Batch 5 `a7f1f9a`; local PG PASS; hosted Preview VERIFIED blocked on SSO |
| Leave = approved member only; cancel = pending only | I hosted | R | | Wrong status → 409 WRONG_STATUS |
| Sole approved admin cannot leave (no transfer/deletion invented) | I hosted | R | **U** transfer UX | Decision Batch 5: reject `LAST_ADMIN` 409; do not delete club |
| Leave revokes members-only attendance for actor; public attendance unchanged | I hosted | R | | Matches demo intent; PG-tested |

## 4. Owner / organizer permissions

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Modifier/Supprimer when `hostUserId` matches viewer | I | R | | Not mere `isCustom` |
| Header Modifier also host-gated | I | R | | Fixed this branch |
| Coach assign on members-only for coach/admin | I | R | | |
| Non-host must not edit outing | I | R | | |

## 5. Club vs standalone outing

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Public outing usable without club membership | I | R | | Access ≠ association (see §2) |
| Members-only bind to selected/focused club when multi-club | I | R | | Create club picker + focused club persistence |
| Two clubs must never silently share invites/edits | Partial I | R | | Switcher exists; still needs journey VERIFIED |
| Leaving club revokes members-only attendance for that club | I demo | R | U | Hosted leave route missing; privacy retest in Batch 1 (demo) |

## 6. Cancellation / dates / persistence

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Create uses real upcoming ISO dates | I | R | | |
| Cancel club outing (status cancelled) | NOT IMPLEMENTED | | U | Only local delete for host custom |
| Capacity full / waitlist | NOT IMPLEMENTED for Session | | U | Run capacity is separate/legacy |
| Demo persistence = device localStorage mock | I | | | Not hosted — never claim hosted from mock |
| Hosted account persistence | BLOCKED without hosted env/creds | R | | Two **isolated browser contexts** (or equivalent) can exercise same-account persistence — a physical second device is **not** inherently required |
| Cross-device / native | Separate surfaces | R | | Only when those environments exist |
| Join/leave updates detail + Mes sorties after reload | I demo (audit S5) | R | | Re-verify with correct-screen assertions |

## 7. Walking / language / community (user-required)

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Club purposes are **not** runners-only | | **R** | | User already requires unrestricted club purposes — **do not re-ask** whether runners-only framing is acceptable |
| Discover can filter/label Marche | I | R | | |
| Walk / language journeys must be **usable** end-to-end | I (demo) | **R** | | Batch 2: title/purpose/spot agree; walking hides pace groups; language optional (no English default); join without pace group; M06 cancel ≠ leave club. ISSUE-003 — demo evidence awaiting Codex; hosted not claimed |
| Home idea cards are illustrative concepts (not bookable); open idea explanation / club-create — never training PRs | I (demo) | **R** | | ISSUE-002 — Batch 3 DEMO CLEARED (functional) |
| Club purposes unrestricted (no mandatory English/running fields) | I (demo) | **R** | | M02 Batch 3 |
| Organise-from-club carries explicit clubId; standalone public does not inherit stale focused club | I (demo) | **R** | | M03 Batch 3; public still nulls clubId (unresolved association rule preserved) |

## 8. Testing / audit honesty

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| PASS requires correct screen + successful setup + actual effects | | R | | Method doctrine; S6 violated historically (ISSUE-001) |
| Private logistics assertion = known unique private fields **absent**, not merely “no join button” | | R | | Batch 1 privacy evidence standard |
| Unsupported ≠ PASS; mock ≠ hosted claim | | R | | |
| Audit / evidence must record tested SHA + environment | Partial | R | | ISSUE-005 |
| Auth journey evidence = real UI OTP (agreed surface) | I in audit script | R | | |
| UAT = actual participant / stakeholder sessions | | R | | **Not** founder acceptance alone |

---

## Unresolved questions (product — only true open items)

1. **Public + club association:** May a public outing keep a soft `clubId` (or equivalent) for discovery/branding, or must association always be cleared? (Current code always nulls — treat as **I**, not **R**.)
2. **Creator auto-attendance:** Should the creator always appear as joined on create for public and members-only outings?
3. **Invite expiry:** Should invite codes expire, and what UX states are required?
4. **Outing cancellation:** Is status-cancelled (vs host delete) required before stakeholder UAT?
5. **Home “aperçus” target:** Resolved for demo Batch 3 — illustrative idea route + club-create entry (ISSUE-002 awaiting Codex).

**Not unresolved (do not re-open):**

- Private members-only logistics stay hidden from outsiders/pending — current baseline.
- Walk/language journeys must be usable; runners-only framing is not an acceptable product default.
- Unrestricted club purposes (not sport-runners-only).

---

## Surfaces (do not collapse)

| Surface | Meaning |
|---------|---------|
| Demo | `EXPO_PUBLIC_DEMO_MODE` mock + localStorage |
| Hosted | Real API / Prisma / preview URL + credentials |
| Cross-device / multi-context | Same account in two isolated browser contexts (or two devices when available) |
| Native | iOS/Android build |
| UAT | Actual participant / stakeholder sessions — not founder-only sign-off |
