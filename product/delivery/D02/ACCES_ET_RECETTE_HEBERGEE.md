# D02 - Accès et recette hébergée

État : recette hébergée authentifiée exécutée sur l’environnement Test isolé (21 septembre 2026). Ce résultat n’est pas une validation OCIF ni une recette utilisateur.

## Environnements
Dev : PostgreSQL local isolé et API locale, déjà vérifiés.
Test : branche Neon `grpd-d02-test` / `br-super-voice-ahsrux4i`, base `grpd_d02_test` (vide puis migrée, huit migrations). `DATABASE_URL` Secret Preview limité à la branche `codex/d02-backend-verification`. Authentification PIN Preview-only : `AUTH_JWT_SECRET` et `PIN_ALLOWLIST_JSON` (organisateur `user_d02_host`, participant `user_d02_guest`). Jetons et PIN transmis hors dépôt Git.
Production : `DATABASE_URL` All Environments inchangé. Protection de déploiement SSO conservée. Mise en production et monitoring : D05.

## Accès évaluateur
Le preview reste protégé par Vercel Authentication. L’accès automatisé autorisé utilise l’en-tête `x-vercel-protection-bypass` (automation bypass projet), sans désactiver la protection. Un évaluateur nommé peut utiliser le bouton Visit / SSO Vercel. Les secrets ne sont pas publiés dans les PDF ni le dépôt public.

## Contrôle reproductible
Outil : tools/hosted-check.mjs. Variables : `D02_HOSTED_ORIGIN`, `D02_HOST_TOKEN`, `D02_GUEST_TOKEN`, `D02_TEST_WRITE_ORIGIN` (égal exactement à l’origine Test), optionnel `D02_VERCEL_BYPASS`, `D02_REPORT_PATH`.
Commande : `node product/delivery/D02/tools/hosted-check.mjs`
Les redirections sont refusées. Les réponses doivent être JSON. Les enregistrements de test sont conservés avec leurs identifiants.

## Résultats
Local (outil) : evidence/2026-09-21/hosted-runner-local.json — huit groupes, non hébergé.
Hébergé Test : evidence/2026-09-21/hosted-runner-preview.json — mode `authenticated-test`, `complete=true`, huit groupes PASS contre https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app (commit 05f73a4, déploiement dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2).
Persistance Neon : evidence/2026-09-21/hosted-persistence-neon.json — contrôle après nouvelle connexion.

## Pour clôturer côté dossier
Conserver SHA, URL et preuves. Compléter pièces financières et acceptation réelle séparément. Ne pas confondre PASS automatisé et validation OCIF.
