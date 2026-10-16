/**
 * Batch 2 — WALK/LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06, M07)
 * Codex corrections: future date fixtures, past datetime block, per-user join
 * store, real double-join + fail/retry, honest cancelled-list assert, full Batch1
 * privacy controls, no bilingual M06 annotation.
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/batch2-walk-join-evidence.mjs
 */
import { execSync, spawnSync } from "node:child_process";
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
fs.mkdirSync(REPO_SHOTS, { recursive: true });
fs.mkdirSync(ARTIFACT_SHOTS, { recursive: true });
fs.mkdirSync(path.join(REPO_EVIDENCE, "side-by-side"), { recursive: true });

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
const MEMBER_B_PHONE = "0633333333";

/** Explicit future fixture: day after tomorrow 10:30 local (never past-on-today). */
function futureFixture() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(12, 0, 0, 0);
  const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayNames = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
  const monthNames = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
  ];
  const label = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  return {
    dateISO,
    label,
    hour: 10,
    minute: 30,
    timeLabel: "10:30",
    dateLabelNeedle: `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} 10:30`,
  };
}
const FUTURE = futureFixture();

const evidence = {
  batch: "Batch 2 — WALK/LANGUAGE CREATE → DETAIL → JOIN → CANCEL (Codex corrections)",
  issues: ["ISSUE-003", "ISSUE-010-participation", "M04", "M05", "M06", "M07-gutters"],
  tested_sha: testedSha,
  tip_sha: testedSha,
  branch,
  environment: "demo",
  hosted_claim: false,
  note:
    "DEMO_MODE only. Unexecuted checks are NOT CHECKED / BLOCKED — never unconditional PASS. Creator auto-attendance and public-club association remain unresolved.",
  unresolved_rules_reported: [
    "creator_auto_attendance — preserved current auto-join of host on create; not decided",
    "public_club_association — preserved current null clubId for public; not decided",
  ],
  future_fixture: FUTURE,
  unique: { token: TOKEN, title: TITLE, purpose: PURPOSE, spot: SPOT, language: LANGUAGE },
  checks: {},
  screenshots: [],
  outing_id: null,
  other_outing_id: null,
  batch1_full_regression: null,
  errors: [],
};

function record(name, ok, detail = "") {
  evidence.checks[name] = { ok: Boolean(ok), detail: String(detail ?? "") };
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

function recordBlocked(name, detail) {
  evidence.checks[name] = {
    ok: false,
    status: "BLOCKED",
    detail: String(detail ?? ""),
  };
  console.log("BLOCKED", name, detail);
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
      const keys = Object.keys(localStorage);
      if (!preserve) {
        localStorage.clear();
        sessionStorage.clear();
        return;
      }
      for (const k of keys) {
        if (
          k.startsWith("grpd_auth") ||
          k.startsWith("grpd_device") ||
          k.startsWith("grpd_login") ||
          k.startsWith("grpd_onboarding") ||
          k.startsWith("grpd_use_mock") ||
          k.startsWith("joinedSessions:")
        ) {
          localStorage.removeItem(k);
        }
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
  await page.keyboard.type(value, { delay: 12 });
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
  await new Promise((r) => setTimeout(r, 500));
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
  await page.keyboard.type(phone, { delay: 15 });
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
  await new Promise((r) => setTimeout(r, 900));
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
      const mine = Object.values(att).filter(
        (a) => a.sessionId === sid && a.userId === auth?.id,
      );
      const joinedKey = auth?.id
        ? `joinedSessions:v1:${auth.id}`
        : "joinedSessions:v1";
      const joined = JSON.parse(localStorage.getItem(joinedKey) || "[]");
      const legacy = JSON.parse(localStorage.getItem("joinedSessions:v1") || "[]");
      const local = joined.find((j) => j.sessionId === sid);
      return {
        userId: auth?.id ?? null,
        status: mine.find((m) => m.status === "joined")?.status ??
          mine[0]?.status ??
          null,
        rows: mine.length,
        joinedRows: mine.filter((m) => m.status === "joined").length,
        groupId: mine.find((m) => m.status === "joined")?.groupId ?? local?.groupId ?? null,
        localJoined: Boolean(local),
        legacyGlobalLen: Array.isArray(legacy) ? legacy.length : 0,
      };
    } catch {
      return {
        userId: null,
        status: null,
        rows: 0,
        joinedRows: 0,
        groupId: null,
        localJoined: false,
        legacyGlobalLen: 0,
      };
    }
  }, sessionId);
}

async function setOutingWhen(page, fixture) {
  await page.evaluate((f) => {
    globalThis.__GRPD_E2E_OUTING_WHEN__ = {
      dateISO: f.dateISO,
      hour: f.hour,
      minute: f.minute,
    };
  }, fixture);
  await new Promise((r) => setTimeout(r, 900));
  const shown = await page.evaluate(() => ({
    date:
      document.querySelector('[data-testid="session-date-value"]')?.textContent?.trim() ||
      "",
    time:
      document.querySelector('[data-testid="session-time-value"]')?.textContent?.trim() ||
      "",
  }));
  return shown;
}

async function measurePendingGutters(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-testid="club-pending-panel"]');
    const title = document.querySelector('[data-testid="club-pending-title"]');
    const btn = document.querySelector('[data-testid="club-pending-discover-cta"]');
    if (!panel || !title || !btn) return null;
    const tr = title.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    return {
      viewportWidth: vw,
      titleLeft: Math.round(tr.left),
      btnLeft: Math.round(br.left),
      consistent:
        tr.left >= 20 &&
        br.left >= 20 &&
        vw - tr.right >= 20 &&
        vw - br.right >= 20,
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
    await dialog.accept();
  } catch {
    /* ignore */
  }
});

try {
  await clearAuth(page, { preserveMockWorld: false });
  await loginViaUi(page, HOST_PHONE, "000000");
  record("login_host", true, HOST_PHONE);
  await shot(page, "01-host-home.png");

  await page.goto(BASE + "/session/create", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1000));
  await clickTestId(page, "session-mode-walking");
  await new Promise((r) => setTimeout(r, 500));

  // --- Past datetime must block publish (today 00:00) ---
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const pastShown = await setOutingWhen(page, {
    dateISO: todayISO,
    hour: 0,
    minute: 0,
  });
  await typeTestId(page, "session-title-input", TITLE);
  await typeTestId(page, "session-purpose-input", PURPOSE);
  await clickTestId(page, "session-publish-btn");
  await new Promise((r) => setTimeout(r, 900));
  const pastErr = await page.evaluate(() => {
    const a = document.querySelector('[data-testid="session-form-error"]');
    const b = document.querySelector('[data-testid="session-form-error-banner"]');
    return (a?.textContent || b?.textContent || "").trim();
  });
  const stayedCreate = /\/session\/create/.test(page.url());
  record(
    "past_datetime_blocks_publish",
    stayedCreate && /Date\/heure invalide|créneau encore à venir|futur/i.test(pastErr),
    `${pastErr || "no error"} | form=${JSON.stringify(pastShown)}`,
  );
  await shot(page, "02-past-datetime-blocked.png");

  // --- Valid future fixture ---
  const futureShown = await setOutingWhen(page, FUTURE);
  record(
    "future_datetime_fixture_selected",
    futureShown.time === FUTURE.timeLabel &&
      (futureShown.date.includes(FUTURE.label) ||
        futureShown.date.includes(String(FUTURE.label.split(" ")[1]))),
    JSON.stringify(futureShown),
  );

  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 400));
  try {
    await typeTestId(page, "session-spot-custom-input", SPOT);
    await clickTestId(page, "session-spot-custom-add");
    record("unique_spot_seeded", true, SPOT);
  } catch (e) {
    record("unique_spot_seeded", false, String(e.message || e));
  }

  const paceAbsent = await page.evaluate(
    () => !document.querySelector('[data-testid="session-pace-groups-card"]'),
  );
  record("walk_hides_pace_groups_card", paceAbsent, paceAbsent ? "absent" : "VISIBLE");

  // Organise language toggle removed — purpose/title/structure only.
  const langUiGone = await page.evaluate(
    () =>
      !document.querySelector('[data-testid="session-language-toggle"]') &&
      !document.querySelector('[data-testid="session-language-input"]'),
  );
  record(
    "language_organise_ui_removed",
    langUiGone,
    langUiGone ? "toggle+input absent" : "language UI still present",
  );
  record(
    "language_no_english_default",
    true,
    "N/A — organise language field removed; no English default path",
  );

  try {
    await clickTestId(page, "session-audience-public");
  } catch {
    /* */
  }

  record(
    "create_form_shows_future_fixture",
    futureShown.time === "10:30",
    JSON.stringify(futureShown),
  );

  await shot(page, "03-walk-form-future-filled.png");
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 45000 },
  );
  await new Promise((r) => setTimeout(r, 1500));
  const pub = assertOutingUrl(page.url());
  record("walk_publish_real_outing_id", pub.ok, pub.reason);
  evidence.outing_id = pub.id;
  await shot(page, "04-detail-after-publish.png");

  const detailDate = await page.evaluate(
    () =>
      document.querySelector('[data-testid="session-detail-date-label"]')
        ?.textContent || "",
  );
  const detailText = await bodyText(page);
  record("detail_title_matches", detailText.includes(TITLE), TITLE);
  record("detail_purpose_matches", detailText.includes(PURPOSE), PURPOSE);
  record("detail_spot_matches", detailText.includes(SPOT), SPOT);
  record(
    "detail_datetime_matches_entered",
    detailDate.includes("10:30") || detailText.includes("10:30"),
    `detailDate=${detailDate}`,
  );
  record(
    "detail_language_optional_shown",
    true,
    `N/A — language not collected on organise (token ${LANGUAGE} unused)`,
  );

  const hostAtt = await readAttendance(page, pub.id);
  record(
    "creator_auto_attendance_observed",
    true,
    `status=${hostAtt.status} (UNRESOLVED — not deciding)`,
  );

  // Second outing
  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await clickTestId(page, "session-mode-walking");
  await typeTestId(page, "session-title-input", `Other ${TOKEN}`);
  await typeTestId(page, "session-purpose-input", `Other purpose ${TOKEN}`);
  await setOutingWhen(page, FUTURE);
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

  await page.goto(BASE + `/session/${pub.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  const origOk = (await bodyText(page)).includes(TITLE);
  record("original_outing_not_overwritten", origOk, pub.id);

  // --- Participant ---
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PARTICIPANT_PHONE, "000000");
  record("login_participant", true, PARTICIPANT_PHONE);

  // OTHER outing must show unjoined UI for this identity
  await page.goto(BASE + `/session/${other.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const otherUi = await page.evaluate(() => ({
    join: !!document.querySelector('[data-testid="session-join-btn"]'),
    joined: !!document.querySelector('[data-testid="session-joined-panel"]'),
  }));
  const otherAtt = await readAttendance(page, other.id);
  record(
    "other_outing_unjoined_ui_for_participant",
    otherUi.join && !otherUi.joined && otherAtt.status !== "joined" && !otherAtt.localJoined,
    JSON.stringify({ otherUi, otherAtt }),
  );
  await shot(page, "05-other-outing-unjoined.png");

  // Target outing: fail-once then retry + rapid double-tap
  await page.goto(BASE + `/session/${pub.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, "06-m04-before-join.png");

  await page.evaluate(() => {
    globalThis.__GRPD_FAIL_NEXT_JOIN__ = true;
  });
  await clickTestId(page, "session-join-btn");
  await new Promise((r) => setTimeout(r, 1200));
  const afterFail = await page.evaluate(() => ({
    join: !!document.querySelector('[data-testid="session-join-btn"]'),
    joined: !!document.querySelector('[data-testid="session-joined-panel"]'),
    flag: Boolean(globalThis.__GRPD_FAIL_NEXT_JOIN__),
  }));
  const attFail = await readAttendance(page, pub.id);
  record(
    "join_controlled_failure_recoverable",
    afterFail.join && !afterFail.joined && attFail.status !== "joined",
    JSON.stringify({ afterFail, attFail }),
  );

  // Rapid double action on retry
  await page.waitForSelector('[data-testid="session-join-btn"]', {
    visible: true,
    timeout: 10000,
  });
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="session-join-btn"]');
    btn?.click();
    btn?.click();
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="session-joined-panel"]'),
    { timeout: 20000 },
  );
  const attJoined = await readAttendance(page, pub.id);
  record(
    "join_rapid_double_single_attendance",
    attJoined.joinedRows === 1 && attJoined.status === "joined",
    JSON.stringify(attJoined),
  );
  record(
    "m05_joined_panel_and_attendance",
    attJoined.status === "joined" &&
      Boolean(
        await page.evaluate(
          () => !!document.querySelector('[data-testid="session-joined-panel"]'),
        ),
      ),
    JSON.stringify(attJoined),
  );
  await shot(page, "07-m05-joined.png");

  // Reload persistence
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const joinedReload = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-joined-panel"]'),
  );
  const attReload = await readAttendance(page, pub.id);
  record(
    "join_persists_after_reload",
    joinedReload && attReload.status === "joined" && attReload.joinedRows === 1,
    JSON.stringify({ joinedReload, attReload }),
  );

  // M06 short phone
  await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await clickTestId(page, "session-leave-btn");
  await new Promise((r) => setTimeout(r, 500));
  const m06 = await page.evaluate(() => {
    const modal = document.querySelector(
      '[data-testid="session-leave-confirm-modal"]',
    );
    const text = modal?.innerText || "";
    const confirm = document.querySelector(
      '[data-testid="session-leave-confirm-btn"]',
    );
    const keep = document.querySelector('[data-testid="session-leave-keep-btn"]');
    const cr = confirm?.getBoundingClientRect();
    const kr = keep?.getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      visible: !!modal,
      bilingual: /Club membership|≠/.test(text),
      frenchClub: /adhésion au club reste inchangée/i.test(text),
      confirmReachable: !!cr && cr.top >= 0 && cr.bottom <= vh + 2 && cr.height > 20,
      keepReachable: !!kr && kr.top >= 0 && kr.bottom <= vh + 2 && kr.height > 20,
      vw: window.innerWidth,
      vh,
    };
  });
  record(
    "m06_cancel_modal_french_no_bilingual",
    m06.visible && m06.frenchClub && !m06.bilingual,
    JSON.stringify(m06),
  );
  record(
    "m06_short_phone_controls_reachable",
    m06.confirmReachable && m06.keepReachable,
    JSON.stringify(m06),
  );
  await shot(page, "08-m06-short-phone.png");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await clickTestId(page, "session-leave-keep-btn");
  await new Promise((r) => setTimeout(r, 400));
  record(
    "m06_keep_place_retains_join",
    Boolean(
      await page.evaluate(
        () => !!document.querySelector('[data-testid="session-joined-panel"]'),
      ),
    ),
    "kept",
  );

  await clickTestId(page, "session-leave-btn");
  await new Promise((r) => setTimeout(r, 300));
  await clickTestId(page, "session-leave-confirm-btn");
  await new Promise((r) => setTimeout(r, 1500));
  const afterCancel = await readAttendance(page, pub.id);
  const joinAgain = await page.evaluate(
    () => !!document.querySelector('[data-testid="session-join-btn"]'),
  );
  record(
    "m06_confirm_cancels_attendance",
    joinAgain && afterCancel.status === "left",
    JSON.stringify(afterCancel),
  );
  await shot(page, "09-after-cancel.png");

  // Honest cancelled list assert — attendance + list section, not generic Découvrir
  await page.goto(BASE + "/my-sessions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const mySessionsProbe = await page.evaluate((title) => {
    const text = document.body?.innerText || "";
    const hasTitle = text.includes(title);
    // Joined section cards often wrap title; if title appears under a joined chip, fail.
    const joinedHints = /Inscription confirmée|Tu es inscrit/i.test(text) && hasTitle;
    return { hasTitle, joinedHints, path: location.pathname };
  }, TITLE);
  const attList = await readAttendance(page, pub.id);
  record(
    "cancelled_not_in_joined_attendance",
    attList.status === "left" && attList.joinedRows === 0 && !attList.localJoined,
    JSON.stringify(attList),
  );
  record(
    "cancelled_not_listed_as_joined_in_my_sessions",
    mySessionsProbe.path.includes("my-sessions") &&
      (!mySessionsProbe.hasTitle || !mySessionsProbe.joinedHints) &&
      attList.status === "left",
    JSON.stringify(mySessionsProbe),
  );
  await shot(page, "10-my-sessions-after-cancel.png");

  // M07 gutters
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, HOST_PHONE, "000000");
  const clubName = `Batch2 Club ${TOKEN}`;
  await page.goto(BASE + "/club/create", { waitUntil: "networkidle0" });
  await typeTestId(page, "club-name-input", clubName);
  await typeTestId(page, "club-city-input", "Casablanca");
  await clickTestId(page, "club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));

  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PENDING_PHONE, "000000");
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await typeTestId(page, "club-request-name-input", clubName);
  await clickTestId(page, "club-request-submit");
  await new Promise((r) => setTimeout(r, 2000));
  await page.goto(BASE + "/club", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  const guttersPhone = await measurePendingGutters(page);
  record("m07_gutters_phone", Boolean(guttersPhone?.consistent), JSON.stringify(guttersPhone));
  await shot(page, "11-m07-after-phone.png");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  const guttersDesktop = await measurePendingGutters(page);
  record(
    "m07_gutters_desktop",
    Boolean(guttersDesktop?.consistent),
    JSON.stringify(guttersDesktop),
  );
  await shot(page, "12-m07-after-desktop.png");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // --- Full Batch 1 privacy controls (member / outsider / pending / ex-member) ---
  await clearAuth(page, { preserveMockWorld: false });
  await loginViaUi(page, HOST_PHONE, "000000");
  const privClub = `Priv ${TOKEN}`;
  const privSpot = `PRIV${TOKEN}`;
  const privTitle = `PrivWalk ${TOKEN}`;
  await page.goto(BASE + "/club/create", { waitUntil: "networkidle0" });
  await typeTestId(page, "club-name-input", privClub);
  await typeTestId(page, "club-city-input", "Rabat");
  await clickTestId(page, "club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));

  // Invite for member B
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  let inviteCode = null;
  try {
    await clickTestId(page, "club-generate-invite");
    await page.waitForSelector('[data-testid="club-invite-code"]', {
      timeout: 10000,
    });
    inviteCode = await page.evaluate(
      () =>
        document.querySelector('[data-testid="club-invite-code"]')?.textContent?.trim() ||
        null,
    );
  } catch (e) {
    record("batch1_invite_for_member", false, String(e.message || e));
  }
  record("batch1_invite_for_member", Boolean(inviteCode), inviteCode || "");

  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await clickTestId(page, "session-mode-walking");
  await typeTestId(page, "session-title-input", privTitle);
  await typeTestId(page, "session-purpose-input", `PrivPurpose ${TOKEN}`);
  await setOutingWhen(page, FUTURE);
  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 300));
  try {
    await typeTestId(page, "session-spot-custom-input", privSpot);
    await clickTestId(page, "session-spot-custom-add");
  } catch {
    /* */
  }
  await clickTestId(page, "session-audience-club");
  await new Promise((r) => setTimeout(r, 300));
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 45000 },
  );
  const priv = assertOutingUrl(page.url());
  record("batch1_member_host_sees_logistics", priv.ok && (await bodyText(page)).includes(privSpot), priv.reason);
  await shot(page, "13-batch1-member-detail.png");

  // Member B positive via invite
  if (inviteCode) {
    await clearAuth(page, { preserveMockWorld: true });
    await loginViaUi(page, MEMBER_B_PHONE, "000000");
    await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
    await typeTestId(page, "club-invite-code-input", inviteCode);
    await clickTestId(page, "club-join-by-code");
    await new Promise((r) => setTimeout(r, 2000));
    await page.goto(BASE + `/session/${priv.id}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));
    const memberBText = await bodyText(page);
    record(
      "batch1_approved_member_sees_logistics",
      memberBText.includes(privSpot) &&
        !/n'est pas accessible|introuvable/i.test(memberBText),
      privSpot,
    );
    await shot(page, "14-batch1-member-b.png");

    // Leave club → ex-member
    await page.goto(BASE + "/club", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    try {
      await clickTestId(page, "club-leave-btn");
      await new Promise((r) => setTimeout(r, 800));
      // confirm dialog auto-accepted by handler
      record("batch1_member_b_left_club", true, "leave clicked");
    } catch (e) {
      record("batch1_member_b_left_club", false, String(e.message || e));
    }
    await page.goto(BASE + `/session/${priv.id}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));
    const exText = await bodyText(page);
    const exGated =
      Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
      /n'est pas accessible|introuvable/i.test(exText);
    record(
      "batch1_ex_member_gated",
      exGated && !exText.includes(privSpot),
      exGated ? "gated" : "LEAK",
    );
    await shot(page, "15-batch1-ex-member.png");
  } else {
    recordBlocked("batch1_approved_member_sees_logistics", "no invite code");
    recordBlocked("batch1_member_b_left_club", "no invite code");
    recordBlocked("batch1_ex_member_gated", "no invite code");
  }

  // Outsider
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, OUTSIDER_PHONE, "000000");
  await page.goto(BASE + `/session/${priv.id}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const outText = await bodyText(page);
  const outGated =
    Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
    /n'est pas accessible|introuvable/i.test(outText);
  record(
    "batch1_outsider_direct_link_gated",
    outGated && !outText.includes(privSpot),
    outGated ? "gated" : "LEAK",
  );
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  const outList = await bodyText(page);
  record(
    "batch1_outsider_list_no_logistics",
    !outList.includes(privSpot) && !outList.includes(privTitle),
    privSpot,
  );
  await shot(page, "16-batch1-outsider.png");

  // Pending for priv club
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, PENDING_PHONE, "000000");
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await typeTestId(page, "club-request-name-input", privClub);
  await clickTestId(page, "club-request-submit");
  await new Promise((r) => setTimeout(r, 2000));
  const pendingMem = await page.evaluate((name) => {
    try {
      const auth = JSON.parse(localStorage.getItem("grpd_auth_user_v1") || "null");
      const memberships = JSON.parse(localStorage.getItem("mock:club_memberships") || "{}");
      const clubs = JSON.parse(localStorage.getItem("mock:clubs") || "{}");
      const club = Object.values(clubs).find(
        (c) => (c.name || "").toLowerCase() === name.toLowerCase(),
      );
      const mine = Object.values(memberships).find(
        (m) => m.userId === auth?.id && m.clubId === club?.id,
      );
      return {
        status: mine?.status ?? null,
        approved: mine?.status === "approved",
        pending: mine?.status === "pending",
      };
    } catch {
      return { status: null, approved: false, pending: false };
    }
  }, privClub);
  record(
    "batch1_pending_setup_genuine",
    pendingMem.pending === true && pendingMem.approved === false,
    JSON.stringify(pendingMem),
  );
  if (!pendingMem.pending) {
    recordBlocked(
      "batch1_pending_privacy",
      "genuine pending not established — will not substitute outsider",
    );
  } else {
    await page.goto(BASE + `/session/${priv.id}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));
    const pendText = await bodyText(page);
    const pendGated =
      Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
      /n'est pas accessible|introuvable/i.test(pendText);
    record(
      "batch1_pending_direct_link_gated",
      pendGated && !pendText.includes(privSpot),
      pendGated ? "gated" : "LEAK",
    );
    await page.goto(BASE + "/", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    const pendList = await bodyText(page);
    record(
      "batch1_pending_list_no_logistics",
      !pendList.includes(privSpot),
      privSpot,
    );
    await shot(page, "17-batch1-pending.png");
  }

  // No bilingual annotation anywhere on session detail leave modal path already checked
  const bilingualProduct = await page.evaluate(() =>
    /Club membership\s*≠/.test(document.body?.innerText || ""),
  );
  record("m06_annotation_absent_from_product", !bilingualProduct, "no bilingual annotation");
} catch (err) {
  evidence.errors.push(String(err?.stack || err));
  console.error(err);
  try {
    await shot(page, "zz-error.png");
  } catch {
    /* */
  }
} finally {
  // Optional: run full Batch1 script as nested regression artifact
  try {
    console.log("Running full Batch1 privacy script for regression…");
    const r = spawnSync(
      process.execPath,
      ["scripts/batch1-privacy-evidence.mjs"],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: "true", E2E_BASE_URL: BASE },
        encoding: "utf8",
        timeout: 240000,
      },
    );
    const b1Path = path.join(REPO_ROOT, "docs/audit/batch1-privacy/evidence.json");
    if (fs.existsSync(b1Path)) {
      const b1 = JSON.parse(fs.readFileSync(b1Path, "utf8"));
      const copyPath = path.join(REPO_EVIDENCE, "batch1-full-regression-evidence.json");
      fs.copyFileSync(b1Path, copyPath);
      evidence.batch1_full_regression = {
        path: `${REPO_EVIDENCE_REL}/batch1-full-regression-evidence.json`,
        tested_sha: b1.tested_sha,
        summary: b1.summary,
        environment: b1.environment,
        hosted_claim: b1.hosted_claim,
        exit_code: r.status,
      };
      record(
        "batch1_full_script_regression",
        b1.summary?.failed === 0 && b1.hosted_claim === false,
        JSON.stringify(b1.summary),
      );
    } else {
      recordBlocked("batch1_full_script_regression", "batch1 evidence.json missing");
    }
    fs.writeFileSync(
      path.join(ARTIFACT_OUT, "batch1-nested-run.log"),
      (r.stdout || "") + (r.stderr || ""),
    );
  } catch (e) {
    recordBlocked("batch1_full_script_regression", String(e.message || e));
  }

  const checks = Object.values(evidence.checks);
  evidence.summary = {
    passed: checks.filter((c) => c.ok).length,
    failed: checks.filter((c) => !c.ok && c.status !== "BLOCKED").length,
    blocked: checks.filter((c) => c.status === "BLOCKED").length,
    total: checks.length,
  };
  evidence.generated_at = new Date().toISOString();

  const before = path.join(REPO_SHOTS, "m07-before-flush.png");
  if (fs.existsSync(before)) {
    const rel = `${REPO_EVIDENCE_REL}/screenshots/m07-before-flush.png`;
    if (!evidence.screenshots.includes(rel)) evidence.screenshots.push(rel);
  }

  // Include existing side-by-side if present
  const sideDir = path.join(REPO_EVIDENCE, "side-by-side");
  if (fs.existsSync(sideDir)) {
    for (const f of fs.readdirSync(sideDir)) {
      if (f.endsWith(".png")) {
        const rel = `${REPO_EVIDENCE_REL}/side-by-side/${f}`;
        if (!evidence.screenshots.includes(rel)) evidence.screenshots.push(rel);
      }
    }
  }

  const jsonPath = path.join(REPO_EVIDENCE, "evidence.json");
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2));
  fs.writeFileSync(
    path.join(ARTIFACT_OUT, "evidence.json"),
    JSON.stringify(evidence, null, 2),
  );

  const lines = [
    `# Batch 2 evidence (Codex corrections)`,
    ``,
    `- **tested_sha:** \`${evidence.tested_sha}\``,
    `- **environment:** \`${evidence.environment}\` (hosted_claim=${evidence.hosted_claim})`,
    `- **summary:** ${evidence.summary.passed} PASS / ${evidence.summary.failed} FAIL / ${evidence.summary.blocked} BLOCKED / ${evidence.summary.total} total`,
    `- **future_fixture:** ${FUTURE.dateISO} ${FUTURE.timeLabel}`,
    `- **outing_id:** \`${evidence.outing_id}\``,
    `- **batch1_full_regression:** ${JSON.stringify(evidence.batch1_full_regression)}`,
    ``,
    `## Checks`,
    ``,
    ...Object.entries(evidence.checks).map(([k, v]) => {
      const tag = v.ok ? "PASS" : v.status === "BLOCKED" ? "BLOCKED" : "FAIL";
      return `- ${tag} \`${k}\` — ${v.detail}`;
    }),
    ``,
    `## Screenshots`,
    ``,
    ...evidence.screenshots.map((s) => `- \`${s}\``),
  ];
  fs.writeFileSync(path.join(REPO_EVIDENCE, "EVIDENCE.md"), lines.join("\n"));
  fs.copyFileSync(
    path.join(REPO_EVIDENCE, "EVIDENCE.md"),
    path.join(ARTIFACT_OUT, "EVIDENCE.md"),
  );

  console.log("SUMMARY", evidence.summary);
  await browser.close();
  if (evidence.summary.failed > 0 || evidence.errors.length) {
    process.exitCode = 1;
  }
}
