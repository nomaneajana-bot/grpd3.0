# D02 - Architecture et données
Version du 21 septembre 2026 | Pièce D02-R1 | Pour revue

## Périmètre et état
Backend, API REST et base de données. Le plan approuvé reste inchangé. Budget D02 : 9 000 MAD au total, dont 5 000 MAD SP et 4 000 MAD projet. Les dépenses réelles et les pièces bancaires restent en attente. Ce rapport décrit le code et les vérifications locales, CI et Test hébergé ; il ne vaut ni réception du prestataire ni validation OCIF.

## Architecture vérifiée
Client HTTP -> adaptateur Vercel api/v1/[...path].ts -> routes app/api/v1 -> authentification JWT et autorisations -> Prisma -> PostgreSQL. La console locale appelle réellement cet adaptateur. Les builds mobiles et leur connexion effective relèvent du contrôle D03.

Le serveur de vérification local écoute exclusivement sur 127.0.0.1:8092. La base PostgreSQL 14.20 dédiée écoute sur 127.0.0.1:55439. Les runners locaux refusent les autres hôtes et ports. Les identités locales sont des fixtures ; les identités Test hébergées sont des comptes PIN fictifs distincts.

## Schéma relationnel
Club 1-N ClubMembership : une adhésion unique par couple utilisateur/club, avec rôle et statut. Club 1-N ClubInvite : code unique, expiration et éventuel destinataire. Club 1-N Session : clubId facultatif pour une sortie autonome. Session 1-N SessionAttendance : participation unique par couple sortie/utilisateur. Session 1-N SessionTag : personne identifiée une seule fois par sortie. Les identifiants utilisateurs sont externes à ce schéma.

Club.slug est unique. Session.experience est un JSON facultatif ajouté par la migration 20260909170000_community_outing. Il décrit une activité walk/run, un format open/language et une durée ; langue et niveau sont conditionnels. Les champs historiques d'entraînement sont conservés. Huit migrations sont présentes et appliquées sur la base de test locale, CI et `grpd_d02_test`.

## Intégrité et corrections
Les sorties sont liées au club par identifiant. La visibilité tient compte du club, y compris pour une ancienne sortie publique d'un club privé. Les participants, notifications et actions de participation réutilisent cette règle.

Une approbation ne peut plus viser une adhésion d'un autre club. L'affectation exige l'autorité de l'hôte ou du gestionnaire et, dans un club, une adhésion approuvée du destinataire. Le statut attended est préservé. Le refus de partager les performances est respecté dans le roster.

Les invitations historiques partagent les contrôles d'expiration, de bannissement et de retry. Quitter un club ne permet pas d'effacer un bannissement. Une transaction sérialisable empêche deux administrateurs de quitter simultanément en abandonnant le club sans administrateur.

## Traçabilité et limites
Sources éditables : prisma/schema.prisma, huit migrations, routes et helpers. Le manifeste et les preuves du 21 septembre distinguent CI, local et hébergé Test.

La note technique et le plan de prototypage approuvés restent nécessaires pour conclure à la conformité exhaustive. Cette vérification ciblée n'est pas un audit de sécurité complet, une recette utilisateur ou un contrôle de production. Attribution : sources existantes complétées avec Codex puis Cursor pour la recette hébergée Test ; aucune réception signée d'Othmane n'est attestée.

## Versions
Version publiée exercée en Test hébergé : 05f73a4cbcdb36b7614cada84a905ec1b6a954c8. CI GitHub 35607697453 réussi. Preview Test Ready : dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2. Base Test Neon `grpd_d02_test` sur branche `grpd-d02-test`. Production inchangée.
