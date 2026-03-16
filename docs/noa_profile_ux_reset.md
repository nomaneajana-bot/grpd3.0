# Runner-first Profile & Club Universe — UX Reset

**Role:** Senior product designer + UX writer. Sports-app mental models; no enterprise, no ERP.

**Constraints:** No new features, no backend/Prisma/API changes, no onboarding, no technical concepts exposed.

---

## 1. Mental Tree

- **Level 1 — Who I am (identity)**  
  Name, that I’m a runner. Nothing else. No roles, no status, no “access.” If it leaks here, the app feels like a dossier.

- **Level 2 — How I run (activity & ability)**  
  PRs, paces, goal, VO₂max, weight. Used to tailor sessions and effort. Must never be framed as “optional” or “for the coach” at identity level.

- **Level 3 — What I’m part of (community)**  
  Club name, group, “I run with X.” Social, not administrative. No approval states, no codes, no “Accès club.”

- **Level 4 — What I manage (governance)**  
  Invites, approvals, roster, coach tools. Exists but stays out of the main identity/runner story. Feels like a separate mode, not “more profile.”

**Rule:** Lower levels never define identity. Governance never appears in the runner headline.

---

## 2. What’s wrong today (brutal)

- **Profile header**  
  Puts “Coureur · Groupe D · Club” in one line. Then a stats grid with “Groupe,” “Club,” “Accès club,” “PR partagés,” “Objectif.” Identity (Level 1) is mixed with ability (2), community (3), and system state (4). “Accès club” and “PR partagés” are governance/backend concepts at the top of the screen.

- **Stats grid**  
  Seven items in one flat grid: VO₂max, Poids, Groupe, Club, Accès club, PR partagés, Objectif. No hierarchy. “Accès club” (Membre / En attente / Accès club inactif / Sans club optionnel) and “PR partagés” (Privés / Partagés) are system states presented as identity.

- **Club block on Profile**  
  Titled “CLUB (optionnel)” with “Si tu as un club, gère tes accès ici.” Then “Club / Communauté” row and, if admin, “Responsable du club — Demandes en attente.” So Profile is the place to “manage access” and “pending requests.” Governance is primary; club feels like admin first, community second.

- **PR block**  
  “PR (records personnels)” + “Tes PR aident à ajuster les allures. Optionnel si tu débutes.” Defensive and system-y. Empty state: “Pas de PR pour l’instant — tu peux continuer sans.” Apologetic. “Ajouter” is fine; “Voir l’historique complet” is good but floats without clear belonging.

- **Settings entry**  
  “Paramètres” in the header is correct. But Profile already exposed “Accès club” and “PR partagés,” so Settings feels like “more of the same” instead of “fine-tuning.”

- **Club screen**  
  “CLUB ACTUEL” with “Statut : Membre / En attente / Non actif,” then “RESPONSABLE” with “Générer un code d’invitation,” then “REJOINDRE AVEC CODE,” then “DEMANDER À REJOINDRE.” Labels are process-centric (code, demande, statut). Role pills (Admin, Coach, Membre) and “Responsable” make the screen feel like a control panel.

- **Admin screen**  
  “Responsable du club” + “Affectations (coach)” + “Rafraîchir.” Empty: “Accès limité” / “Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo.” Copy is defensive. “Demande en attente” and “Approuver” are correct functionally but framed in admin language.

- **Invite code**  
  Button: “Générer un code d’invitation.” Then the code is the hero (big, copy button). Feels technical and permanent. No “share with someone” or “they enter this once.”

- **Settings**  
  “IDENTITÉ” (Prénom, Club/Communauté optionnel), “PROFIL PHYSIQUE” (Poids, VO₂max), “PR & coach (optionnel)” with “Partager mes PR au coach (optionnel).” Identity and physical tuning and coach-sharing are in one flow. “Optionnel” repeated. Club as free-text in identity mixes “my club name” with “my membership,” which the app already knows from API.

---

## 3. New Profile structure (section by section)

- **Header**  
  **Contains:** Screen title “Profil,” optional gear to Settings.  
  **Excludes:** Club, group, role, status.  
  **Tone:** One word. No subtitle.

- **Primary runner info**  
  **Contains:** Name (editable via Settings or inline tap if desired later), one line: e.g. “Coureur” or “Coureur · [Club name]” only when there is a club — no “Sans club (optionnel).” Phone only if useful for account recovery, else omit or move to Settings.  
  **Excludes:** Groupe in this line if group is session-contextual; otherwise keep one short “Groupe” or “Allure” hint. No “Accès club,” no “PR partagés,” no status labels.  
  **Tone:** Short. Confident. “Coureur · AS Rabat” not “Coureur · Groupe D · AS Rabat · Membre.”

- **Secondary runner info (below the fold)**  
  **Contains:** Compact block or list: Objectif, VO₂max, Poids, and one line for PRs (“Mes PR” → tap to open). Optional: “Partage PR avec le club” as a single line or in Settings only.  
  **Excludes:** “Groupe” and “Club” as repeated stat rows if already in the headline. No “Accès club,” no “En attente,” no “Privés/Partagés” as profile stats.  
  **Tone:** Labels only. Values clean. No “optionnel,” no explanation.

- **Community**  
  **Contains:** One card or row: “Mon club” / “Avec qui je cours” → opens Club screen. Show club name only; no status, no role. If no club: “Rejoindre un club” or nothing (no “Sans club (optionnel)”).  
  **Excludes:** “Gérer mes accès,” “Responsable du club,” “Demandes en attente” from this card.  
  **Tone:** Social. “Mon club” or “Rejoindre un club.” No “CLUB (optionnel).”

- **Management (if applicable)**  
  **Contains:** Only for users who have coach/admin. One discrete row or link: “Gérer le club” or “Demandes du club” → Club Admin. Not under the same card as “Mon club”; separate, lower, or in Club screen as a tab/zone.  
  **Excludes:** Role badges and “Responsable” from the main Profile hero.  
  **Tone:** Action, not identity. “Gérer le club,” not “Tu es responsable.”

- **Actions**  
  **Contains:** “Mes PR” (add/edit) → Update tests; “Historique des tests”; “Déconnexion.”  
  **Excludes:** “Paramètres” can stay in header only.  
  **Tone:** Verbs. “Mes PR,” “Historique,” “Déconnexion.”

---

## 4. Copy rewrite examples (before → after)

**Section titles**

- CLUB (optionnel) → *(remove; card title)* Mon club  
- Si tu as un club, gère tes accès ici. → *(remove or)* Rejoindre ou voir mon club  
- PR (records personnels) → Mes PR  
- Tes PR aident à ajuster les allures. Optionnel si tu débutes. → *(remove or)* Pour affiner tes allures suggérées  
- RESPONSABLE → *(move to Admin; do not title “Responsable” on Profile)*  
- REJOINDRE AVEC CODE → Inviter avec un lien / Partager l’accès *(in Club)*  
- DEMANDER À REJOINDRE → Rejoindre un club *(one concept)*  
- IDENTITÉ → *(Settings)* Prénom  
- PROFIL PHYSIQUE → *(Settings)* Poids · VO₂max  
- PR & coach (optionnel) → *(Settings)* Partage des PR  

**Helper text**

- Optionnel si tu débutes → *(remove)*  
- Si tu n'as pas de code, entre le nom du club → Un ami t’a donné un code ? Saisis-le ici. Sinon, cherche le club par nom.  
- Un responsable du club doit valider ta demande. → En attente de validation par le club.  
- Pour changer de club, contacte un responsable du club. → Pour changer de club, contacte le club.  
- Utile si tu as un coach. Sinon, laisse désactivé. → *(remove)*  
- Partager mes PR au coach (optionnel) → Partager mes PR avec le club  

**Empty states**

- Pas de PR pour l’instant — tu peux continuer sans. → Pas encore de PR. Ajoute un test quand tu veux.  
- Pas de club — ce n’est pas obligatoire. → Rejoindre un club *(button only; no “obligatoire”)*  
- Aucune demande. Tu es à jour. → Aucune demande en attente.  
- Accès limité. Espace réservé aux coachs… → Réservé aux responsables de club.  

**Role labels**

- Membre → *(no label in Profile; in Club screen)* Membre *(only if needed)*  
- En attente → En attente  
- Accès club inactif → *(hide from Profile; handle in Club if needed)*  
- Responsable du club → Gérer le club *(action, not role)*  
- Admin / Coach → *(do not show as identity; use only in Admin/roster context)*  

**Invitation copy**

- Générer un code d’invitation → Créer un lien d’invitation / Inviter quelqu’un  
- Code d’invitation (optionnel) → Code reçu  
- Code copié → Copié  
- (Code as hero) → *(de-emphasize; headline = “Partage ce lien” or “Donne ce code à un proche”; code smaller, copy secondary)*  

**PR explanations**

- Tes PR aident à ajuster les allures. → Pour des allures adaptées à ton niveau.  
- Partager mes PR au coach → Partager mes PR avec le club  

---

## 5. Club / Admin separation principles

- **Profile**  
  Shows “who I am” and “how I run.” Community = one line or card: “Mon club” / “Rejoindre un club” (name only). No status, no role, no “Accès club,” no “Demandes en attente.” Management appears only as one link: “Gérer le club” (for coach/admin), separate from the club-identity card.

- **Club screen**  
  “Mon club” / “Rejoindre un club.” Contains: my club name, join by code, request by name, and (if coach/admin) a clear zone or tab: “Gérer le club” (invites, approvals, roster). So Club = community + management in one place, but management is a distinct zone, not the first thing.

- **Admin / Coach space**  
  Feels like a different mode: “Gérer le club,” “Demandes,” “Affectations.” Entry from Profile = single link. Entry from Club = dedicated area. Copy is task-oriented (“Approuver,” “Inviter”) not identity-oriented (“Tu es admin”). No role badges on Profile.

- **Reference to club from Profile**  
  Profile references club by name only. “Rejoindre un club” or “Mon club · [name]” → tap goes to Club. No “optionnel,” no “gère tes accès,” no status text on Profile.

---

## 6. Invitation UX rewrite (copy and framing only)

- **Framing**  
  Invite = “Inviter quelqu’un” / “Partager l’accès au club,” not “Générer un code d’invitation.” Feels social and temporary (“un lien pour rejoindre”), not technical.

- **Headline**  
  After generating: “Partage ce lien” or “Donne ce code à un proche” — not the code as title.

- **Code**  
  Secondary. Smaller than the headline. One line: “Code : XXXXX” with a “Copier” action. Toast: “Copié” or “Lien copié.”

- **Helper**  
  “Valable un temps. La personne saisit le code sur l’écran Club.” Short. No “optionnel,” no “générer.”

- **Button**  
  “Inviter quelqu’un” or “Créer un lien d’invitation” instead of “Générer un code d’invitation.”

---

## 7. Settings philosophy

- **Identity in Profile vs Settings**  
  Profile = display of who I am (name, club name as reference). Settings = where name and account-related fields are edited. Club membership (join, leave, status) is not “identity editing” — it lives in Club screen. So: Prénom in Settings; “Club / Communauté” as free-text in Settings can be removed if club comes from API, or kept as “Nom du club affiché” only.

- **What not to edit casually**  
  Nothing destructive in Profile. “Déconnexion” is an action, not Settings. Leave/revoke club = in Club screen with clear intent.

- **What stays “advanced”**  
  VO₂max, weight, “Partager mes PR avec le club” can stay in Settings as fine-tuning. Section title: “Profil” or “Données de course” — not “IDENTITÉ” / “PROFIL PHYSIQUE” in caps. One short hint per block if needed; no “optionnel” everywhere.

- **Settings as “fine-tuning”**  
  Settings = account (prénom, phone if any), données de course (poids, VO₂max), partage PR (one toggle). No governance, no “Accès club,” no roles. So Settings feels like “réglages” not “definition of identity.”

---

## 8. Final design principles (max 6)

1. **Identity first.** Profile answers “who I am” in one glance. No system state (accès, statut, partagés) in the hero or primary block.  
2. **Community, then governance.** Club = “mon club” / “rejoindre.” Management = “gérer le club,” separate and secondary.  
3. **No “optionnel” in the main flow.** Imply optionality by placement and tone; don’t label everything optional.  
4. **No technical or backend words.** No “code d’invitation,” “slug,” “accès club,” “statut,” “demande en attente” in primary copy; use “lien,” “rejoindre,” “en attente” only where necessary.  
5. **Invite = social, shareable, temporary.** Headline is “partage / donne à un proche”; code is small and copy is one action.  
6. **Settings = fine-tuning.** Edit name, physical data, PR sharing. Identity is shown on Profile; governance lives in Club/Admin.
