/**
 * Batch 3 — HOME IDEA → CREATE ANY-PURPOSE CLUB → CLUB HOME → ORGANISE OUTING
 * M01 / M02 / M03 + ISSUE-002
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/batch3-club-idea-evidence.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const REPO_ROOT = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();
const REPO_EVIDENCE_REL = "docs/audit/batch3-club-idea";
const REPO_EVIDENCE = path.join(REPO_ROOT, REPO_EVIDENCE_REL);
const REPO_SHOTS = path.join(REPO_EVIDENCE, "screenshots");
const ARTIFACT_OUT = "/opt/cursor/artifacts/batch3-club-idea";
const ARTIFACT_SHOTS = path.join(ARTIFACT_OUT, "screenshots");
fs.mkdirSync(REPO_SHOTS, { recursive: true });
fs.mkdirSync(ARTIFACT_SHOTS, { recursive: true });
fs.mkdirSync(path.join(REPO_EVIDENCE, "archive"), { recursive: true });

const testedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();

const TOKEN = `B3${Date.now().toString(36).slice(-7).toUpperCase()}`;
const HOST_PHONE = "0611111111";
const CLUB_A = {
  name: `English Outside ${TOKEN}`,
  city: "Casablanca",
  purpose: `Pratiquer l’anglais en marchant — niveaux mixtes ${TOKEN}.`,
  ideaId: "english",
};
const CLUB_B = {
  name: `Petits Matins ${TOKEN}`,
  city: "Rabat",
  purpose: `Marche après Fajr, calme du quartier ${TOKEN}.`,
  ideaId: "fajr",
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
  batch: "Batch 3 — HOME IDEA → CREATE CLUB → CLUB HOME → ORGANISE OUTING",
  issues: ["ISSUE-002", "M01", "M02", "M03"],
  tested_sha: testedSha,
  tip_sha: testedSha,
  branch,
  environment: "demo",
  hosted_claim: false,
  note:
    "DEMO_MODE only. Creator auto-attendance and public-club association remain unresolved — preserved, not decided. Design annotations (MAQUETTE) must never appear as product copy.",
  unresolved_rules_reported: [
    "creator_auto_attendance — preserved current auto-join of host on create; not decided",
    "public_club_association — preserved current null clubId for public; not decided",
  ],
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

async function readClubsFromStorage(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("mock:clubs") || "{}");
    } catch {
      return {};
    }
  });
}

async function readSessionsFromStorage(page) {
  return page.evaluate(() => {
    try {
      const map = JSON.parse(localStorage.getItem("mock:sessions") || "{}");
      return Object.values(map || {});
    } catch {
      return [];
    }
  });
}

async function findClubIdByName(page, name) {
  const clubs = await readClubsFromStorage(page);
  const hit = Object.values(clubs).find((c) => c?.name === name);
  return hit?.id ?? null;
}

async function fillClubForm(page, club) {
  await typeTestId(page, "club-name-input", club.name);
  await typeTestId(page, "club-city-input", club.city);
  await typeTestId(page, "club-purpose-input", club.purpose);
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

async function createOutingForBoundClub(page, { title, spot, clubId, checkKey }) {
  await page.goto(
    `${BASE}/session/create?clubId=${encodeURIComponent(clubId)}&audience=club`,
    { waitUntil: "networkidle0", timeout: 90000 },
  );
  await new Promise((r) => setTimeout(r, 800));
  await setOutingWhen(page, FUTURE);
  const bound = await page.evaluate(
    () => !!document.querySelector('[data-testid="create-club-bound"]'),
  );
  record(
    checkKey || "organise_bound",
    bound,
    bound ? "create-club-bound visible" : "missing bound label",
  );
  await clickTestId(page, "session-mode-walking");
  await new Promise((r) => setTimeout(r, 400));
  await typeTestId(page, "session-title-input", title);
  await typeTestId(page, "session-purpose-input", `Objectif ${title}`);
  await clickTestId(page, "session-spot-field");
  await new Promise((r) => setTimeout(r, 300));
  await typeTestId(page, "session-spot-custom-input", spot);
  await clickTestId(page, "session-spot-custom-add");
  try {
    await clickTestId(page, "session-audience-club");
  } catch {
    /* already */
  }
  try {
    await clickTestId(page, `create-club-${clubId}`);
  } catch {
    /* bound / single */
  }
  await clickTestId(page, "session-publish-btn");
  await page.waitForFunction(
    () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
    { timeout: 30000 },
  );
  const url = page.url();
  const m = new URL(url).pathname.match(/^\/session\/([^/]+)$/);
  const id = m?.[1] && m[1] !== "create" ? m[1] : null;
  return { id, url };
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
      "--disable-gpu",
      "--window-size=390,844",
      "--disable-dev-shm-usage",
    ],
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

    // ——— M01 / ISSUE-002: idea cards ———
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 800));
    const homeText = await bodyText(page);
    const illustrativeCopy =
      /concept[s]? illustratif|idée illustrative|pas des sorties réelles|non réservable|sans date ni réservation/i.test(
        homeText,
      ) ||
      (await page.evaluate(
        () =>
          !!document.querySelector('[data-testid="discover-idea-disclaimer"]') ||
          !!document.querySelector('[data-testid^="discover-idea-badge-"]'),
      ));
    record(
      "idea_cards_illustrative_label",
      illustrativeCopy,
      illustrativeCopy ? "illustrative disclaimer/badge present" : homeText.slice(0, 200),
    );
    const noMaquetteOnHome = !/MAQUETTE ·|données fictives · M0/i.test(homeText);
    record("no_design_annotation_on_home", noMaquetteOnHome);

    await shot(page, "01-home-ideas.png");

    const ideaVisible = await page.evaluate(
      () => !!document.querySelector('[data-testid="discover-idea-english"]'),
    );
    record("idea_card_english_visible", ideaVisible);
    await clickTestId(page, "discover-idea-english");
    await page.waitForFunction(
      () => /\/idea\/english/.test(location.pathname),
      { timeout: 15000 },
    );
    const ideaPath = new URL(page.url()).pathname;
    const notTraining = !/training|workouts|profile\/training/i.test(ideaPath);
    record(
      "idea_opens_explanation_not_training",
      /\/idea\//.test(ideaPath) && notTraining,
      ideaPath,
    );
    const ideaText = await bodyText(page);
    record(
      "idea_screen_not_bookable_copy",
      /concept illustratif|aucune sortie|pas une sortie réelle|ni une inscription|ni une réservation/i.test(
        ideaText,
      ),
      ideaText.slice(0, 180),
    );
    record(
      "idea_no_design_annotation",
      !/MAQUETTE ·|données fictives · M01/i.test(ideaText),
    );
    await shot(page, "02-idea-english.png");

    // Cancel / back from idea
    await clickTestId(page, "idea-back-discover");
    await page.waitForFunction(() => location.pathname === "/" || location.pathname === "", {
      timeout: 15000,
    });
    record("idea_back_discover", true, page.url());

    // Re-enter idea → create
    await clickTestId(page, "discover-idea-english");
    await page.waitForSelector('[data-testid="idea-create-club-cta"]', {
      timeout: 15000,
    });
    await clickTestId(page, "idea-create-club-cta");
    await page.waitForFunction(() => /\/club\/create/.test(location.pathname), {
      timeout: 15000,
    });
    record("idea_to_club_create", /create/.test(page.url()), page.url());
    await shot(page, "03-club-create-from-idea.png");

    // Validation: empty name
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="club-name-input"]');
      if (!el) return;
      el.focus();
      const desc = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      );
      desc?.set?.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await clickTestId(page, "club-create-submit");
    await new Promise((r) => setTimeout(r, 500));
    const stillOnCreate = /\/club\/create/.test(page.url());
    const toastOrError = /Ajoute un nom|nom de club/i.test(await bodyText(page));
    record(
      "club_create_validation_empty_name",
      stillOnCreate && toastOrError,
      `url=${page.url()} toast=${toastOrError}`,
    );

    // Cancel
    await clickTestId(page, "club-create-cancel");
    await new Promise((r) => setTimeout(r, 600));
    record(
      "club_create_cancel_back",
      !/\/club\/create/.test(page.url()),
      page.url(),
    );

    // ——— M02: create club A from idea ———
    await page.goto(`${BASE}/club/create?idea=english`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await fillClubForm(page, CLUB_A);
    try {
      await clickTestId(page, "club-visibility-members");
    } catch {
      /* default */
    }
    const purposeHint = await bodyText(page);
    record(
      "club_purpose_unrestricted_copy",
      /sujet est libre|À toi de choisir|Aucun thème imposé|sans champ obligatoire/i.test(
        purposeHint,
      ),
    );
    record(
      "club_no_mandatory_english_running_fields",
      !/Anglais obligatoire|allure obligatoire|niveau de course obligatoire/i.test(
        purposeHint,
      ),
    );

    // Double submit: rapid double click
    await page.waitForSelector('[data-testid="club-create-submit"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="club-create-submit"]');
      btn?.click();
      btn?.click();
    });
    await page.waitForFunction(
      () => /\/club\/?$/.test(location.pathname) || /Clubs/i.test(document.body.innerText || ""),
      { timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 900));
    const clubAId = await findClubIdByName(page, CLUB_A.name);
    record("club_a_created", !!clubAId, clubAId || "missing");
    evidence.clubs.a = { id: clubAId, ...CLUB_A };

    // Empty club state + identity
    const clubHomeText = await bodyText(page);
    const showsA =
      clubHomeText.includes(CLUB_A.name) &&
      clubHomeText.includes(CLUB_A.purpose.slice(0, 24));
    record("club_a_home_identity_purpose", showsA, clubHomeText.slice(0, 220));
    const emptyOutings = await page.evaluate(
      () => !!document.querySelector('[data-testid="club-outings-empty"]'),
    );
    record("club_a_empty_outings_state", emptyOutings);
    const memberLabel = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="club-overview-status"]');
      return el?.textContent || "";
    });
    record(
      "club_a_membership_label_member",
      /TU ES MEMBRE/i.test(memberLabel),
      memberLabel,
    );
    record(
      "club_home_no_design_annotation",
      !/MAQUETTE ·|données fictives · M03/i.test(clubHomeText),
    );
    await shot(page, "04-club-a-empty-home.png");

    // Reload persistence
    await page.reload({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 900));
    const afterReload = await bodyText(page);
    record(
      "club_a_reload_persists",
      afterReload.includes(CLUB_A.name) &&
        afterReload.includes(CLUB_A.purpose.slice(0, 20)),
    );
    await shot(page, "05-club-a-after-reload.png");

    // ——— Organise outing for club A ———
    const outingATitle = `Marche English ${TOKEN}`;
    const outingASpot = `Corniche ${TOKEN}`;
    const createdA = await createOutingForBoundClub(page, {
      title: outingATitle,
      spot: outingASpot,
      clubId: clubAId,
      checkKey: "organise_bound_a",
    });
    evidence.outings.a = createdA;
    record("outing_a_created", !!createdA.id, createdA.url);
    await shot(page, "06-outing-a-detail.png");

    // Assert storage clubId association
    const sessionsAfterA = await readSessionsFromStorage(page);
    const storedA =
      sessionsAfterA.find((s) => s.id === createdA.id) ||
      sessionsAfterA.find((s) => s.title === outingATitle);
    const assocA =
      storedA &&
      storedA.visibility === "members" &&
      storedA.clubId === clubAId;
    record(
      "outing_a_club_association",
      !!assocA,
      storedA
        ? `clubId=${storedA.clubId} vis=${storedA.visibility}`
        : "session missing in storage",
    );

    // Club A home shows its outing
    await page.goto(BASE + "/club", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 900));
    // focus club A if switcher
    try {
      await clickTestId(page, `club-switch-${clubAId}`);
      await new Promise((r) => setTimeout(r, 600));
    } catch {
      /* single */
    }
    const homeA = await bodyText(page);
    record(
      "club_a_lists_own_outing",
      homeA.includes(outingATitle),
      homeA.includes(outingATitle) ? outingATitle : homeA.slice(0, 200),
    );
    await shot(page, "07-club-a-with-outing.png");

    // ——— Standalone public must NOT attach stale club ———
    await page.goto(BASE + "/session/create", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 800));
    await setOutingWhen(page, FUTURE);
    const publicNote = await page.evaluate(
      () => !!document.querySelector('[data-testid="create-public-no-club"]'),
    );
    const noBound = await page.evaluate(
      () => !document.querySelector('[data-testid="create-club-bound"]'),
    );
    record(
      "standalone_create_no_stale_club_bind",
      publicNote && noBound,
      `publicNote=${publicNote} noBound=${noBound}`,
    );
    try {
      await clickTestId(page, "session-audience-public");
    } catch {
      /* default */
    }
    const standaloneTitle = `Public autonome ${TOKEN}`;
    await clickTestId(page, "session-mode-walking");
    await new Promise((r) => setTimeout(r, 400));
    await typeTestId(page, "session-title-input", standaloneTitle);
    await typeTestId(page, "session-purpose-input", `But ${standaloneTitle}`);
    await clickTestId(page, "session-spot-field");
    await new Promise((r) => setTimeout(r, 300));
    await typeTestId(page, "session-spot-custom-input", `Parc ${TOKEN}`);
    await clickTestId(page, "session-spot-custom-add");
    await clickTestId(page, "session-publish-btn");
    await page.waitForFunction(
      () => /\/session\/(?!create)[^/]+$/.test(location.pathname),
      { timeout: 30000 },
    );
    const standaloneId = new URL(page.url()).pathname.split("/").pop();
    const sessionsStand = await readSessionsFromStorage(page);
    const stand =
      sessionsStand.find((s) => s.id === standaloneId) ||
      sessionsStand.find((s) => s.title === standaloneTitle);
    const standOk =
      stand &&
      (stand.visibility === "public" || !stand.visibility || stand.visibility === "public") &&
      (stand.clubId == null || stand.clubId === "");
    record(
      "standalone_public_clubId_null",
      !!standOk,
      stand
        ? `clubId=${stand.clubId} vis=${stand.visibility}`
        : "missing session",
    );
    evidence.outings.standalone = { id: standaloneId, title: standaloneTitle };
    await shot(page, "08-standalone-public.png");

    // ——— Create club B (different theme) without overwrite ———
    await page.goto(`${BASE}/club/create?idea=fajr`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await fillClubForm(page, CLUB_B);
    try {
      await clickTestId(page, "club-visibility-members");
    } catch {
      /* */
    }
    await clickTestId(page, "club-create-submit");
    await page.waitForFunction(
      () => /\/club\/?$/.test(location.pathname),
      { timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 900));
    const clubBId = await findClubIdByName(page, CLUB_B.name);
    const clubAStill = await findClubIdByName(page, CLUB_A.name);
    record("club_b_created", !!clubBId, clubBId || "missing");
    record(
      "club_a_not_overwritten",
      !!clubAStill && clubAStill === clubAId && clubBId && clubBId !== clubAId,
      `a=${clubAStill} b=${clubBId}`,
    );
    evidence.clubs.b = { id: clubBId, ...CLUB_B };

    // Switcher + club B identity
    try {
      await clickTestId(page, `club-switch-${clubBId}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch {
      record("club_switcher_b", false, "switcher missing");
    }
    const homeB = await bodyText(page);
    record(
      "club_b_home_identity_purpose",
      homeB.includes(CLUB_B.name) &&
        homeB.includes(CLUB_B.purpose.slice(0, 20)),
      homeB.slice(0, 220),
    );
    const emptyB = await page.evaluate(
      () => !!document.querySelector('[data-testid="club-outings-empty"]'),
    );
    record("club_b_empty_before_own_outing", emptyB);
    // Club B must not list club A outing
    record(
      "club_b_does_not_list_club_a_outing",
      !homeB.includes(outingATitle),
      homeB.includes(outingATitle) ? "LEAK" : "clean",
    );
    await shot(page, "09-club-b-empty-home.png");

    const outingBTitle = `Marche Fajr ${TOKEN}`;
    const createdB = await createOutingForBoundClub(page, {
      title: outingBTitle,
      spot: `Médina ${TOKEN}`,
      clubId: clubBId,
      checkKey: "organise_bound_b",
    });
    evidence.outings.b = createdB;
    record("outing_b_created", !!createdB.id, createdB.url);

    const sessionsB = await readSessionsFromStorage(page);
    const storedB =
      sessionsB.find((s) => s.id === createdB.id) ||
      sessionsB.find((s) => s.title === outingBTitle);
    record(
      "outing_b_club_association",
      !!(
        storedB &&
        storedB.visibility === "members" &&
        storedB.clubId === clubBId
      ),
      storedB
        ? `clubId=${storedB.clubId} vis=${storedB.visibility}`
        : "missing",
    );

    await page.goto(BASE + "/club", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 800));
    try {
      await clickTestId(page, `club-switch-${clubBId}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch {
      /* */
    }
    const homeB2 = await bodyText(page);
    record(
      "club_b_lists_own_outing",
      homeB2.includes(outingBTitle) && !homeB2.includes(outingATitle),
      `hasB=${homeB2.includes(outingBTitle)} hasA=${homeB2.includes(outingATitle)}`,
    );
    await shot(page, "10-club-b-with-outing.png");

    try {
      await clickTestId(page, `club-switch-${clubAId}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch {
      /* */
    }
    const homeA2 = await bodyText(page);
    record(
      "club_a_still_own_outing_only",
      homeA2.includes(outingATitle) && !homeA2.includes(outingBTitle),
      `hasA=${homeA2.includes(outingATitle)} hasB=${homeA2.includes(outingBTitle)}`,
    );
    await shot(page, "11-club-a-isolated.png");

    // Desktop viewport keyboard/nav smoke
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE}/club/create`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await typeTestId(page, "club-name-input", `Desktop ${TOKEN}`);
    await typeTestId(page, "club-purpose-input", `But desktop ${TOKEN}`);
    await shot(page, "12-desktop-club-create.png");
    record("desktop_club_create_keyboard", true, "typed name+purpose @1280");

    await page.setViewport({ width: 320, height: 568 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 500));
    const shortPhoneIdea = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="discover-idea-english"]');
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    record("short_phone_idea_reachable", shortPhoneIdea);
    await shot(page, "13-short-phone-ideas.png");

    await page.setViewport({ width: 390, height: 844 });

    // Unresolved rules reported (not decided)
    record(
      "unresolved_creator_auto_attendance_reported",
      true,
      "preserved; not decided",
    );
    record(
      "unresolved_public_club_association_reported",
      true,
      "public still nulls clubId; not decided",
    );

    // Nested regressions (spawn existing scripts; record outcome)
    const batch1 = spawnSync(
      "node",
      ["scripts/batch1-privacy-evidence.mjs"],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: "true", E2E_BASE_URL: BASE },
        encoding: "utf8",
        timeout: 900000,
      },
    );
    const b1Path = path.join(
      REPO_ROOT,
      "docs/audit/batch1-privacy/evidence.json",
    );
    let b1Summary = null;
    if (fs.existsSync(b1Path)) {
      try {
        b1Summary = JSON.parse(fs.readFileSync(b1Path, "utf8")).summary;
      } catch {
        /* */
      }
    }
    evidence.regressions.batch1_privacy = {
      exit_code: batch1.status,
      summary: b1Summary,
      stderr_tail: (batch1.stderr || "").slice(-400),
    };
    record(
      "regression_batch1_privacy",
      batch1.status === 0 && b1Summary && b1Summary.failed === 0,
      JSON.stringify(b1Summary),
    );

    const batch2 = spawnSync(
      "node",
      ["scripts/batch2-walk-join-evidence.mjs"],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: "true", E2E_BASE_URL: BASE },
        encoding: "utf8",
        timeout: 900000,
      },
    );
    const b2Path = path.join(
      REPO_ROOT,
      "docs/audit/batch2-walk-join/evidence.json",
    );
    let b2Summary = null;
    if (fs.existsSync(b2Path)) {
      try {
        b2Summary = JSON.parse(fs.readFileSync(b2Path, "utf8")).summary;
      } catch {
        /* */
      }
    }
    evidence.regressions.batch2_walk_join = {
      exit_code: batch2.status,
      summary: b2Summary,
      stderr_tail: (batch2.stderr || "").slice(-400),
    };
    record(
      "regression_batch2_walk_join",
      batch2.status === 0 && b2Summary && b2Summary.failed === 0,
      JSON.stringify(b2Summary),
    );
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
    // Current screenshots only (no archive side-by-side mixed in)
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
      `# Batch 3 evidence`,
      ``,
      `- **tested_sha:** \`${evidence.tested_sha}\``,
      `- **branch:** \`${evidence.branch}\``,
      `- **environment:** \`${evidence.environment}\` · hosted_claim: ${evidence.hosted_claim}`,
      `- **summary:** ${JSON.stringify(evidence.summary)}`,
      `- **generated_at:** ${evidence.generated_at}`,
      ``,
      `## Checks`,
      ...Object.entries(evidence.checks).map(
        ([k, v]) => `- ${v.ok ? "PASS" : "FAIL"} \`${k}\` — ${v.detail}`,
      ),
      ``,
      `## Current screenshots`,
      ...evidence.screenshots.map((s) => `- \`${s}\``),
      ``,
      `## Unresolved (not decided)`,
      ...evidence.unresolved_rules_reported.map((x) => `- ${x}`),
      ``,
    ].join("\n");
    fs.writeFileSync(path.join(REPO_EVIDENCE, "EVIDENCE.md"), md);
    fs.writeFileSync(
      path.join(REPO_EVIDENCE, "CURRENT_RUN.md"),
      [
        `# Batch 3 current evidence run`,
        ``,
        `- **tested_sha:** \`${evidence.tested_sha}\``,
        `- **environment:** demo · **hosted_claim:** false`,
        `- **summary:** ${JSON.stringify(evidence.summary)}`,
        `- **Authoritative manifest:** \`evidence.json\` → \`screenshots\` list`,
        `- **Archive (not current):** \`archive/\` — superseded captures only`,
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
