# `/avenir` disposition (decision default #4 / ISSUE-019)

**Rule:** May remain vision/marketing deep link. Provide working return/enter-app CTA that **respects authentication**. **No forced tab addition.**

## Implementation (CONFIRMED tip)

| Piece | Behavior |
|---|---|
| Route | `app/avenir.tsx` — public (`use-auth-gate` exception) |
| Tab bar | **Not added** — no `avenir` in `app/(tabs)/_layout.tsx` |
| CTA signed-in | Label « Retour à l'accueil » → `router.replace("/(tabs)")` |
| CTA unsigned + `DEMO_MODE` | « Entrer dans l'app » → `/demo` → `enterDemoHomeSession` → tabs |
| CTA unsigned + connected | → `/(auth)/onboarding` |
| testID | `avenir-enter-app` |

## Runtime evidence (demo)

`avenir-evidence.json` **15/15** · screenshots `avenir/*.png`

| Check | Result |
|---|---|
| No avenir tab | PASS |
| Loads logged-out / logged-in | PASS |
| CTA labels respect auth | PASS |
| Unsigned enter leaves `/avenir` into app | PASS |
| Signed-in return to tabs | PASS |
| Desktop CTA readable/unobstructed | PASS |

## Explicit non-claims

Hosted Preview · native · UAT · OCIF · forced Accueil tab for vision
