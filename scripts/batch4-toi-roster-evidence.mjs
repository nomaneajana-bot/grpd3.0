/**
 * Batch 4 — ISSUE-011: club home-group (TOI) assignment → roster counts → identity switching
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/batch4-toi-roster-evidence.mjs
 *
 * Scope (demo only): same-user TOI vs exact counts; move groups (+/− / no duplicates);
 * reload; second identity; switch two clubs; empty/admin; home-group ≠ outing autojoin;
 * pace optional for walk/language. Nested Batch1+2 + Batch3 (SKIP_NESTED).
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const REPO_ROOT = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();
const REPO_EVIDENCE_REL = "docs/audit/batch4-toi-roster";
const REPO_EVIDENCE = path.join(REPO_ROOT, REPO_EVIDENCE_REL);
const REPO_SHOTS = path.join(REPO_EVIDENCE, "screenshots");
const ARTIFACT_OUT = "/opt/cursor/artifacts/batch4-toi-roster";
const ARTIFACT_SHOTS = path.join(ARTIFACT_OUT, "screenshots");
fs.mkdirSync(REPO_SHOTS, { recursive: true });
fs.mkdirSync(ARTIFACT_SHOTS, { recursive: true });
fs.mkdirSync(path.join(REPO_EVIDENCE, "regressions"), { recursive: true });

const testedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();

const TOKEN = `B4${Date.now().toString(36).slice(-7).toUpperCase()}`;
const HOST_PHONE = "0611111111";
const MEMBER_B_PHONE = "0622222222";
const CLUB_A = {
  name: `English Outside ${TOKEN}`,
  city: "Casablanca",
  purpose: `Pratiquer l'anglais en marchant — niveaux mixtes ${TOKEN}.`,
};
const CLUB_B = {
  name: `Casa Walkers ${TOKEN}`,
  city: "Rabat",
  purpose: `Marche du dimanche sans chrono ${TOKEN}.`,
};

function futureFixture() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(12, 0, 0, 0);
  const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { dateISO, hour: 10, minute: 30, timeLabel: "10:30" };
}
const FUTURE = futureFixture();

const evidence = {
  batch: "Batch 4 — ISSUE-011 TOI / roster home-group counts",
  issues: ["ISSUE-011"],
  tested_sha: testedSha,
  tip_sha: testedSha,
  branch,
  environment: "demo",
  hosted_claim: false,
  note:
    "DEMO_MODE only. Membership, home-group (TOI), and outing attendance remain distinct. Pace optional for walk/language. Hosted/native/UAT not claimed. SSO preview proves protection only.",
  unique: { token: TOKEN, clubA: CLUB_A, clubB: CLUB_B },
  future_fixture: FUTURE,
  clubs: {},
  outings: {},
  checks: {},
  screenshots: [],
  regressions: {},
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
          k.startsWith("joinedSessions:") ||
          k === "grpd_focused_club_id_v1"
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
  await new Promise((r) => setTimeout(r, 600));
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
  await page.keyboard.type(value, { delay: 10 });
}

async function setInputValue(page, testId, value) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 15000 });
  const ok = await page.evaluate(
    ({ id, val }) => {
      const el = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      ).find((n) => n.getBoundingClientRect().width > 0);
      if (!el) return false;
      el.focus();
      el.scrollIntoView({ block: "center" });
      const proto =
        el.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc?.set?.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return (el.value || "") === val;
    },
    { id: testId, val: value },
  );
  if (!ok) await typeTestId(page, testId, value);
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
  await new Promise((r) => setTimeout(r, 400));
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
  await page.keyboard.type(phone, { delay: 12 });
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
  await new Promise((r) => setTimeout(r, 700));
}

async function clickTabByLabel(page, label) {
  const clicked = await page.evaluate((lab) => {
    const nodes = Array.from(
      document.querySelectorAll("a,button,[role='tab'],div"),
    );
    const match = nodes.find((el) => {
      const t = (el.innerText || el.textContent || "").trim();
      if (!t.includes(lab)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > window.innerHeight * 0.7;
    });
    if (!match) return false;
    match.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Tab ${label} not found`);
}

async function findClubIdByName(page, name) {
  return page.evaluate((n) => {
    try {
      const clubs = JSON.parse(localStorage.getItem("mock:clubs") || "{}");
      const hits = Object.values(clubs || {}).filter((c) => c && c.name === n);
      return hits.length ? hits[0].id : null;
    } catch {
      return null;
    }
  }, name);
}

async function authUserId(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("grpd_auth_user_v1") || "null")?.id ?? null;
    } catch {
      return null;
    }
  });
}

async function readMemberGroups(page, clubId) {
  return page.evaluate((id) => {
    try {
      const raw =
        localStorage.getItem(`grpd_club_admin_v2_${id}`) ||
        localStorage.getItem(`grpd_club_admin_v1_${id}`);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed?.memberGroups || {};
    } catch {
      return {};
    }
  }, clubId);
}

async function readJoinedForUser(page) {
  return page.evaluate(() => {
    try {
      const auth = JSON.parse(
        localStorage.getItem("grpd_auth_user_v1") || "null",
      );
      if (!auth?.id) return [];
      const key = `joinedSessions:${auth.id}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });
}

async function readAttendanceForSession(page, sessionId) {
  return page.evaluate((sid) => {
    try {
      const map = JSON.parse(localStorage.getItem("mock:attendance") || "{}");
      const rows = map[sid] || map[`session:${sid}`] || [];
      return Array.isArray(rows) ? rows : Object.values(rows || {});
    } catch {
      return [];
    }
  }, sessionId);
}

function parseCountLabel(text) {
  if (!text) return null;
  const m = String(text).match(/(\d+)\s*membre/);
  return m ? Number(m[1]) : null;
}

async function readPaceUi(page) {
  return page.evaluate(() => {
    const groups = ["A", "B", "C", "D"].map((gid) => {
      const row = document.querySelector(`[data-testid="club-pace-group-${gid}"]`);
      const toi = document.querySelector(`[data-testid="club-pace-toi-${gid}"]`);
      const countEl = document.querySelector(
        `[data-testid="club-pace-count-${gid}"]`,
      );
      const countText = countEl?.textContent?.trim() || null;
      const countMatch = countText?.match(/(\d+)\s*membre/);
      return {
        gid,
        visible: Boolean(row && row.getBoundingClientRect().width > 0),
        hasToi: Boolean(toi && toi.getBoundingClientRect().width > 0),
        countText,
        count: countMatch ? Number(countMatch[1]) : null,
      };
    });
    return groups;
  });
}

async function gotoClubHome(page, clubId) {
  if (clubId) {
    await page.goto(BASE + "/club", { waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 800));
    try {
      await clickTestId(page, `club-switch-${clubId}`);
      await new Promise((r) => setTimeout(r, 900));
    } catch {
      /* single club */
    }
  } else {
    await page.goto(BASE + "/club", { waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 900));
  }
}

async function createClub(page, club) {
  await page.goto(BASE + "/club/create", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 600));
  await setInputValue(page, "club-name-input", club.name);
  await setInputValue(page, "club-city-input", club.city);
  await setInputValue(page, "club-purpose-input", club.purpose);
  try {
    await clickTestId(page, "club-visibility-members");
  } catch {
    /* default */
  }
  await clickTestId(page, "club-create-submit");
  await page.waitForFunction(
    () => /\/club(?!\/create)/.test(location.pathname) || /GROUPES DE PACE|Quitter le club/i.test(document.body.innerText || ""),
    { timeout: 30000 },
  );
  await new Promise((r) => setTimeout(r, 900));
  const id = await findClubIdByName(page, club.name);
  return id;
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
}

async function createWalkOuting(page, { title, spot, clubId }) {
  await page.goto(
    `${BASE}/session/create?clubId=${encodeURIComponent(clubId)}&audience=club`,
    { waitUntil: "networkidle0", timeout: 90000 },
  );
  await new Promise((r) => setTimeout(r, 800));
  await setOutingWhen(page, FUTURE);
  await clickTestId(page, "session-mode-walking");
  await new Promise((r) => setTimeout(r, 400));
  const paceUiForced = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hasPacePicker = /Groupes de pace|pace groups|Choisis ton groupe/i.test(
      text,
    );
    const required = Boolean(
      document.querySelector('[data-testid="session-pace-required"]'),
    );
    return { hasPacePicker, required };
  });
  await typeTestId(page, "session-title-input", title);
  await typeTestId(page, "session-purpose-input", `Objectif ${title}`);
  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 300));
  await typeTestId(page, "session-spot-custom-input", spot);
  await clickTestId(page, "session-spot-custom-add");
  try {
    await clickTestId(page, "session-audience-club");
  } catch {
    /* */
  }
  try {
    await clickTestId(page, `create-club-${clubId}`);
  } catch {
    /* */
  }
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 30000 },
  );
  const url = page.url();
  const m = new URL(url).pathname.match(/^\/session\/([^/]+)$/);
  const id = m?.[1] && m[1] !== "create" ? m[1] : null;
  return { id, url, paceUiForced };
}

async function assignMemberToGroup(page, clubId, fromGid, toGid, userId) {
  await page.goto(
    `${BASE}/club/group-detail?clubId=${encodeURIComponent(clubId)}&groupId=${fromGid}`,
    { waitUntil: "networkidle0", timeout: 90000 },
  );
  await new Promise((r) => setTimeout(r, 900));
  const changeId = `club-group-member-change-${userId}`;
  await page.waitForSelector(`[data-testid="${changeId}"]`, { timeout: 15000 });
  await clickTestId(page, changeId);
  await page.waitForSelector('[data-testid="club-group-assign-modal"]', {
    timeout: 10000,
  });
  await clickTestId(page, `club-group-assign-${toGid}`);
  await new Promise((r) => setTimeout(r, 1200));
}

/** @deprecated alias — prefer assignMemberToGroup */
async function assignSelfToGroup(page, clubId, fromGid, toGid, userId) {
  return assignMemberToGroup(page, clubId, fromGid, toGid, userId);
}

function pickDifferentGroup(fromGid, paceUi) {
  const ids = ["A", "B", "C", "D"];
  const empty = ids.find(
    (g) =>
      g !== fromGid &&
      (paceUi.find((p) => p.gid === g)?.count ?? 0) === 0,
  );
  if (empty) return empty;
  return ids.find((g) => g !== fromGid) || "D";
}

function sumPaceCounts(paceUi) {
  return paceUi
    .filter((g) => g.count != null)
    .reduce((s, g) => s + g.count, 0);
}

async function main() {
  const chromePath =
    process.env.CHROME_PATH ||
    [
      "/usr/local/bin/google-chrome",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ].find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error("Chrome not found");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  try {
    await clearAuth(page, { preserveMockWorld: false });
    await loginViaUi(page, HOST_PHONE, "000000");
    const hostId = await authUserId(page);
    record("host_login", Boolean(hostId), hostId || "");

    // --- Club A (language / walk purpose) ---
    const clubAId = await createClub(page, CLUB_A);
    evidence.clubs.A = { id: clubAId, name: CLUB_A.name };
    record("club_a_created", Boolean(clubAId), clubAId || "");
    await gotoClubHome(page, clubAId);
    const homeText = await bodyText(page);
    record(
      "club_a_home_screen",
      /GROUPES DE PACE|Quitter le club/i.test(homeText) &&
        homeText.includes(CLUB_A.name),
      homeText.slice(0, 220),
    );
    await shot(page, "01-club-a-home-initial.png");

    let pace = await readPaceUi(page);
    const toiRows = pace.filter((g) => g.hasToi);
    const visibleCounts = pace.filter((g) => g.visible && g.count != null);
    const sumCounts = visibleCounts.reduce((s, g) => s + (g.count || 0), 0);
    const rosterLen = await page.evaluate(() => {
      try {
        // approximate via UI sum + storage
        return null;
      } catch {
        return null;
      }
    });
    void rosterLen;
    record(
      "same_user_exactly_one_toi",
      toiRows.length === 1,
      JSON.stringify(toiRows),
    );
    const toiGid = toiRows[0]?.gid || null;
    record(
      "toi_group_count_gte_1",
      Boolean(toiGid && toiRows[0].count >= 1),
      JSON.stringify(toiRows[0] || null),
    );
    record(
      "exact_roster_sum_equals_member_total_solo",
      sumCounts === 1 && toiRows[0]?.count === 1,
      JSON.stringify({ sumCounts, pace }),
    );
    const emptyGroups = pace.filter((g) => g.visible && g.count === 0);
    record(
      "empty_groups_show_zero",
      emptyGroups.length >= 3,
      JSON.stringify(emptyGroups.map((g) => g.gid)),
    );

    // Open empty group as admin → empty state
    const emptyGid = emptyGroups[0]?.gid || (toiGid === "A" ? "B" : "A");
    await page.goto(
      `${BASE}/club/group-detail?clubId=${encodeURIComponent(clubAId)}&groupId=${emptyGid}`,
      { waitUntil: "networkidle0", timeout: 90000 },
    );
    await new Promise((r) => setTimeout(r, 800));
    const emptyVisible = await page.evaluate(
      () => !!document.querySelector('[data-testid="club-group-empty"]'),
    );
    record("admin_empty_group_state", emptyVisible, `group=${emptyGid}`);
    await shot(page, "02-admin-empty-group.png");

    // Create walk outing (pace optional) before home-group move
    const outing = await createWalkOuting(page, {
      title: `Balade ${TOKEN}`,
      spot: `Parc ${TOKEN}`,
      clubId: clubAId,
    });
    evidence.outings.A = outing;
    record(
      "walk_outing_created_pace_optional",
      Boolean(outing.id) && !outing.paceUiForced.required,
      JSON.stringify({ id: outing.id, paceUiForced: outing.paceUiForced }),
    );
    await shot(page, "03-walk-outing-detail.png");

    // Snapshot attendance / joined before home-group assign
    const joinedBefore = await readJoinedForUser(page);
    const attendanceBefore = outing.id
      ? await readAttendanceForSession(page, outing.id)
      : [];
    const hostJoinedBefore = joinedBefore.some(
      (j) => j.sessionId === outing.id || j.id === outing.id,
    );

    // Move host home-group: from toiGid → target
    const targetGid =
      ["A", "B", "C", "D"].find((g) => g !== toiGid) || "C";
    await assignSelfToGroup(page, clubAId, toiGid, targetGid, hostId);
    const groupsAfterAssign = await readMemberGroups(page, clubAId);
    record(
      "admin_assign_persisted_storage",
      groupsAfterAssign[hostId] === targetGid,
      JSON.stringify(groupsAfterAssign),
    );
    await shot(page, "04-after-assign-modal.png");

    // Home-group assign must NOT autojoin outing (membership/home ≠ attendance)
    const joinedAfterAssign = await readJoinedForUser(page);
    const attendanceAfterAssign = outing.id
      ? await readAttendanceForSession(page, outing.id)
      : [];
    const hostJoinedAfter = joinedAfterAssign.some(
      (j) => j.sessionId === outing.id || j.id === outing.id,
    );
    // If creator was already auto-joined (unresolved rule), assignment must not
    // change attendance membership set for others / invent a new join.
    const joinedIdsBefore = new Set(
      joinedBefore.map((j) => j.sessionId || j.id).filter(Boolean),
    );
    const joinedIdsAfter = new Set(
      joinedAfterAssign.map((j) => j.sessionId || j.id).filter(Boolean),
    );
    const onlyNewJoins = [...joinedIdsAfter].filter((id) => !joinedIdsBefore.has(id));
    record(
      "home_group_assign_does_not_autojoin_outing",
      onlyNewJoins.length === 0 &&
        hostJoinedAfter === hostJoinedBefore,
      JSON.stringify({
        hostJoinedBefore,
        hostJoinedAfter,
        onlyNewJoins,
        attendanceBeforeCount: attendanceBefore.length,
        attendanceAfterCount: attendanceAfterAssign.length,
      }),
    );

    // Return to club home — TOI + counts after move
    await gotoClubHome(page, clubAId);
    pace = await readPaceUi(page);
    const toiAfter = pace.filter((g) => g.hasToi);
    const fromAfter = pace.find((g) => g.gid === toiGid);
    const toAfter = pace.find((g) => g.gid === targetGid);
    const sumAfter = pace
      .filter((g) => g.count != null)
      .reduce((s, g) => s + g.count, 0);
    record(
      "move_toi_follows_target",
      toiAfter.length === 1 && toiAfter[0].gid === targetGid,
      JSON.stringify(toiAfter),
    );
    record(
      "move_decrement_source_increment_target",
      fromAfter?.count === 0 && toAfter?.count === 1,
      JSON.stringify({ fromAfter, toAfter }),
    );
    record(
      "move_no_duplicate_count",
      sumAfter === 1,
      JSON.stringify({ sumAfter, pace }),
    );
    await shot(page, "05-club-a-after-move.png");

    // Reload persistence
    await page.reload({ waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await clickTestId(page, `club-switch-${clubAId}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch {
      /* */
    }
    pace = await readPaceUi(page);
    const toiReload = pace.filter((g) => g.hasToi);
    record(
      "reload_toi_and_counts_persist",
      toiReload.length === 1 &&
        toiReload[0].gid === targetGid &&
        toiReload[0].count === 1 &&
        pace.find((g) => g.gid === toiGid)?.count === 0,
      JSON.stringify(pace),
    );
    await shot(page, "06-club-a-after-reload.png");

    // --- Club B + switcher isolation ---
    const clubBId = await createClub(page, CLUB_B);
    evidence.clubs.B = { id: clubBId, name: CLUB_B.name };
    record("club_b_created", Boolean(clubBId), clubBId || "");
    await gotoClubHome(page, clubBId);
    let paceB = await readPaceUi(page);
    const toiB = paceB.filter((g) => g.hasToi);
    record(
      "club_b_exactly_one_toi",
      toiB.length === 1 && toiB[0].count >= 1,
      JSON.stringify(toiB),
    );
    await shot(page, "07-club-b-home.png");

    // Switch A ↔ B: Club A must keep prior assignment; B independent
    await gotoClubHome(page, clubAId);
    pace = await readPaceUi(page);
    const toiASwitch = pace.filter((g) => g.hasToi);
    record(
      "switch_back_club_a_keeps_assignment",
      toiASwitch.length === 1 && toiASwitch[0].gid === targetGid,
      JSON.stringify(toiASwitch),
    );
    await shot(page, "08-switch-club-a.png");

    await gotoClubHome(page, clubBId);
    paceB = await readPaceUi(page);
    const toiBSwitch = paceB.filter((g) => g.hasToi);
    const groupsA = await readMemberGroups(page, clubAId);
    const groupsB = await readMemberGroups(page, clubBId);
    record(
      "switch_club_b_independent",
      toiBSwitch.length === 1 &&
        groupsA[hostId] === targetGid &&
        (groupsB[hostId] == null || groupsB[hostId] !== groupsA[hostId] || toiBSwitch[0].gid === groupsB[hostId]),
      JSON.stringify({
        toiBSwitch,
        groupsA: groupsA[hostId],
        groupsB: groupsB[hostId],
      }),
    );
    await shot(page, "09-switch-club-b.png");

    // Invite second identity into Club A
    await gotoClubHome(page, clubAId);
    await page.goto(BASE + "/club/access", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await clickTestId(page, `invite-club-${clubAId}`);
      await new Promise((r) => setTimeout(r, 400));
    } catch {
      /* single */
    }
    await clickTestId(page, "club-generate-invite");
    await page.waitForSelector('[data-testid="club-invite-code"]', {
      timeout: 10000,
    });
    const inviteCode = await page.evaluate(
      () =>
        document
          .querySelector('[data-testid="club-invite-code"]')
          ?.textContent?.trim() || null,
    );
    record("invite_code_for_member_b", Boolean(inviteCode), inviteCode || "");
    await shot(page, "10-invite-code.png");

    await clearAuth(page, { preserveMockWorld: true });
    await loginViaUi(page, MEMBER_B_PHONE, "000000");
    const memberBId = await authUserId(page);
    record("member_b_login", Boolean(memberBId), memberBId || "");
    await page.goto(BASE + "/club/access", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 900));
    await typeTestId(page, "club-invite-code-input", inviteCode);
    await clickTestId(page, "club-join-by-code");
    await new Promise((r) => setTimeout(r, 2000));
    await gotoClubHome(page, clubAId);
    let paceMember = await readPaceUi(page);
    const toiMember = paceMember.filter((g) => g.hasToi);
    const sumMember = paceMember
      .filter((g) => g.count != null)
      .reduce((s, g) => s + g.count, 0);
    record(
      "second_identity_exactly_one_toi",
      toiMember.length === 1 && toiMember[0].count >= 1,
      JSON.stringify(toiMember),
    );
    record(
      "second_identity_roster_sum_is_two",
      sumMember === 2,
      JSON.stringify({ sumMember, paceMember }),
    );
    // Host still counted in their assigned group; member B in theirs — no double TOI
    const hostGroupCount = paceMember.find((g) => g.gid === targetGid)?.count;
    record(
      "second_identity_host_group_still_counted",
      hostGroupCount >= 1,
      JSON.stringify({ targetGid, hostGroupCount, paceMember }),
    );
    await shot(page, "11-member-b-club-a.png");

    // Member B must not see admin assign controls on empty/other unless admin
    const memberToi = toiMember[0]?.gid;
    if (memberToi) {
      await page.goto(
        `${BASE}/club/group-detail?clubId=${encodeURIComponent(clubAId)}&groupId=${memberToi}`,
        { waitUntil: "networkidle0", timeout: 90000 },
      );
      await new Promise((r) => setTimeout(r, 800));
      const changeAsMember = await page.evaluate((uid) => {
        return !!document.querySelector(
          `[data-testid="club-group-member-change-${uid}"]`,
        );
      }, memberBId);
      record(
        "non_admin_cannot_assign_self",
        changeAsMember === false,
        `changeVisible=${changeAsMember}`,
      );
      await shot(page, "12-member-b-group-detail-no-assign.png");
    } else {
      record("non_admin_cannot_assign_self", false, "no TOI for member B");
    }

    // Host re-login: counts still 2, TOI still host target, assign member B
    await clearAuth(page, { preserveMockWorld: true });
    await loginViaUi(page, HOST_PHONE, "000000");
    await gotoClubHome(page, clubAId);
    pace = await readPaceUi(page);
    const toiHostFinal = pace.filter((g) => g.hasToi);
    const sumFinal = pace
      .filter((g) => g.count != null)
      .reduce((s, g) => s + g.count, 0);
    record(
      "host_relogin_toi_and_sum",
      toiHostFinal.length === 1 &&
        toiHostFinal[0].gid === targetGid &&
        sumFinal === 2,
      JSON.stringify({ toiHostFinal, sumFinal, pace }),
    );
    await shot(page, "13-host-relogin-two-members.png");

    // Admin MUST actually move B to a DIFFERENT group (never PASS on same-group skip).
    // Same-group idempotency is a separate check below.
    if (!memberBId || !memberToi) {
      record("admin_move_member_b_counts", false, "missing member B id/toi");
      record("admin_move_member_b_no_outing_autojoin", false, "skipped");
      record("admin_move_host_toi_unchanged", false, "skipped");
      record("member_b_toi_after_admin_move", false, "skipped");
      record("admin_assign_same_group_idempotent", false, "skipped");
    } else {
      const groupsBeforeBMove = await readMemberGroups(page, clubAId);
      const bSourceGid =
        groupsBeforeBMove[memberBId] === "A" ||
        groupsBeforeBMove[memberBId] === "B" ||
        groupsBeforeBMove[memberBId] === "C" ||
        groupsBeforeBMove[memberBId] === "D"
          ? groupsBeforeBMove[memberBId]
          : memberToi;
      const bDestGid = pickDifferentGroup(bSourceGid, pace);
      const sourceBefore = pace.find((g) => g.gid === bSourceGid)?.count ?? null;
      const destBefore = pace.find((g) => g.gid === bDestGid)?.count ?? null;
      const sumBeforeMove = sumPaceCounts(pace);
      const hostJoinedBeforeBMove = (await readJoinedForUser(page)).some(
        (j) => j.sessionId === outing.id || j.id === outing.id,
      );
      const attendanceBeforeBMove = outing.id
        ? await readAttendanceForSession(page, outing.id)
        : [];

      record(
        "admin_move_member_b_setup_different_group",
        Boolean(bSourceGid && bDestGid && bSourceGid !== bDestGid),
        JSON.stringify({
          bSourceGid,
          bDestGid,
          sourceBefore,
          destBefore,
          sumBeforeMove,
          sameAsHostTarget: bSourceGid === targetGid,
        }),
      );

      await assignMemberToGroup(
        page,
        clubAId,
        bSourceGid,
        bDestGid,
        memberBId,
      );
      const groupsAfterBMove = await readMemberGroups(page, clubAId);
      record(
        "admin_move_member_b_persisted",
        groupsAfterBMove[memberBId] === bDestGid,
        JSON.stringify(groupsAfterBMove),
      );

      await gotoClubHome(page, clubAId);
      pace = await readPaceUi(page);
      const sourceAfter = pace.find((g) => g.gid === bSourceGid)?.count ?? null;
      const destAfter = pace.find((g) => g.gid === bDestGid)?.count ?? null;
      const sumAfterMove = sumPaceCounts(pace);
      const toiHostAfterBMove = pace.filter((g) => g.hasToi);
      record(
        "admin_move_member_b_counts",
        sourceBefore != null &&
          destBefore != null &&
          sourceAfter === sourceBefore - 1 &&
          destAfter === destBefore + 1 &&
          sumAfterMove === 2 &&
          sumAfterMove === sumBeforeMove,
        JSON.stringify({
          bSourceGid,
          bDestGid,
          sourceBefore,
          sourceAfter,
          destBefore,
          destAfter,
          sumBeforeMove,
          sumAfterMove,
          pace,
        }),
      );
      await shot(page, "14-after-admin-move-member-b.png");

      record(
        "admin_move_host_toi_unchanged",
        toiHostAfterBMove.length === 1 &&
          toiHostAfterBMove[0].gid === targetGid,
        JSON.stringify({ toiHostAfterBMove, hostTarget: targetGid }),
      );

      const joinedAfterBMove = await readJoinedForUser(page);
      const hostJoinedAfterBMove = joinedAfterBMove.some(
        (j) => j.sessionId === outing.id || j.id === outing.id,
      );
      const attendanceAfterBMove = outing.id
        ? await readAttendanceForSession(page, outing.id)
        : [];
      record(
        "admin_move_member_b_no_outing_autojoin",
        hostJoinedAfterBMove === hostJoinedBeforeBMove &&
          attendanceAfterBMove.length === attendanceBeforeBMove.length,
        JSON.stringify({
          hostJoinedBeforeBMove,
          hostJoinedAfterBMove,
          attendanceBeforeCount: attendanceBeforeBMove.length,
          attendanceAfterCount: attendanceAfterBMove.length,
        }),
      );

      // Same-group idempotency (separate): re-assign B to current group → no count change
      const paceBeforeIdem = pace;
      const srcIdem = bDestGid;
      await assignMemberToGroup(
        page,
        clubAId,
        srcIdem,
        srcIdem,
        memberBId,
      );
      await gotoClubHome(page, clubAId);
      pace = await readPaceUi(page);
      const idemOk =
        sumPaceCounts(pace) === sumPaceCounts(paceBeforeIdem) &&
        pace.find((g) => g.gid === bSourceGid)?.count ===
          paceBeforeIdem.find((g) => g.gid === bSourceGid)?.count &&
        pace.find((g) => g.gid === bDestGid)?.count ===
          paceBeforeIdem.find((g) => g.gid === bDestGid)?.count &&
        (await readMemberGroups(page, clubAId))[memberBId] === bDestGid;
      record(
        "admin_assign_same_group_idempotent",
        idemOk,
        JSON.stringify({
          before: paceBeforeIdem,
          after: pace,
          memberGroup: (await readMemberGroups(page, clubAId))[memberBId],
        }),
      );
      await shot(page, "14b-same-group-idempotent.png");

      // Login as B — TOI must be exactly the admin destination
      await clearAuth(page, { preserveMockWorld: true });
      await loginViaUi(page, MEMBER_B_PHONE, "000000");
      await gotoClubHome(page, clubAId);
      paceMember = await readPaceUi(page);
      const toiBAfterMove = paceMember.filter((g) => g.hasToi);
      const bJoinedAfter = await readJoinedForUser(page);
      const bAutoJoined = bJoinedAfter.some(
        (j) => j.sessionId === outing.id || j.id === outing.id,
      );
      record(
        "member_b_toi_after_admin_move",
        toiBAfterMove.length === 1 &&
          toiBAfterMove[0].gid === bDestGid &&
          toiBAfterMove[0].count >= 1,
        JSON.stringify({ toiBAfterMove, bDestGid, paceMember }),
      );
      record(
        "member_b_no_outing_autojoin_from_home_group",
        bAutoJoined === false,
        JSON.stringify({ bAutoJoined, joined: bJoinedAfter }),
      );
      await shot(page, "14c-member-b-toi-after-move.png");

      // Host again — club A still sum=2; club B unchanged
      await clearAuth(page, { preserveMockWorld: true });
      await loginViaUi(page, HOST_PHONE, "000000");
      await gotoClubHome(page, clubAId);
      pace = await readPaceUi(page);
      record(
        "host_after_b_move_club_a_sum",
        sumPaceCounts(pace) === 2 &&
          pace.filter((g) => g.hasToi).length === 1 &&
          pace.filter((g) => g.hasToi)[0].gid === targetGid,
        JSON.stringify(pace),
      );
    }

    // Club B still solo for host after Club A had 2 members + B move
    await gotoClubHome(page, clubBId);
    paceB = await readPaceUi(page);
    const sumB = sumPaceCounts(paceB);
    const toiBClub = paceB.filter((g) => g.hasToi);
    record(
      "club_b_unaffected_by_club_a_roster",
      sumB === 1 && toiBClub.length === 1,
      JSON.stringify({ sumB, paceB }),
    );
    await shot(page, "15-club-b-still-solo.png");

    record(
      "parse_count_helper_smoke",
      parseCountLabel("1 membre") === 1 && parseCountLabel("2 membres") === 2,
      "ok",
    );

    // Nested regressions
    const skipNested = process.env.SKIP_NESTED_REGRESSION === "1";
    const regDir = path.join(REPO_EVIDENCE, "regressions");
    fs.mkdirSync(regDir, { recursive: true });
    if (skipNested) {
      recordBlocked(
        "regression_batch1_privacy",
        "SKIPPED via SKIP_NESTED_REGRESSION=1",
      );
      recordBlocked(
        "regression_batch2_walk_join",
        "SKIPPED via SKIP_NESTED_REGRESSION=1",
      );
      recordBlocked(
        "regression_batch3_club_idea",
        "SKIPPED via SKIP_NESTED_REGRESSION=1",
      );
    } else {
      const runNested = (script, label, copyName) => {
        const result = spawnSync("node", [script], {
          cwd: REPO_ROOT,
          env: {
            ...process.env,
            EXPO_PUBLIC_DEMO_MODE: "true",
            E2E_BASE_URL: BASE,
            // Avoid re-nesting Batch1/2 inside Batch3
            SKIP_NESTED_REGRESSION:
              label === "batch3_club_idea" ? "1" : process.env.SKIP_NESTED_REGRESSION || "",
          },
          encoding: "utf8",
          timeout: 900000,
        });
        const srcMap = {
          batch1_privacy: "docs/audit/batch1-privacy/evidence.json",
          batch2_walk_join: "docs/audit/batch2-walk-join/evidence.json",
          batch3_club_idea: "docs/audit/batch3-club-idea/evidence.json",
        };
        const src = path.join(REPO_ROOT, srcMap[label]);
        let summary = null;
        if (fs.existsSync(src)) {
          try {
            const raw = fs.readFileSync(src, "utf8");
            fs.writeFileSync(path.join(regDir, copyName), raw);
            summary = JSON.parse(raw).summary;
          } catch {
            /* */
          }
        }
        evidence.regressions[label] = {
          exit_code: result.status,
          summary,
          stderr_tail: (result.stderr || "").slice(-400),
        };
        // Batch3 may have 1 BLOCKED (keyboard) — accept failed===0
        const ok =
          result.status === 0 &&
          summary &&
          summary.failed === 0;
        record(`regression_${label}`, ok, JSON.stringify(summary));
        return result;
      };
      runNested(
        "scripts/batch1-privacy-evidence.mjs",
        "batch1_privacy",
        "batch1-privacy-evidence.json",
      );
      runNested(
        "scripts/batch2-walk-join-evidence.mjs",
        "batch2_walk_join",
        "batch2-walk-join-evidence.json",
      );
      runNested(
        "scripts/batch3-club-idea-evidence.mjs",
        "batch3_club_idea",
        "batch3-club-idea-evidence.json",
      );
    }
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
      failed: checks.filter((c) => !c.ok && c.status !== "BLOCKED").length,
      blocked: checks.filter((c) => c.status === "BLOCKED").length,
      total: checks.length,
    };
    evidence.generated_at = new Date().toISOString();
    evidence.screenshots = [...new Set(evidence.screenshots)].filter((s) =>
      s.includes("/screenshots/"),
    );
    fs.writeFileSync(
      path.join(REPO_EVIDENCE, "evidence.json"),
      JSON.stringify(evidence, null, 2) + "\n",
    );
    fs.writeFileSync(
      path.join(ARTIFACT_OUT, "evidence.json"),
      JSON.stringify(evidence, null, 2) + "\n",
    );
    const md = [
      `# Batch 4 evidence — ISSUE-011 TOI / roster`,
      ``,
      `- **tested_sha:** \`${evidence.tested_sha}\``,
      `- **branch:** \`${evidence.branch}\``,
      `- **environment:** \`${evidence.environment}\` · hosted_claim: ${evidence.hosted_claim}`,
      `- **summary:** ${JSON.stringify(evidence.summary)}`,
      `- **generated_at:** ${evidence.generated_at}`,
      ``,
      `## Checks`,
      ...Object.entries(evidence.checks).map(
        ([k, v]) =>
          `- ${v.ok ? "PASS" : v.status === "BLOCKED" ? "BLOCKED" : "FAIL"} \`${k}\` — ${v.detail}`,
      ),
      ``,
      `## Current screenshots`,
      ...evidence.screenshots.map((s) => `- \`${s}\``),
      ``,
    ].join("\n");
    fs.writeFileSync(path.join(REPO_EVIDENCE, "EVIDENCE.md"), md);
    fs.writeFileSync(
      path.join(REPO_EVIDENCE, "CURRENT_RUN.md"),
      [
        `# Batch 4 current evidence run`,
        ``,
        `- **tested_sha:** \`${evidence.tested_sha}\``,
        `- **environment:** demo · **hosted_claim:** false`,
        `- **summary:** ${JSON.stringify(evidence.summary)}`,
        `- **Authoritative manifest:** \`evidence.json\` → \`screenshots\` list`,
        ``,
      ].join("\n"),
    );
    fs.copyFileSync(
      path.join(REPO_EVIDENCE, "EVIDENCE.md"),
      path.join(ARTIFACT_OUT, "EVIDENCE.md"),
    );
    await browser.close();
    console.log("SUMMARY", evidence.summary);
    if (evidence.summary.failed > 0 || evidence.errors.length) {
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
