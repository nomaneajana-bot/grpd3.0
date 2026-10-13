# Product Rules / Decision Map (canonical)

**Branch:** `cursor/green-home-ux-join-3184`  
**SHA:** `05a387426fde099cae415a8b4a98e964bd2e98e3`  
**Legend:** **I** = implemented behavior in code · **R** = intended behavior supported by user requirements / prior agreement · **U** = unresolved (needs Nouamane)

---

## 1. Membership vs attendance vs pace group

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Club membership is access boundary (`pending` \| `approved` \| …) | I | R | | Invite code → approved; name request → pending |
| Outing attendance requires explicit S'inscrire / Quitter | I | R | | Membership must not auto-enroll outings |
| Session creator auto-joins their new outing | I | | U | Documented in create flow; confirm if intended for members-only + public |
| Pace groups A–D are session/roster buckets, not membership | I | R | | Club home-group (TOI) separate from session groupId |
| TOI uses same assignment as roster counts | I | R | | Fixed on this branch via `assignMemberToClubGroup` |
| Assign/suggest ≠ joined | I | R | | Invariant (b) |

## 2. Public / private (members-only)

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| `visibility: public` → `clubId` null on create | I | R | | Standalone must not inherit club |
| `visibility: members` ⇒ `clubId` required | I | R | | Invariant (a) |
| Demo public seeds must not carry clubId | I | R | | Fixed in `demoSeed` on tip |
| Members-only detail hidden from non-members (404) | I (demo mock + hosted GET) | R | | Direct-link privacy |
| Members-only list filtered for non-members | I (hosted list) | R | | Demo list paths may still differ — verify per surface |
| Outsiders see MEMBRES tag without logistics | | R | U | Prefer 404 vs teaser? Current: 404 when gated |

## 3. Invitations / pending / approval

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Invite code joins the club that owns the code | I | R | | Unique codes; multi-club picker for generate |
| Pending applicant is not approved member | I | R | | Session join blocked while pending |
| Approve/reject pending in admin UI | Partial I | R | U | Confirm connected API coverage |
| Invite expiry | NOT IMPLEMENTED (UI never sets expiresAt; mock never expires) | | U | Do not PASS as supported |
| Leave club / cancel pending client calls | I mock | R | | **Hosted routes missing** (ISSUE-004) |

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
| Public outing independent of club membership | I | R | | |
| Members-only bind to selected/focused club when multi-club | I | R | | Create club picker + focused club persistence |
| Two clubs must never silently share invites/edits | Partial I | R | | Switcher exists; still needs journey VERIFIED |
| Leaving club revokes members-only attendance for that club | I demo | R | U | Hosted leave route missing |

## 6. Cancellation / dates / persistence

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Create uses real upcoming ISO dates | I | R | | |
| Cancel club outing (status cancelled) | NOT IMPLEMENTED | | U | Only local delete for host custom |
| Capacity full / waitlist | NOT IMPLEMENTED for Session | | U | Run capacity is separate/legacy |
| Demo persistence = device localStorage mock | I | | | Not hosted |
| Hosted / cross-device persistence | BLOCKED / NOT VERIFIED | R | | Separate evidence required |
| Join/leave updates detail + Mes sorties after reload | I demo (audit S5) | R | | Re-verify with correct-screen assertions |

## 7. Walking / language / community

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| Discover can filter/label Marche | I | R | | |
| Walk/language complete journey without running PR/pace assumptions | Partial | R | U | Same `/session/[id]` chrome; S8 was incomplete (ISSUE-003) |
| Home previews should not dump users into training PRs | Failed I | R | | ISSUE-002 |

## 8. Testing / audit honesty

| Rule | I | R | U | Notes |
|------|---|---|---|-------|
| PASS requires correct screen + successful setup + actual effects | | R | | Method doctrine; S6 violated historically (ISSUE-001) |
| Unsupported ≠ PASS | | R | | |
| Audit report SHA must match delivered tip or call out lag | Partial | R | | ISSUE-005 |
| Auth journey evidence = real UI OTP (agreed surface) | I in audit script | R | | |

---

## Unresolved questions (Nouamane)

1. After leave-club, should ex-members see a teaser (“demande l'accès”) or strict introuvable for that club’s members-only outings?  
2. Should creating a public outing ever keep a soft club association for discovery, or always `clubId: null`?  
3. Is walk/language a first-class session type with distinct detail chrome, or is shared running detail acceptable for MVP?  
4. Should invite codes expire, and what UX states are required?  
5. Is outing cancellation (vs delete) required before UAT?  
6. Should home “aperçus” open a dedicated preview, club access, or stay non-navigating?

---

## Surfaces (do not collapse)

| Surface | Meaning |
|---------|---------|
| Demo | `EXPO_PUBLIC_DEMO_MODE` mock + localStorage |
| Hosted | Real API / Prisma / preview URL |
| Cross-device | Same account, two devices |
| Native | iOS/Android build |
| UAT | Nouamane acceptance |
