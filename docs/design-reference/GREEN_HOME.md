# NEW GREEN HOME — design reference

| Field | Value |
|-------|--------|
| **Branch source** | `origin/cursor/d03-mobile-mvp` |
| **Live route (this PR)** | `/` · `/(tabs)` · Découvrir (`app/(tabs)/index.tsx`) |
| **Static twin** | `/reference/green-home` |
| **Token module** | `components/experiences/ExperienceUI.tsx` → `experienceTheme` |

## Tokens (do not invent alternatives)

```
bg:     #111214
card:   #1C1E21
text:   #F3F2ED
muted:  #B1B2B6
accent: #C3D5B3   ← soft sage green CTAs / active tabs / links
line:   #383B40
```

- Card radius **22**, CTA radius **16**, screen padding **24**
- Primary CTA: sage fill + **dark** label (`#111214` on `#C3D5B3`)
- Secondary CTA: card fill + line border

## Not the reference

- Older streak / coach-bubble “training home” (pre-D03 Découvrir)
- Blue `#2F7BFF` accent system
- HTML mocks `noa1_redesign_best_of_both.html` / `redesigns.html` (not in repo)

## Preview

```bash
EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
# Reference: http://localhost:8081/reference/green-home
# Live:      http://localhost:8081/
```
