# Grp D v1 Launch Checklist

This checklist is the minimum required for the must-work flow:
Open app -> set run type/distance/pace/time/location -> get matched -> join -> confirmed run card.

## Must-have (launch blockers)
- [ ] Phone OTP auth flow (request, verify, resend cooldown)
- [ ] Access + refresh tokens (rotation, expiry, revocation)
- [ ] Session persistence on mobile (secure storage)
- [ ] Profile basics: pace range, default distance, run type, home area
- [ ] Location permission + location selection (current or pick)
- [ ] Run setup flow: type + distance + pace + time + location
- [ ] Matching v1 (hard filters + fallback create run)
- [ ] Join + confirmation (meeting point/time/participants list)
- [ ] Leave/cancel flows with capacity handling
- [ ] Push notifications: match found, reminder, change/cancel
- [ ] API versioning: /v1, additive changes only
- [ ] Environments: dev/staging/prod separation

## Should-have (high value before public launch)
- [ ] Upcoming runs + basic history
- [ ] Onboarding refinements (prefill pace/distance)
- [ ] Analytics: activation, match rate, drop-off points
- [ ] Rate limits for OTP + join/match
- [ ] Safety: report user/run, block user
- [ ] Support: help/contact + FAQ

## Later (after product-market signal)
- [ ] Apple/Google login
- [ ] Advanced matching (compatibility scoring, groups > 2)
- [ ] In-app chat or crew building
- [ ] Payments
- [ ] Background GPS / HealthKit / Google Fit

## Minimal data schema (v1)
- [ ] users (id, phone, status, created_at)
- [ ] profiles (user_id, pace_min/max, default_distance, run_type, home_area)
- [ ] otp_requests (phone, code_hash, expires_at, attempts, sent_at)
- [ ] sessions (user_id, refresh_hash, device_id, expires_at, revoked_at)
- [ ] devices (user_id, platform, push_token)
- [ ] runs (id, creator_id, type, distance, pace, location, time, capacity, status)
- [ ] run_members (run_id, user_id, role, status, joined_at)
- [ ] notifications (user_id, type, payload, sent_at, status)

## Minimal API surface (v1)
- [ ] POST /api/v1/auth/otp/request
- [ ] POST /api/v1/auth/otp/verify
- [ ] POST /api/v1/auth/token/refresh
- [ ] POST /api/v1/auth/logout
- [ ] POST /api/v1/runs (create or match)
- [ ] POST /api/v1/runs/:id/join
- [ ] POST /api/v1/runs/:id/leave
- [ ] GET /api/v1/runs/:id
- [ ] GET /api/v1/runs/upcoming
- [ ] POST /api/v1/devices
- [ ] POST /api/v1/notifications/test (staging only)

## QA and release checks
- [ ] OTP resend cooldown and invalid/expired codes
- [ ] Token refresh on expiry during flow
- [ ] Location permission denial handling
- [ ] Timezone handling (meeting time correct)
- [ ] Idempotent join/match (no duplicates)
- [ ] Push delivery on iOS and Android
- [ ] Error/empty/loading states for all steps
- [ ] Staging smoke test before prod deploy
