# Grp D — UX Doctrine: Profile, Club, Admin, Invite

**Identity > Data > Community > Governance.**  
Runners first. Clubs optional. Governance hidden. No polish — remove, separate, re-anchor.

---

## A) STRICT MENTAL TREE

### Level 1 — Runner identity (who I am)

**Allowed:** Name. “Coureur” or equivalent. Nothing else.

**Forbidden:** Role, status, club name as identity anchor, “Accès club,” “PR partagés,” group as identity, phone as hero.

**Never appear visually:** “Membre,” “En attente,” “Admin,” “Coach,” “Sans club (optionnel),” “Partagés/Privés,” any approval or access state.

**Requires explicit action to access:** Nothing at L1 is behind a tap; L1 is the one thing that is always visible. Everything else is below or behind navigation.

---

### Level 2 — How I run (signals, not stats)

**Allowed:** Objectif, VO₂max, Poids, PR summary (e.g. “Mes PR” with one line or count). Signals that tailor sessions. No narrative.

**Forbidden:** “Optionnel si tu débutes,” “Tes PR aident à…,” “Partagés avec le coach” as a stat label, any explanation of why PRs exist.

**Never appear visually:** “PR partagés” as a grid cell, “Accès club,” “Groupe” and “Club” repeated as stats when they are L3.

**Requires explicit action to access:** Full PR list = tap “Mes PR.” Edit PR sharing = Settings or one line in Profile, not a stat.

---

### Level 3 — Community (presence, not structure)

**Allowed:** Club name only. “Mon club” / “Rejoindre un club.” One entry point. No status, no role.

**Forbidden:** “CLUB (optionnel),” “Si tu as un club, gère tes accès,” “Club / Communauté,” “Statut : Membre / En attente,” “Responsable du club,” “Demandes en attente” on Profile.

**Never appear visually on Profile:** Role pills (Admin, Coach, Membre), “Accès club,” “En attente de validation,” “Demandes en attente.” All of that lives in Club or Admin.

**Requires explicit action to access:** Club screen = tap “Mon club” or “Rejoindre un club.” Governance = inside Club screen, separate zone or entry.

---

### Level 4 — Governance (hidden by default)

**Allowed:** Invites, approvals, roster, “Affectations (coach).” Only after user has entered a management context (Club → Admin / Gérer).

**Forbidden:** Any governance label, button, or state on Profile. Any “Responsable,” “Demandes en attente,” “Générer un code” on the main Profile hero or primary card.

**Never appear visually on Profile or on the main Club card:** “Responsable du club,” “Demandes en attente,” “Gérer le club” as primary. Management is a separate entry (e.g. “Gérer le club” as secondary action inside Club screen).

**Requires explicit action to access:** User must open Club, then choose “Gérer le club” or equivalent. Admin/Coach screen is not reachable from Profile as a primary row; it is reachable from Club as a management zone.

---

## B) AUDIT — CURRENT SCREENS

### Profile

**Wrong:**  
Stats grid mixes L1/L2/L3/L4: VO₂max, Poids, Groupe, Club, Accès club, PR partagés, Objectif. “Accès club” and “PR partagés” are governance/system. Club block titled “CLUB (optionnel)” with “Si tu as un club, gère tes accès ici” and a row “Responsable du club — Demandes en attente.” Identity is polluted by access and admin.

**Identity leaks:**  
“Accès club” (Membre / En attente / Accès club inactif / Sans club optionnel). “PR partagés” (Privés / Partagés). “Responsable du club.” All are L4 or system state presented as profile.

**Over-explanation:**  
“Si tu as un club, gère tes accès ici.” “Tes PR aident à ajuster les allures. Optionnel si tu débutes.” “Pas de PR pour l’instant — tu peux continuer sans.” Remove all.

**Governance pollution:**  
Club card contains “Responsable du club” and “Demandes en attente.” These belong in Club/Admin only.

**Delete, do not fix:**  
- The entire “Accès club” stat.  
- The entire “PR partagés” stat from the grid.  
- The subtitle “Si tu as un club, gère tes accès ici.”  
- The “Responsable du club” row from Profile (move to Club screen as management entry).  
- “Sans club (optionnel)” — replace with “Rejoindre un club” or nothing.  
- “Pas de PR pour l’instant — tu peux continuer sans” — replace with minimal empty state or remove.

---

### Settings

**Wrong:**  
“IDENTITÉ” with “Club / Communauté (optionnel)” as free-text. “PR & coach (optionnel)” and “Partager mes PR au coach (optionnel)” with “Utile si tu as un coach. Sinon, laisse désactivé.” Identity (prénom), display club name, and coach-sharing are in one flow. Settings feels like identity definition, not tuning.

**Identity leaks:**  
“Club / Communauté (optionnel)” in Settings implies club is an identity field you type. Club comes from API; this field is redundant or should be “Nom affiché du club” only if needed.

**Over-explanation:**  
“Utile si tu as un coach. Sinon, laisse désactivé.” “Partager mes PR au coach (optionnel).” Remove. One toggle label max.

**Governance pollution:**  
“PR & coach” section frames sharing as “with coach.” Reframe as “Partager mes PR avec le club” and no explanation.

**Delete, do not fix:**  
- “(optionnel)” from every label.  
- “Utile si tu as un coach. Sinon, laisse désactivé.”  
- Section title “PR & coach (optionnel)” — replace with one line or “Partage des PR.”  
- “Club / Communauté (optionnel)” as identity — remove or replace with single purpose (e.g. display name for club only).

---

### Club

**Wrong:**  
“CLUB ACTUEL” with “Statut : Membre / En attente / Non actif.” “RESPONSABLE” with “Générer un code d’invitation.” “REJOINDRE AVEC CODE” and “DEMANDER À REJOINDRE.” Role pills (Admin, Coach, Membre). Process-centric; feels like a control panel.

**Identity leaks:**  
Role pill next to club name (Admin, Coach, Membre). “Statut :” exposes system state as primary. “Responsable” as section title.

**Over-explanation:**  
“Si tu n'as pas de code, entre le nom du club (ex: jaime-courir).” “Un responsable du club doit valider ta demande.” “Pour changer de club, contacte un responsable du club.” “Code d’invitation (optionnel).” “Message (optionnel).” Reduce to minimum or remove.

**Governance pollution:**  
“RESPONSABLE” and “Générer un code d’invitation” are L4 but placed as a top-level card. “Demandes en attente” is correct here but copy is instructional.

**Delete, do not fix:**  
- “Statut : Membre / En attente / Non actif” as a sentence — show state implicitly or one word.  
- “RESPONSABLE” as section title — replace with action: “Inviter quelqu’un” or move to management zone.  
- “Code d’invitation (optionnel)” — label becomes “Code reçu” or “Code” only.  
- “Message (optionnel)” — remove “(optionnel).”  
- “Pas de club — ce n’est pas obligatoire” — remove “ce n’est pas obligatoire.”  
- Role pill from hero — hide or move to management zone only.

---

### Admin (Responsable du club)

**Wrong:**  
Title “Responsable du club” + “Affectations (coach)” + “Rafraîchir.” Empty state: “Accès limité” / “Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo.” Defensive and explanatory.

**Identity leaks:**  
Screen title “Responsable du club” defines user as responsible. Fine for this screen only; it must not appear on Profile.

**Over-explanation:**  
“Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo.” “Tu es à jour. Les nouvelles demandes apparaîtront ici.” Remove or shorten to one line.

**Governance pollution:**  
This screen is governance. Keep it; just remove apologetic copy.

**Delete, do not fix:**  
- “tu peux ignorer cet espace si tu cours en solo” — remove.  
- “Tu es à jour. Les nouvelles demandes…” — replace with “Aucune demande” or “Aucune demande en attente.”

---

### Invite (code area on Club screen)

**Wrong:**  
“Générer un code d’invitation” as primary action. Code is the hero (big, prominent). “Code copié” / “Code généré.” Feels technical and permanent.

**Identity leaks:**  
None; framing is wrong, not identity.

**Over-explanation:**  
N/A. Problem is hierarchy: code first, share second.

**Governance pollution:**  
Invite is a governance action but must feel social. Reframe as “Inviter quelqu’un” / “Partager l’accès”; code is secondary.

**Delete, do not fix:**  
- “Générer un code d’invitation” as button — replace with “Inviter quelqu’un” or “Partager l’accès.”  
- Code as hero — demote. Headline = “Partage ce code” or “Donne ce code à un proche”; code smaller, copy action secondary.

---

## C) PROFILE REDESIGN — STRUCTURE ONLY

**Header**  
Purpose: Identify the screen.  
Contains: Title “Profil.” One control: Settings (gear or “Paramètres”).  
Does NOT contain: Club, group, role, status, subtitle.  
Tone: Invisible. One word.

**Primary runner**  
Purpose: Who I am, one glance.  
Contains: Name. One line: “Coureur” or “Coureur · [Club name]” only when club exists. No “Sans club (optionnel).” Phone only if essential for account; otherwise omit or Settings.  
Does NOT contain: Groupe as identity tag (unless product decision: group is identity), “Accès club,” “PR partagés,” “Membre,” “En attente.”  
Tone: Affirmational. “Coureur · AS Rabat.” No apology.

**Signals (how I run)**  
Purpose: Data that shapes sessions, not identity.  
Contains: Objectif, VO₂max, Poids. One line: “Mes PR” → tap to list/add. No helper text.  
Does NOT contain: “PR partagés” as stat, “optionnel,” “Tes PR aident à…”  
Tone: Neutral. Labels + values. Silence.

**Community**  
Purpose: Presence in a club, not structure.  
Contains: One row or card: “Mon club” → [club name] or “Rejoindre un club.” Tap → Club screen. No status, no role.  
Does NOT contain: “CLUB (optionnel),” “gère tes accès,” “Responsable du club,” “Demandes en attente.”  
Tone: Neutral. “Mon club” / “Rejoindre un club.” No explanation.

**Management (conditional)**  
Purpose: Entry to governance only for those who have it.  
Contains: One row: “Gérer le club” → Club Admin. Only if user is admin/coach. Placed after Community, visually secondary (e.g. subtle link or second row).  
Does NOT contain: “Responsable du club,” “Demandes en attente” as hero.  
Tone: Invisible. Action only. “Gérer le club.”

**Actions**  
Purpose: Account and data actions.  
Contains: “Mes PR” (add/edit), “Historique des tests,” “Déconnexion.”  
Does NOT contain: “Paramètres” here if already in header.  
Tone: Neutral. Verbs only.

---

## D) COPY REWRITE — BEFORE → AFTER

**Section titles**

| Before | After |
|--------|--------|
| CLUB (optionnel) | REMOVE. Card title: Mon club / Rejoindre un club |
| Si tu as un club, gère tes accès ici. | REMOVE |
| PR (records personnels) | Mes PR |
| Tes PR aident à ajuster les allures. Optionnel si tu débutes. | REMOVE |
| RESPONSABLE | REMOVE from Profile. In Club: Inviter quelqu’un (or Gérer le club for admin zone) |
| REJOINDRE AVEC CODE | Code reçu |
| DEMANDER À REJOINDRE | Rejoindre un club |
| IDENTITÉ | REMOVE. Section = Prénom only or no title |
| PROFIL PHYSIQUE | Poids · VO₂max (or no title) |
| PR & coach (optionnel) | Partage des PR |

**Empty states**

| Before | After |
|--------|--------|
| Pas de PR pour l’instant — tu peux continuer sans. | Pas encore de PR. (or nothing) |
| Pas de club — ce n’est pas obligatoire. | REMOVE. Button: Rejoindre un club |
| Aucune demande. Tu es à jour. Les nouvelles demandes apparaîtront ici. | Aucune demande en attente. |
| Accès limité. Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo. | Réservé aux responsables du club. |

**Club presence**

| Before | After |
|--------|--------|
| Sans club (optionnel) | Rejoindre un club (button) or nothing |
| Club / Communauté | Mon club |
| Statut : Membre / En attente / Non actif | REMOVE from Profile. In Club: show as single word if needed (Membre / En attente) or hide |
| Responsable du club — Demandes en attente | Gérer le club (link, secondary) |

**Invite code area**

| Before | After |
|--------|--------|
| Générer un code d’invitation | Inviter quelqu’un |
| Code d’invitation (optionnel) | Code reçu |
| (Code as hero) | Headline: Partage ce code. Code smaller, one line. Copy = secondary. |
| Code copié | Copié |
| Code généré | REMOVE or: Prêt à partager |

**PR section**

| Before | After |
|--------|--------|
| Tes PR aident à ajuster les allures. Optionnel si tu débutes. | REMOVE |
| Pas de PR pour l’instant — tu peux continuer sans. | Pas encore de PR. |
| Partager mes PR au coach (optionnel) | Partager mes PR avec le club |
| Utile si tu as un coach. Sinon, laisse désactivé. | REMOVE |

**Role labels**

| Before | After |
|--------|--------|
| Admin / Coach / Membre (pills on Profile or Club hero) | HIDE from Profile. In Club: only in management context or remove from hero |
| Responsable du club | Gérer le club (action, not role) |
| Membre / En attente (as “Accès club” on Profile) | KILL on Profile. In Club only if needed, one word |
| Accès club inactif | KILL or move to Club only, never Profile |

---

## E) CLUB & ADMIN SEPARATION

**Profile**  
Contains: Name, “Coureur,” optional “· [Club name].” Signals: Objectif, VO₂max, Poids, Mes PR. One community row: “Mon club” / “Rejoindre un club.” One management link if applicable: “Gérer le club.” Actions: Mes PR, Historique, Déconnexion.  
Does NOT contain: Status, role, “Accès club,” “PR partagés” as stat, “Demandes en attente,” any invite UI.

**Club**  
Contains: My club name (and optional one-word state if needed). Join by code. Request by name. If admin/coach: zone or entry “Gérer le club” → invites, approvals, roster. Invite flow: “Inviter quelqu’un” → code secondary.  
Does NOT contain: Profile identity. Governance is a zone inside Club, not the first thing.

**Admin / Coach mode**  
Contains: Pending approvals, roster, “Affectations (coach).” Entry only from Club screen (“Gérer le club”), never from Profile as primary.  
Does NOT contain: Runner identity. No “Responsable du club” on Profile.

**Transition to management**  
User sees “Mon club” on Profile → tap → Club screen. On Club screen, if admin/coach, a clear but secondary entry: “Gérer le club” or “Demandes” → Admin screen. Profile never shows “Demandes en attente” or “Responsable”; those exist only inside Club → Gérer.

---

## F) INVITATION UX REFRAME (NO BACKEND CHANGES)

**Framing:** Invitation = social gesture. “Inviter quelqu’un” / “Partager l’accès au club.” Not “Générer un code d’invitation.”

**Copy hierarchy:**  
1. Primary: “Inviter quelqu’un” (button).  
2. After generate: “Partage ce code” or “Donne ce code à un proche” (headline).  
3. Code: small, one line, with “Copier.”  
4. No “optionnel,” no “code d’invitation,” no technical label.

**Code as secondary:** Code is not the title. Headline is share-oriented; code is the thing to copy. One line + Copier. Toast: “Copié.”

**Tone:** Social, temporary, human. “Partage ce code.” “Donne ce code à un proche.” Not “Code généré.” Not “Code d’invitation (optionnel).”

---

## G) SETTINGS PHILOSOPHY

**Editable rarely:** Prénom. Weight, VO₂max. “Partager mes PR avec le club” toggle. These are fine-tuning, not daily use.

**Editable often:** Nothing in Settings should be “often.” If something is used often, it belongs on Profile or in flow (e.g. PR add from Profile).

**Locked behind friction:** Account/phone change (if any) = separate flow or support. Leave club = inside Club screen with clear intent, not Settings.

**Not editable at all in Settings:** Role, status, “Accès club,” approval state. These are system; user does not “edit” them. Club membership is joined/left in Club screen; club display name might be editable once only if needed.

**Result:** Settings = low-frequency tuning. Prénom, Poids, VO₂max, partage PR. No “IDENTITÉ” / “PROFIL PHYSIQUE” as big titles. No “optionnel.” No “utile si.”

---

## H) FINAL PRODUCT LAWS (IMMUTABLE)

1. **Identity is one layer.** Profile hero = who I am (name, runner, optionally club name). No status, no role, no “Accès club,” no “PR partagés” in the hero or primary grid.

2. **A runner can forget they are in a club.** Club appears as “Mon club · [name]” or “Rejoindre un club.” No “optionnel,” no “gère tes accès,” no “Demandes en attente” on Profile. Governance is invisible until user enters Club → Gérer.

3. **Governance never leaks into runner identity.** “Responsable du club,” “Demandes en attente,” “Admin,” “Coach,” invite UI — none of these appear on Profile. They exist only in Club screen or Admin screen.

4. **Invitation is social, not technical.** Primary = “Inviter quelqu’un” / “Partager l’accès.” Code is secondary; headline is “Partage ce code.” No “Générer un code d’invitation,” no “Code d’invitation (optionnel).”

5. **Silence over explanation.** Remove helper text aggressively. No “optionnel,” no “utile si,” no “tu peux continuer sans,” no “Si tu as un club, gère tes accès.” If optional, hide or imply; do not label.

6. **Optional = invisible until invoked.** If something is optional, do not show it as a prominent label (“optionnel”). Show the action (e.g. “Rejoindre un club”); do not explain that club is optional.

7. **Settings = tuning, not identity.** Prénom, Poids, VO₂max, partage PR. No governance. No “IDENTITÉ” / “PROFIL PHYSIQUE” as section titles. No repeated “optionnel.” Future features that add identity or governance to Settings are forbidden unless they pass the mental tree.
