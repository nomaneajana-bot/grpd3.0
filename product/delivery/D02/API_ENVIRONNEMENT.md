# D02 - API, environnements et preuves
Version du 21 septembre 2026 | D02-R2 | Pour revue, clôture OCIF non acquise

## API et accès
La console locale http://127.0.0.1:8092/ appelle les vraies routes et PostgreSQL avec des identités fictives. Cette adresse est limitée à la machine de préparation. Le HTML ouvert seul ne constitue pas un environnement API.
Le parcours vérifié est : créer plusieurs clubs, inviter, accepter, créer plusieurs sorties, découvrir selon les droits, rejoindre puis annuler la sortie sélectionnée. Les données linguistiques sont conditionnelles. Les clubs privés sont filtrés dans les listes, détails et actions contrôlées.
Routes principales : GET/POST /api/v1/clubs ; GET /api/v1/clubs/{id} ; POST /api/v1/clubs/{id}/invite ; POST /api/v1/clubs/join ; GET/POST /api/v1/sessions ; GET /api/v1/sessions/{id} ; POST /api/v1/sessions/{id}/join et /leave ; GET /api/v1/me/sessions ; GET /api/v1/health ; POST /api/v1/auth/pin/login.
Un Bearer JWT est nécessaire pour les opérations privées. Les réponses sont enveloppées dans ok/data ou ok:false/error. Le contrat de création communautaire et ses validations sont éditables dans lib/server/community-input.ts. Ne pas publier de jeton, de mot de passe ou de chaîne de connexion dans les justificatifs.

## Vérification distante obtenue
Le workflow Backend verification est réussi sur le commit 05f73a4cbcdb36b7614cada84a905ec1b6a954c8 (run 35607697453). Il installe les dépendances verrouillées, génère Prisma, applique les migrations, compile le backend et exécute les tests JWT, PostgreSQL et HTTP sur une base jetable.
Résultats CI : 14 groupes PostgreSQL, 5 groupes HTTP, 8 assertions JWT, compilation stricte. Les captures locales du 15 septembre documentent la disponibilité, la création de sortie, le refus anonyme et l'annulation.
Les tests JWT CI utilisent des fixtures HS256 ; le service JWKS distant réel reste non exercé.

## Déploiement réellement inspecté
Vercel construit automatiquement la branche codex/d02-backend-verification. Après configuration Test, redéploiement dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2 Ready sur le même commit 05f73a4.
URL inspectée : https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app
Health JSON : HTTP 200, database ready. Login PIN organisateur/participant : HTTP 200. Runner hébergé tools/hosted-check.mjs : huit groupes PASS, complete=true (evidence/2026-09-21/hosted-runner-preview.json). Persistance confirmée sur Neon grpd_d02_test (evidence/2026-09-21/hosted-persistence-neon.json).
La protection SSO reste activée (all_except_custom_domains). L’automation bypass projet autorise les appels JSON sans désactiver la protection.

## Dev, Test et Production
Dev : environnement local réel avec base PostgreSQL dédiée.
Test : Neon branche grpd-d02-test, base grpd_d02_test ; Preview Vercel branch-scoped DATABASE_URL + AUTH_JWT_SECRET + PIN_ALLOWLIST_JSON.
Production : DATABASE_URL All Environments inchangé ; go-live et monitoring en D05. Aucune migration ni écriture de test sur Production.

## Critères de clôture
Parcours authentifiés hébergés sur Test obtenus. Séparation Test/Production documentée. Accès évaluateur Visit/SSO possible en complément de l’automation bypass. Confirmer annexes approuvées et modalités de dépôt. Recevoir les trois originaux matériels : facture définitive, ordre de virement, relevé bancaire. Aucun montant réellement dépensé n'est déduit du budget. Les PASS automatisés ne valent pas acceptation OCIF.
