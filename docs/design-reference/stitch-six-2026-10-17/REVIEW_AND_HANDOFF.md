# Six-screen Stitch review — 17 October 2026

Design references received and inspected: six PNGs, six editable HTML sources, suite spec and Atlas DESIGN.md. Reference material, not approved requirements or evidence of implemented functionality. No dispatch or product edits in this review.

## Implementation gate
Finish homepage visual fidelity first. PR18 reported product eaff50a/docs b52a012 is NOT visually accepted: always-placeholder hero, heavy outlines, different button proportions and missing next-outing date. Functional smoke cannot establish design fidelity. Do not propagate that approximation to six pages.

Use screenshots/HTML as visual specification with corrections below, preserve current functional adapters and product rules. Normalize all designs against approved homepage palette/type/icon system; suite prose differs from homepage tokens. Do not copy the hardcoded84pt tab height: use safe-area insets. Preserve typography character with available/licensed bundled fonts or a visually reviewed equivalent, not arbitrary substitutions. Photo and no-photo variants must both be deliberately composed; no oversized empty media block. No remote font/CDN/WebView dependency from reference HTML. Exact imagery is not evidence of actual location or organiser identity.

## Screen-specific corrections
1. Outing detail: translate OUTING DETAIL to Détail de la sortie. Remove fake verified organiser badge, bookmark unless existing, ambiguous Confirmé badge before user joins. Keep useful public-club explanation short. Private-access example at bottom is documentation, not content on every public outing. Gate actual private logistics. Map image not actual coordinates: use existing supported map-link behavior; no fabricated map. Display real future date and exact outing data. Joining behavior must preserve actual app rules, not spec's unconditional immediate registration.
2. My outings: populated, pending, empty and confirmation-sheet illustrations are separate states, not vertically stacked production content. Selected tab must filter the list. Cancellation sheet appears on action and names exact outing; distinguish personal participation from organiser cancellation. No APERÇU copy in product.
3. Club: remove unsupported Actif aujourd’hui, member kilometers/last-seen claims and role decorations. Only real counts and permissions. Ordinary-member preview is separate role state. Groups follow actual existing one-group/self-assignment rules; do not invent overlapping affinity memberships. Preserve unrestricted purpose, pending membership and private visibility.
4. Create club: translate CREATE CLUB; remove premature Valide badges. Three proposed membership policies are design suggestions, not new functionality. Map visibility and join policy independently to actually supported enums; never imply discussions/directory access not implemented. Keep existing field requirements unless explicitly approved otherwise. No mandatory athletic constraints or groups.
5. Organise outing: translate ORGANISE OUTING. Remove Club officiel and Point GPS validé. The mock map is visibly wrong/placeholder; use real selected meeting place or no map. Keep supported formats, no new dynamic-walk taxonomy. Do not preselect a group. Preserve chosen club/visibility, standalone path and actual publication confirmation. No truncated time/location; date/meeting time must use supported fields. No auto-recommendation overriding private context.
6. Invitation: remove VIP tab, verified organiser implication and promised sharing of walking statistics. No promised notification unless implemented. Pending applicant and moderator sheet are separate authorized views. Invite resolution, request, pending, confirmed and failure are distinct states. Existing direct invite rules must not become mandatory manual approval just because mockup says so. Club membership NEVER auto-registers outings, even after confirmation; correct wording currently implying otherwise.

## Cross-screen QA
Sample dates conflict (2024/2025) and are past; samples only, replace with coherent future fixtures. Maps/location imagery inconsistent. No fabricated participants/capacity/metrics. French navigation titles. Remove development annotations from UI. Avoid all-caps microtext and repetitive nested containers. Test393x852 and320pt, enlarged text, keyboard focus/form keyboard, loading/retry, empty and inaccessible states. Screenshots with same viewport and equivalent content must be compared beside reference before acceptance. Record deliberate deviations with reason.

## Bounded rollout
A: homepage fidelity correction + independent visual review.
B: outing detail + My outings, join/cancel/persistence states; stop for review.
C: club home + create club, role/visibility/groups; stop for review.
D: organise outing + invitations, actual club association and approval/private access; stop for review.
No six-screen big-bang rewrite. Preserve dirty work, latest branch and all subsequent user decisions. No merge/prod/spend/OCIF changes. Files must actually reach cloud workspace before Cursor implementation; laptop paths are not cloud access.
