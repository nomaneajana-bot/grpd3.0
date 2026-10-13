/**
 * Batch 2 — WALK/LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06, M07 gutters)
 * ISSUE-003, ISSUE-010 participation, M04/M05/M06; Batch 1 privacy regression.
 *
 * Usage:
 *   EXPO_PUBLIC_DEMO_MODE=true node scripts/batch2-walk-join-evidence.mjs
 *
 * Demo surface only — hosted_claim stays false.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const REPO_ROOT = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();
const REPO_EVIDENCE_REL = "docs/audit/batch2-walk-join";
const REPO_EVIDENCE = path.join(REPO_ROOT, REPO_EVIDENCE_REL);
const REPO_SHOTS = path.join(REPO_EVIDENCE, "screenshots");
const ARTIFACT_OUT = "/opt/cursor/artifacts/batch2-walk-join";
const ARTIFACT_SHOTS = path.join(ARTIFACT_OUT, "screenshots");
const SIDE = path.join(REPO_EVIDENCE, "side-by-side");
fs.mkdirSync(REPO_SHOTS, { recursive: true });
fs.mkdirSync(ARTIFACT_SHOTS, { recursive: true });
fs.mkdirSync(SIDE, { recursive: true });

const testedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();

const TOKEN = `W2${Date.now().toString(36).slice(-7).toUpperCase()}`;
const TITLE = `Marche ${TOKEN}`;
const PURPOSE = `Objectif unique ${TOKEN} — pratiquer à ton rythme.`;
const SPOT = `Phare ${TOKEN}`;
const LANGUAGE = `Darija ${TOKEN}`;
const HOST_PHONE = "0611111111";
const PARTICIPANT_PHONE = "0622222222";
const OUTSIDER_PHONE = "0699999999";
const PENDING_PHONE = "0688888888";

const evidence = {
  batch: "Batch 2 — WALK/LANGUAGE CREATE → DETAIL → JOIN → CANCEL",
  issues: ["ISSUE-003", "ISSUE-010-participation", "M04", "M05", "M06", "M07-gutters"],
  tested_sha: testedSha,
  tip_sha: testedSha,
  branch,
  environment: "demo",
  hosted_claim: false,
  note:
    "DEMO_MODE only. Does not claim hosted/native/UAT. Creator auto-attendance and public-club association left unresolved (current behavior preserved). Batch 1 demo gate previously CLEARED; privacy regression re-checked here.",
  unresolved_rules_reported: [
    "creator_auto_attendance — preserved current auto-join of host on create; not decided",
    "public_club_association — preserved current null clubId for public; not decided",
  ],
  unique: { token: TOKEN, title: TITLE, purpose: PURPOSE, spot: SPOT, language: LANGUAGE },
  checks: {},
  screenshots: [],
  outing_id: null,
  other_outing_id: null,
  errors: [],
};

function record(name, ok, detail = "") {
  evidence.checks[name] = { ok: Boolean(ok), detail: String(detail ?? "") };
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

async function shot(page, name) {
  const repoAbs = path.join(REPO_SHOTS, name);
  const artAbs = path.join(ARTIFACT_SHOTS, name);
  await page.screenshot({ path: repoAbs, fullPage: false });
  fs.copyFileSync(repoAbs, artAbs);
  const rel = `${REPO_EVIDENCE_REL}/screenshots/${name}`;
  evidence.screenshots.push(rel);
  return rel;
}

async function bodyText(page) {
  return page.evaluate(() => document.body?.innerText || "");
}

async function clearAuth(page, { preserveMockWorld = false } = {}) {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await page.evaluate((preserve) => {
    try {
      if (!preserve) {
        localStorage.clear();
        sessionStorage.clear();
        return;
      }
      for (const k of [
        "grpd_auth_user_v1",
        "grpd_auth_tokens_v1",
        "grpd_device_id_v1",
        "grpd_use_mock_api_v1",
        "grpd_login_phone_v1",
        "grpd_login_otp_request_v1",
        "grpd_onboarding_v1",
      ]) {
        localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }, preserveMockWorld);
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 800));
}

async function clickTestId(page, testId) {
  await page.waitForFunction(
    (id) => {
      const match = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      ).find((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });
      if (!match) return false;
      match.scrollIntoView({ block: "center" });
      match.click();
      return true;
    },
    { timeout: 20000 },
    testId,
  );
}

async function typeTestId(page, testId, value) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 15000 });
  await page.evaluate((id) => {
    const el = Array.from(
      document.querySelectorAll(`[data-testid="${id}"]`),
    ).find((n) => n.getBoundingClientRect().width > 0);
    if (!el) throw new Error(`No visible ${id}`);
    el.focus();
    const proto =
      el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc?.set?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, testId);
  await page.keyboard.type(value, { delay: 15 });
}

async function enterOtp(page, code) {
  for (let i = 0; i < code.length; i++) {
    const sel = `[data-testid="otp-digit-${i}"]`;
    await page.waitForSelector(sel, { visible: true, timeout: 15000 });
    await page.click(sel);
    await page.keyboard.type(code[i]);
  }
}

async function loginViaUi(page, phone, otp) {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 600));
  await clickTestId(page, "cta-secondary");
  await page.waitForFunction(() => /\/phone/.test(location.pathname), {
    timeout: 15000,
  });
  await page.evaluate(() => {
    const el = Array.from(
      document.querySelectorAll('[data-testid="phone-input"]'),
    ).find((n) => n.getBoundingClientRect().width > 0);
    el?.focus();
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(phone, { delay: 20 });
  await clickTestId(page, "cta-primary");
  await page.waitForFunction(() => /verify/i.test(location.pathname), {
    timeout: 20000,
  });
  await enterOtp(page, otp);
  try {
    await clickTestId(page, "cta-primary");
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () =>
      /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body.innerText || ""),
    { timeout: 45000 },
  );
  await new Promise((r) => setTimeout(r, 1000));
}

function assertOutingUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/session\/([^/]+)$/);
    if (!m) return { ok: false, id: null, reason: u.pathname };
    if (m[1] === "create") return { ok: false, id: null, reason: "create" };
    return { ok: true, id: m[1], reason: u.pathname };
  } catch (e) {
    return { ok: false, id: null, reason: String(e) };
  }
}

async function readAttendance(page, sessionId) {
  return page.evaluate((sid) => {
    try {
      const auth = JSON.parse(localStorage.getItem("grpd_auth_user_v1") || "null");
      const att = JSON.parse(localStorage.getItem("mock:attendance") || "{}");
      const mine = Object.values(att).find(
        (a) => a.sessionId === sid && a.userId === auth?.id,
      );
      const joined = JSON.parse(localStorage.getItem("joinedSessions:v1") || "[]");
      const local = joined.find((j) => j.sessionId === sid);
      return {
        userId: auth?.id ?? null,
        status: mine?.status ?? null,
        groupId: mine?.groupId ?? local?.groupId ?? null,
        localJoined: Boolean(local),
      };
    } catch {
      return { userId: null, status: null, groupId: null, localJoined: false };
    }
  }, sessionId);
}

async function measurePendingGutters(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-testid="club-pending-panel"]');
    const title = document.querySelector('[data-testid="club-pending-title"]');
    const btn = document.querySelector('[data-testid="club-pending-discover-cta"]');
    if (!panel || !title || !btn) return null;
    const pr = panel.getBoundingClientRect();
    const tr = title.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    return {
      viewportWidth: vw,
      titleLeft: Math.round(tr.left),
      titleRightInset: Math.round(vw - tr.right),
      btnLeft: Math.round(br.left),
      btnRightInset: Math.round(vw - br.right),
      panelLeft: Math.round(pr.left),
      consistent: tr.left >= 20 && br.left >= 20 && vw - tr.right >= 20 && vw - br.right >= 20,
    };
  });
}

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);
page.on("dialog", async (dialog) => {
  try {
    await dialog.dismiss();
  } catch {
    /* ignore */
  }
});

try {
  // --- Host creates walk outing with language ---
  await clearAuth(page, { preserveMockWorld: false });
  await loginViaUi(page, HOST_PHONE, "000000");
  record("login_host", true, HOST_PHONE);
  await shot(page, "01-host-home.png");

  await page.goto(BASE + "/session/create", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot(page, "02-create-before-fill.png");

  // Missing fields: try publish walk without title
  await clickTestId(page, "session-mode-walking");
  await new Promise((r) => setTimeout(r, 600));
  const paceCardAbsent = await page.evaluate(
    () => !document.querySelector('[data-testid="session-pace-groups-card"]'),
  );
  record(
    "walk_hides_pace_groups_card",
    paceCardAbsent,
    paceCardAbsent ? "absent" : "STILL VISIBLE",
  );
  await shot(page, "03-walk-mode-no-pace.png");

  await clickTestId(page, "session-publish-btn");
  await new Promise((r) => setTimeout(r, 800));
  const formErr = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="session-form-error"]');
    return el?.textContent?.trim() || "";
  });
  const stayedOnCreate = /\/session\/create/.test(page.url());
  record(
    "missing_title_blocks_publish",
    stayedOnCreate && /Titre requis/i.test(formErr),
    formErr || (stayedOnCreate ? "stayed on create, no error text" : page.url()),
  );

  await typeTestId(page, "session-title-input", TITLE);
  await typeTestId(page, "session-purpose-input", PURPOSE);

  // Spot: custom add
  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 500));
  try {
    await typeTestId(page, "session-spot-custom-input", SPOT);
    await clickTestId(page, "session-spot-custom-add");
    await new Promise((r) => setTimeout(r, 600));
    record("unique_spot_seeded", true, SPOT);
  } catch (e) {
    record("unique_spot_seeded", false, String(e.message || e));
  }

  // Optional language — no English default
  await clickTestId(page, "session-language-toggle");
  await new Promise((r) => setTimeout(r, 300));
  const langPlaceholder = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="session-language-input"]');
    return el?.getAttribute("placeholder") || el?.placeholder || "";
  });
  record(
    "language_no_english_default",
    !/english/i.test(langPlaceholder) && !(await page.evaluate(() => {
      const el = document.querySelector('[data-testid="session-language-input"]');
      return (el?.value || "").trim();
    })),
    `placeholder=${langPlaceholder}`,
  );
  await typeTestId(page, "session-language-input", LANGUAGE);
  await shot(page, "04-walk-form-filled.png");

  // Audience public (standalone) — preserve current clubId null behavior
  try {
    await clickTestId(page, "session-audience-public");
  } catch {
    /* may already be public */
  }

  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 45000 },
  );
  await new Promise((r) => setTimeout(r, 1500));
  const pub = assertOutingUrl(page.url());
  record("walk_publish_real_outing_id", pub.ok, pub.reason);
  evidence.outing_id = pub.id;
  await shot(page, "05-detail-after-publish.png");

  const detailText = await bodyText(page);
  record(
    "detail_title_matches",
    detailText.includes(TITLE),
    TITLE,
  );
  record(
    "detail_purpose_matches",
    detailText.includes(PURPOSE) ||
      Boolean(
        await page.evaluate(
          (p) =>
            (document.querySelector('[data-testid="session-purpose-text"]')
              ?.textContent || "").includes(p),
          PURPOSE,
        ),
      ),
    PURPOSE,
  );
  record("detail_spot_matches", detailText.includes(SPOT), SPOT);
  record(
    "detail_language_optional_shown",
    detailText.includes(LANGUAGE) ||
      Boolean(
        await page.evaluate(
          (l) =>
            (document.querySelector('[data-testid="session-language-label"]')
              ?.textContent || "").includes(l),
          LANGUAGE,
        ),
      ),
    LANGUAGE,
  );
  record(
    "detail_no_running_pace_required",
    !/Choisis un groupe|5'00|Groupes & allures/i.test(detailText),
    "no pace demand on walk detail",
  );

  // Creator auto-attendance — observe only (unresolved rule)
  const hostAtt = await readAttendance(page, pub.id);
  record(
    "creator_auto_attendance_observed",
    true,
    `status=${hostAtt.status} localJoined=${hostAtt.localJoined} (UNRESOLVED — not deciding)`,
  );

  // Create a second outing to ensure no overwrite
  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  await clickTestId(page, "session-mode-walking");
  await typeTestId(page, "session-title-input", `Other ${TOKEN}`);
  await typeTestId(page, "session-purpose-input", `Other purpose ${TOKEN}`);
  // leave language off
  try {
    await clickTestId(page, "session-audience-public");
  } catch {
    /* */
  }
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 45000 },
  );
  const other = assertOutingUrl(page.url());
  evidence.other_outing_id = other.id;
  record(
    "second_outing_distinct_id",
    other.ok && other.id !== pub.id,
    `${other.id} vs ${pub.id}`,
  );

  // Original outing unchanged
  await page.goto(BASE + `/session/${pub.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const origText = await bodyText(page);
  record(
    "original_outing_not_overwritten",
    origText.includes(TITLE) && origText.includes(PURPOSE) && !origText.includes(`Other purpose ${TOKEN}`),
    pub.id,
  );

  // Nav away unfinished form
  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await clickTestId(page, "session-mode-walking");
  await typeTestId(page, "session-title-input", `Draft ${TOKEN}`);
  page.off("dialog");
  let discardPrompted = false;
  page.on("dialog", async (dialog) => {
    discardPrompted = true;
    try {
      await dialog.accept();
    } catch {
      /* */
    }
  });
  // Try back
  await page.evaluate(() => {
    const back = Array.from(document.querySelectorAll("*")).find(
      (el) => (el.textContent || "").trim() === "Retour",
    );
    back?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  record(
    "unsaved_nav_away_guard_or_leave",
    discardPrompted || !/\/session\/create/.test(page.url()),
    `dialog=${discardPrompted} url=${page.url()}`,
  );

  // --- Participant B: join / cancel ---
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PARTICIPANT_PHONE, "000000");
  record("login_participant", true, PARTICIPANT_PHONE);

  await page.goto(BASE + `/session/${pub.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, "06-m04-before-join.png");

  const joinVisible = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-join-btn"]'),
  );
  record("m04_join_cta_visible", joinVisible, "session-join-btn");
  if (!joinVisible) {
    throw new Error("BLOCKED: join CTA missing for participant");
  }

  await clickTestId(page, "session-join-btn");
  await new Promise((r) => setTimeout(r, 1500));
  // Duplicate tap / retry
  const stillJoin = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-join-btn"]'),
  );
  if (stillJoin) {
    await clickTestId(page, "session-join-btn");
    await new Promise((r) => setTimeout(r, 1000));
  }
  const joinedPanel = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-joined-panel"]'),
  );
  const attAfterJoin = await readAttendance(page, pub.id);
  record(
    "m05_joined_panel_and_attendance",
    joinedPanel &&
      (attAfterJoin.status === "joined" || attAfterJoin.localJoined === true),
    JSON.stringify(attAfterJoin),
  );
  await shot(page, "07-m05-joined.png");

  // Selected outing only — other outing not joined
  const attOther = await readAttendance(page, other.id);
  record(
    "join_selected_outing_only",
    attOther.status !== "joined" && attOther.localJoined !== true,
    JSON.stringify(attOther),
  );

  // Reload persistence
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const joinedAfterReload = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-joined-panel"]'),
  );
  const attReload = await readAttendance(page, pub.id);
  record(
    "join_persists_after_reload",
    joinedAfterReload &&
      (attReload.status === "joined" || attReload.localJoined),
    JSON.stringify(attReload),
  );
  await shot(page, "08-joined-after-reload.png");

  // M06 cancel confirm
  await clickTestId(page, "session-leave-btn");
  await new Promise((r) => setTimeout(r, 600));
  const m06 = await page.evaluate(() => {
    const modal = document.querySelector(
      '[data-testid="session-leave-confirm-modal"]',
    );
    const text = modal?.innerText || "";
    return {
      visible: !!modal,
      keep: !!document.querySelector('[data-testid="session-leave-keep-btn"]'),
      confirm: !!document.querySelector(
        '[data-testid="session-leave-confirm-btn"]',
      ),
      notLeaveClub: /adhésion|membre du club|inchang/i.test(text),
      impliesLeaveClub: /quitter le club/i.test(text),
    };
  });
  record(
    "m06_cancel_modal_visible",
    m06.visible && m06.keep && m06.confirm,
    JSON.stringify(m06),
  );
  record(
    "m06_does_not_imply_leave_club",
    m06.notLeaveClub && !m06.impliesLeaveClub,
    JSON.stringify(m06),
  );
  await shot(page, "09-m06-cancel-confirm.png");

  // Keep place first
  await clickTestId(page, "session-leave-keep-btn");
  await new Promise((r) => setTimeout(r, 500));
  const stillJoined = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-joined-panel"]'),
  );
  record("m06_keep_place_retains_join", stillJoined, "kept");

  await clickTestId(page, "session-leave-btn");
  await new Promise((r) => setTimeout(r, 400));
  await clickTestId(page, "session-leave-confirm-btn");
  await new Promise((r) => setTimeout(r, 1500));
  const afterCancel = await readAttendance(page, pub.id);
  const joinAgain = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-join-btn"]'),
  );
  record(
    "m06_confirm_cancels_attendance",
    joinAgain && afterCancel.status !== "joined",
    JSON.stringify(afterCancel),
  );
  await shot(page, "10-after-cancel.png");

  // Membership distinct — still not a club leave (outsider path N/A); check no club leave UI text as success
  const clubText = await bodyText(page);
  record(
    "cancel_not_leave_club_copy",
    !/tu as quitté le club/i.test(clubText),
    "no club-leave success after outing cancel",
  );

  // Re-login cancel persistence
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PARTICIPANT_PHONE, "000000");
  await page.goto(BASE + `/session/${pub.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const afterRelogin = await readAttendance(page, pub.id);
  const canJoinAgain = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-join-btn"]'),
  );
  record(
    "cancel_persists_after_relogin",
    canJoinAgain && afterRelogin.status !== "joined",
    JSON.stringify(afterRelogin),
  );

  // --- M07 gutters: establish pending, measure phone + desktop ---
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, HOST_PHONE, "000000");
  const clubName = `Batch2 Club ${TOKEN}`;
  await page.goto(BASE + "/club/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await typeTestId(page, "club-name-input", clubName);
  await typeTestId(page, "club-city-input", "Casablanca");
  await page.evaluate(() => {
    const purpose = document.querySelector(
      'textarea, [aria-label="Objectif du club"]',
    );
    if (purpose) {
      const proto = window.HTMLTextAreaElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc?.set?.call(purpose, "Marche & langues");
      purpose.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await clickTestId(page, "club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));

  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PENDING_PHONE, "000000");
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await typeTestId(page, "club-request-name-input", clubName);
  await clickTestId(page, "club-request-submit");
  await new Promise((r) => setTimeout(r, 2000));
  await page.goto(BASE + "/club", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  // Phone viewport (already 390)
  const guttersPhone = await measurePendingGutters(page);
  record(
    "m07_gutters_phone",
    Boolean(guttersPhone?.consistent),
    JSON.stringify(guttersPhone),
  );
  await shot(page, "11-m07-after-phone.png");

  // Keyboard focus / unobstructed controls
  const focusOk = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="club-pending-discover-cta"]');
    if (!btn) return false;
    btn.focus();
    const rect = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return (
      rect.width > 40 &&
      rect.height > 40 &&
      cs.visibility !== "hidden" &&
      document.activeElement === btn
    );
  });
  record("m07_controls_focusable_unobstructed", focusOk, "discover CTA");

  // Desktop viewport
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  const guttersDesktop = await measurePendingGutters(page);
  record(
    "m07_gutters_desktop",
    Boolean(guttersDesktop?.consistent),
    JSON.stringify(guttersDesktop),
  );
  await shot(page, "12-m07-after-desktop.png");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // --- Batch 1 privacy regression (members-only unique logistics) ---
  await clearAuth(page, { preserveMockWorld: false });
  await loginViaUi(page, HOST_PHONE, "000000");
  const privClub = `Priv ${TOKEN}`;
  const privSpot = `PRIV${TOKEN}`;
  await page.goto(BASE + "/club/create", { waitUntil: "networkidle0" });
  await typeTestId(page, "club-name-input", privClub);
  await typeTestId(page, "club-city-input", "Rabat");
  await clickTestId(page, "club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));

  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  await clickTestId(page, "session-mode-walking");
  await typeTestId(page, "session-title-input", `PrivWalk ${TOKEN}`);
  await typeTestId(page, "session-purpose-input", `PrivPurpose ${TOKEN}`);
  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 400));
  try {
    await typeTestId(page, "session-spot-custom-input", privSpot);
    await clickTestId(page, "session-spot-custom-add");
  } catch {
    /* */
  }
  await clickTestId(page, "session-audience-club");
  await new Promise((r) => setTimeout(r, 400));
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 45000 },
  );
  const priv = assertOutingUrl(page.url());
  record("batch1_regression_publish_members", priv.ok, priv.reason);
  const memberSees = (await bodyText(page)).includes(privSpot);
  record("batch1_regression_member_sees_spot", memberSees, privSpot);

  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, OUTSIDER_PHONE, "000000");
  await page.goto(BASE + `/session/${priv.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const outText = await bodyText(page);
  const inaccessible =
    Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
    /n'est pas accessible|introuvable/i.test(outText);
  record(
    "batch1_regression_outsider_gated",
    inaccessible && !outText.includes(privSpot),
    inaccessible ? "gated" : "LEAK",
  );
  await shot(page, "13-batch1-regression-outsider.png");

  // Empty state: my-sessions after cancel should not show cancelled as joined
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PARTICIPANT_PHONE, "000000");
  await page.goto(BASE + "/my-sessions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const myText = await bodyText(page);
  record(
    "empty_or_no_cancelled_as_joined",
    !myText.includes(TITLE) || /Aucune|pas encore|Découvrir/i.test(myText),
    "cancelled walk not listed as joined",
  );
  await shot(page, "14-my-sessions-after-cancel.png");
} catch (err) {
  evidence.errors.push(String(err?.stack || err));
  console.error(err);
  try {
    await shot(page, "zz-error.png");
  } catch {
    /* */
  }
} finally {
  const checks = Object.values(evidence.checks);
  evidence.summary = {
    passed: checks.filter((c) => c.ok).length,
    failed: checks.filter((c) => !c.ok).length,
    total: checks.length,
  };
  evidence.generated_at = new Date().toISOString();

  // Preserve m07-before if present
  const before = path.join(REPO_SHOTS, "m07-before-flush.png");
  if (fs.existsSync(before)) {
    const rel = `${REPO_EVIDENCE_REL}/screenshots/m07-before-flush.png`;
    if (!evidence.screenshots.includes(rel)) evidence.screenshots.push(rel);
  }

  const jsonPath = path.join(REPO_EVIDENCE, "evidence.json");
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2));
  fs.writeFileSync(
    path.join(ARTIFACT_OUT, "evidence.json"),
    JSON.stringify(evidence, null, 2),
  );

  const lines = [
    `# Batch 2 evidence`,
    ``,
    `- **tested_sha:** \`${evidence.tested_sha}\``,
    `- **environment:** \`${evidence.environment}\` (hosted_claim=${evidence.hosted_claim})`,
    `- **summary:** ${evidence.summary.passed} PASS / ${evidence.summary.failed} FAIL / ${evidence.summary.total} total`,
    `- **outing_id:** \`${evidence.outing_id}\``,
    `- **unresolved:** ${evidence.unresolved_rules_reported.join("; ")}`,
    ``,
    `## Checks`,
    ``,
    ...Object.entries(evidence.checks).map(
      ([k, v]) => `- ${v.ok ? "PASS" : "FAIL"} \`${k}\` — ${v.detail}`,
    ),
    ``,
    `## Screenshots`,
    ``,
    ...evidence.screenshots.map((s) => `- \`${s}\``),
  ];
  fs.writeFileSync(path.join(REPO_EVIDENCE, "EVIDENCE.md"), lines.join("\n"));
  fs.writeFileSync(path.join(ARTIFACT_OUT, "EVIDENCE.md"), lines.join("\n"));

  console.log("SUMMARY", evidence.summary);
  await browser.close();
  if (evidence.summary.failed > 0 || evidence.errors.length) {
    process.exitCode = 1;
  }
}
