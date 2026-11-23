# Design harmony vs Clubs join page (Stito light)

**Reference loved page:** `/club/access` — light canvas `#F9F9FA`, Space Grotesk titles, forest primary `#005F34`, white cards.

## In harmony (same Stito light family)

| Surface | Status |
|---|---|
| Accueil `/` | Light Stito |
| Mes Sorties | Light Stito |
| Clubs hub | Light Stito |
| Club access / join | Light Stito ← reference |
| Session detail / create / published | Light Stito |
| Profile tab | Light Stito |
| Demo entry | Light Stito |

## Not in harmony (legacy dark `#111214`)

| Surface | Notes |
|---|---|
| `/profile/settings` | Dark cards — clashes with light tabs |
| `/club/settings` | Dark — same family as admin |
| `/club/admin`, roster, group-detail, group-create | Dark “coach” chrome |
| `/avenir`, onboarding (some), run/* | Dark / older tokens |

**Verdict:** Main tab journeys match the join page. Nested settings/admin still feel like a second product until light-ported.

## Demo world v2 fill

- **3 clubs:** Casa Running, Casa Marche Douce, French Run & Talk  
- **11 outings:** run / marche / langue + 1 past  
- Color groups seeded on clubs; demo user joined 3 outings + 2 clubs  
- Seed key: `mock:demo_seeded_v2`
