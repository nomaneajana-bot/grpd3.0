# D04 — repo checks (real output from this run)

Captured UTC: 2026-11-17T01:53:02Z
Branch: cursor/d03-d05-funding-evidence-25dd
SHA: 7311c526dab4c61dcfe1609b1dc378cfea9c3d27

## npm run test:unit

```

> grpd3.0@1.0.0 test:unit
> jest --testPathIgnorePatterns=integration --no-coverage

FAIL lib/__tests__/liveJourneyMocks.unit.test.ts
  ● assignMemberToClubGroup — no invented Élite › defaults to open/social group D on run clubs when no PR and no admin assignment

    expect(received).toBe(expected) // Object.is equality

    Expected: "D"
    Received: null

      20 |       defaultClubAdminSettings(),
      21 |     );
    > 22 |     expect(group).toBe("D");
         |                   ^
      23 |   });
      24 |
      25 |   it("does not auto-assign a pace group on walk clubs when pace was skipped", async () => {

      at Object.<anonymous> (lib/__tests__/liveJourneyMocks.unit.test.ts:22:19)

  ● walk club admin defaults › do not use Élite / Sub 4:30 labels

    expect(received).toBe(expected) // Object.is equality

    Expected: "run"
    Received: "neutral"

      58 |
      59 |     const run = defaultClubAdminSettings();
    > 60 |     expect(run.activityStructure).toBe("run");
         |                                   ^
      61 |     expect(run.memberOrgEnabled).toBe(false);
      62 |     expect(run.colorGroups ?? []).toEqual([]);
      63 |     expect(JSON.stringify(run)).not.toMatch(/Élite|Elite|Sub 4:30/i);

      at Object.<anonymous> (lib/__tests__/liveJourneyMocks.unit.test.ts:60:35)

PASS lib/__tests__/sessionLogic.test.ts
PASS lib/__tests__/createOnboardingContinuity.unit.test.ts
PASS lib/__tests__/sessionBuilder.test.ts
PASS lib/coach/__tests__/ruleBasedCoachEngine.test.ts
PASS lib/__tests__/mockSessionPersistence.unit.test.ts
PASS lib/__tests__/homeViewModel.unit.test.ts
PASS lib/server/__tests__/app-jwt.unit.test.ts
PASS lib/__tests__/clubMembershipLifecycle.unit.test.ts
PASS lib/__tests__/clubPaceGroups.test.ts
PASS lib/__tests__/storageSchemas.test.ts
PASS lib/__tests__/apiMode.test.ts
PASS lib/__tests__/loginVerifyErrors.unit.test.ts
PASS lib/__tests__/sessionAudience.unit.test.ts
PASS lib/__tests__/finishOnboardingAuth.unit.test.ts
PASS lib/__tests__/interGroupPolicy.test.ts
PASS lib/__tests__/connectedJourney.unit.test.ts
PASS lib/__tests__/mockListSessionsPrivacy.test.ts
PASS lib/__tests__/attendanceStatusLogic.test.ts
PASS lib/__tests__/sessionClubAssociation.unit.test.ts
PASS lib/__tests__/clubMemberGroups.unit.test.ts
PASS lib/__tests__/displayName.unit.test.ts
PASS lib/__tests__/testHelpers.test.ts
PASS lib/__tests__/sessionDisplay.test.ts
PASS lib/__tests__/mesSortiesViewModel.unit.test.ts
PASS lib/__tests__/otpIsolation.test.ts
PASS lib/__tests__/clubInviteKey.unit.test.ts
PASS lib/__tests__/onboardingBatchA.unit.test.ts
PASS lib/__tests__/apiSessionMapper.unit.test.ts
PASS lib/__tests__/dateHelpers.test.ts
PASS lib/__tests__/authStore.unit.test.ts

Summary of all failing tests
FAIL lib/__tests__/liveJourneyMocks.unit.test.ts
  ● assignMemberToClubGroup — no invented Élite › defaults to open/social group D on run clubs when no PR and no admin assignment

    expect(received).toBe(expected) // Object.is equality

    Expected: "D"
    Received: null

      20 |       defaultClubAdminSettings(),
      21 |     );
    > 22 |     expect(group).toBe("D");
         |                   ^
      23 |   });
      24 |
      25 |   it("does not auto-assign a pace group on walk clubs when pace was skipped", async () => {

      at Object.<anonymous> (lib/__tests__/liveJourneyMocks.unit.test.ts:22:19)

  ● walk club admin defaults › do not use Élite / Sub 4:30 labels

    expect(received).toBe(expected) // Object.is equality

    Expected: "run"
    Received: "neutral"

      58 |
      59 |     const run = defaultClubAdminSettings();
    > 60 |     expect(run.activityStructure).toBe("run");
         |                                   ^
      61 |     expect(run.memberOrgEnabled).toBe(false);
      62 |     expect(run.colorGroups ?? []).toEqual([]);
      63 |     expect(JSON.stringify(run)).not.toMatch(/Élite|Elite|Sub 4:30/i);

      at Object.<anonymous> (lib/__tests__/liveJourneyMocks.unit.test.ts:60:35)


Test Suites: 1 failed, 30 passed, 31 total
Tests:       2 failed, 175 passed, 177 total
Snapshots:   0 total
Time:        4.318 s, estimated 7 s
Ran all test suites.
```

## npm test (D03 focused: apiSessionMapper|authStore.unit|connectedJourney)

```

> grpd3.0@1.0.0 test
> jest --testPathPattern=apiSessionMapper|authStore.unit|connectedJourney --no-coverage

PASS lib/__tests__/authStore.unit.test.ts
PASS lib/__tests__/connectedJourney.unit.test.ts
PASS lib/__tests__/apiSessionMapper.unit.test.ts

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.133 s
Ran all test suites matching /apiSessionMapper|authStore.unit|connectedJourney/i.
```

## npm run lint (exit 1 from prior)

Pre-existing lint debt on baseline; exit code 1. Tail:

```
/agent/repos/grpd3.0/components/club/InterGroupPolicyInfoBox.tsx
  25:9  warning  'isGreen' is assigned a value but never used  @typescript-eslint/no-unused-vars

/agent/repos/grpd3.0/components/club/SessionJoinPolicyCard.tsx
   67:18  error  `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`  react/no-unescaped-entities
  103:52  error  `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`  react/no-unescaped-entities

/agent/repos/grpd3.0/components/home/DiscoveryFilters.tsx
  7:16  warning  Array type using 'Array<T>' is forbidden. Use 'T[]' instead  @typescript-eslint/array-type

/agent/repos/grpd3.0/components/mesSorties/CancelParticipationModal.tsx
  86:63  error  `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`  react/no-unescaped-entities

/agent/repos/grpd3.0/components/onboarding/CTABar.tsx
  13:10  warning  'borderRadius' is defined but never used  @typescript-eslint/no-unused-vars

/agent/repos/grpd3.0/components/pr/CoachPredictionCard.tsx
  5:31  warning  '/agent/repos/grpd3.0/constants/redesignTheme.ts' imported multiple times  import/no-duplicates
  6:32  warning  '/agent/repos/grpd3.0/constants/redesignTheme.ts' imported multiple times  import/no-duplicates

/agent/repos/grpd3.0/components/pr/PrRecordCard.tsx
  13:31  warning  '/agent/repos/grpd3.0/constants/redesignTheme.ts' imported multiple times  import/no-duplicates
  14:32  warning  '/agent/repos/grpd3.0/constants/redesignTheme.ts' imported multiple times  import/no-duplicates

/agent/repos/grpd3.0/components/pr/PrSheetA.tsx
  19:31  warning  '/agent/repos/grpd3.0/lib/profileStore.ts' imported multiple times  import/no-duplicates
  20:33  warning  '/agent/repos/grpd3.0/lib/profileStore.ts' imported multiple times  import/no-duplicates

/agent/repos/grpd3.0/components/redesign/CoachInsightCard.tsx
  42:46  error  `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`  react/no-unescaped-entities

/agent/repos/grpd3.0/components/redesign/GroupRow.tsx
  4:18  warning  'borderRadius' is defined but never used  @typescript-eslint/no-unused-vars

/agent/repos/grpd3.0/components/stito/StitoUI.tsx
  6:39  warning  'View' is defined but never used  @typescript-eslint/no-unused-vars

✖ 91 problems (5 errors, 86 warnings)
  0 errors and 26 warnings potentially fixable with the `--fix` option.

```

## Hosted baseline probes

```
=== 2026-11-17T01:52:04Z baseline probes ===
--- GET https://grpd30.vercel.app/api/v1/health ---
{"ok":true,"data":{"service":"grpd-api","database":"ready"}}
--- POST https://grpd30.vercel.app/api/v1/auth/email/login (bad password) ---
{"ok":false,"error":{"message":"Email ou mot de passe incorrect","code":"UNAUTHORIZED"}}
--- GET https://grpd30.vercel.app/api/v1/sessions (first item keys only) ---
{
  "ok": true,
  "count": 2,
  "first_keys": [
    "clubId",
    "createdAt",
    "dateISO",
    "dateLabel",
    "estimatedDistanceKm",
    "genderRestriction",
    "hostGroupName",
    "hostUserId",
    "id",
    "isCustom",
    "meetingPoint",
    "recommendedGroupId",
    "spot",
    "targetPace",
    "timeMinutes",
    "title",
    "typeLabel",
    "visibility",
    "volume",
    "workoutId"
  ]
}
--- email-auth preview health via share cookie ---
{"ok":true,"data":{"service":"grpd-api","database":"ready"}}
```

## Notes

- Focused D03 unit suites: **3 passed / 7 tests**.
- Full `test:unit`: **30 passed**, **1 failed** (`liveJourneyMocks.unit.test.ts`, 2 assertions) — pre-existing on email-auth baseline, unrelated to D03 join harden.
- No production deploy executed in this run.
