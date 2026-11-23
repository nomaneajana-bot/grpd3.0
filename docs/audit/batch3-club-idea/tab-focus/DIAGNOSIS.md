# Tab focus-order diagnosis (Batch 3 closeout)

- **tested_sha:** `ad83eaa0ea26c879fa45f8f85fc43f2f146eb3b1`
- **classification:** harness_limitation
- **product_fix_applied:** false
- **conclusion:** Real Tab traversal reaches name → city → purpose in order. Prior BLOCKED was harness limitation (programmatic focus / activeElement testId mismatch), not a product Tab-order defect.

## Method
No element.focus(). Start from body click, then Tab N times. Record activeElement each step. Visible :focus outline screenshots.

## Sequence
- step 0 click_top_left_chrome: tag=BODY testId=null role=null tabIndex=null label=null
- step 1 Tab: tag=BUTTON testId=club-create-scroll role=button tabIndex=0 label="Retour"
- step 2 Tab: tag=INPUT testId=club-name-input role=null tabIndex=0 label="Nom du club"
- step 3 Tab: tag=INPUT testId=club-city-input role=null tabIndex=0 label="Ville"
- step 4 Tab: tag=TEXTAREA testId=club-purpose-input role=null tabIndex=0 label="Pourquoi vous retrouver"
- step 5 Tab: tag=BUTTON testId=club-visibility-members role=button tabIndex=0 label="Sur invitation"
- step 6 Tab: tag=BUTTON testId=club-visibility-public role=button tabIndex=0 label="Public"
- step 7 Tab: tag=BUTTON testId=club-create-submit role=button tabIndex=0 label="Créer le club"
- step 8 Tab: tag=BUTTON testId=club-create-cancel role=button tabIndex=0 label="Annuler"
- step 9 Tab: tag=A testId=null role=tab tabIndex=0 label="Découvrir"
- step 10 Tab: tag=A testId=null role=tab tabIndex=0 label="Mes sorties"
- step 11 Tab: tag=A testId=null role=tab tabIndex=0 label="Clubs"
- step 12 Tab: tag=A testId=null role=tab tabIndex=0 label="Profil"

## Screenshots
- `docs/audit/batch3-club-idea/tab-focus/00-before-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/01-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/02-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/03-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/04-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/05-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/06-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/07-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/08-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/09-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/10-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/11-after-tab.png`
- `docs/audit/batch3-club-idea/tab-focus/12-after-tab.png`
