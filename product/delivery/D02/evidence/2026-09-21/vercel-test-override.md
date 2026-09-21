# Configuration Test Vercel - 21 septembre 2026

Autorisation explicite de Nouamane : connecter le Preview D02 à la nouvelle base Test, sans modifier Production.
Neon : GRPD / dry-tooth-73314920 ; branche grpd-d02-test / br-super-voice-ahsrux4i ; base grpd_d02_test. Les huit migrations ont été appliquées avec succès (neon-test-migrations.log).
Vercel : DATABASE_URL ajouté comme Secret, environnement Preview, branche codex/d02-backend-verification uniquement. Écran de succès observé ; l'entrée All Environments d'origine reste présente et inchangée. Aucune valeur secrète incluse dans cette preuve.

AUTH_JWT_SECRET et PIN_ALLOWLIST_JSON ajoutés ensuite comme Secrets Preview, même branche uniquement (organisateur et participant fictifs). Automation bypass projet créé pour la recette hébergée ; SSO protection reste enabled=true / all_except_custom_domains. Production inchangée.

Redéploiement Preview demandé sur la source 05f73a4 : dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2.
URL : https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app
Résultat final : Ready. Health JSON ok/database=ready. Hosted-check authenticated-test complete=true (8 PASS). Persistance Neon vérifiée.
