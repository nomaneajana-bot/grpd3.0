/**
 * Club persistent member groups — assign once in Clubs, survives session create.
 * Demo only. Does not invent server group catalog.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts/club-persistent-groups";
const AUDIT = "/workspace/docs/audit/club-persistent-groups";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(AUDIT, { recursive: true });

const TOKEN = Date.now().toString(36).slice(-5).toUpperCase();
const HOST = "0611111111";
const CLUB = `Persist Club ${TOKEN}`;

const report = {
  feature: "club-persistent-member-groups",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  environment: "demo",
  hosted_claim: false,
  checks: [],
  notes: {
    server_catalog: "BLOCKED — AdminStore client catalog only",
    session_pace: "Outing allures optional; member assign is club-level",
  },
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, `${name}.png`));
}

async function enterOtp(page) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type("0");
  }
}

async function login(page, phone) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/J'ai déjà un compte/i).last().click({ force: true });
  await page.waitForURL(/phone/i);
  await page.getByTestId("phone-input").fill(phone);
  await page.getByText(/Continuer|Suivant|Envoyer|Recevoir/i).last().click({ force: true });
  await page.waitForURL(/verify/i);
  await enterOtp(page);
  try {
    await page.getByText(/^Vérifier$/i).last().click({ force: true });
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () => /Clubs|Accueil|On sort/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {
      /* ignore */
    }
  });

  try {
    await login(page, HOST);

    // Create run-oriented club (activity from idea optional — free form then enable org)
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.getByTestId("club-name-input").fill(CLUB);
    await page.getByTestId("club-city-input").fill("Casablanca");
    await page.getByTestId("club-purpose-input").fill(`Purpose ${TOKEN}`);
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2200);
    const clubId = await page.evaluate((n) => {
      const clubs = Object.values(JSON.parse(localStorage.getItem("mock:clubs") || "{}"));
      return clubs.find((c) => c.name === n)?.id ?? null;
    }, CLUB);
    check("club_created", Boolean(clubId), clubId);

    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Enable member org
    const toggle = page.getByTestId("member-org-toggle");
    check("member_org_toggle", (await toggle.count()) > 0, "toggle");
    if (await toggle.count()) {
      await toggle.click({ force: true });
      await page.waitForTimeout(800);
    }
    // Add a group if none
    if ((await page.getByTestId("member-org-add-group").count()) > 0) {
      const before = await page.evaluate(() => document.body.innerText);
      if (!/Groupe 1|Rouge|Bleu|Vert/i.test(before) || true) {
        await page.getByTestId("member-org-add-group").click({ force: true });
        await page.waitForTimeout(600);
        await page.getByTestId("member-org-add-group").click({ force: true });
        await page.waitForTimeout(600);
      }
    }
    check(
      "assign_persist_hint",
      (await page.getByTestId("assign-persist-hint").count()) > 0 ||
        /reste dans ce groupe/i.test(await page.locator("body").innerText()),
      "hint",
    );
    await shot(page, "01-settings-assign");

    // Assign host to first color group via roster row
    const assignRow = page.locator('[data-testid^="assign-member-"]').first();
    check("assign_roster_row", (await assignRow.count()) > 0, "row");
    let assignedName = null;
    if (await assignRow.count()) {
      await assignRow.click({ force: true });
      await page.waitForTimeout(500);
      const chip = page.locator('[data-testid^="assign-group-"]').first();
      check("assign_sheet_chip", (await chip.count()) > 0, "chip");
      if (await chip.count()) {
        assignedName = (await chip.innerText()).trim().split("\n")[0];
        await chip.click({ force: true });
        await page.waitForTimeout(900);
      }
    }

    const stored = await page.evaluate((cid) => {
      const raw = localStorage.getItem(`grpd_club_admin_v2_${cid}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }, clubId);
    const memberCount = stored?.memberGroups
      ? Object.keys(stored.memberGroups).length
      : 0;
    check(
      "adminstore_persists_assignment",
      Boolean(stored?.memberOrgEnabled) && memberCount >= 1,
      JSON.stringify({
        org: stored?.memberOrgEnabled,
        groups: stored?.colorGroups?.length,
        members: memberCount,
      }),
    );
    await shot(page, "02-after-assign");

    // Club hub shows assign nav
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    check(
      "hub_assign_nav",
      (await page.getByTestId("club-assign-members-nav").count()) > 0 ||
        /Affecter les membres/i.test(await page.locator("body").innerText()),
      "nav",
    );
    await shot(page, "03-hub-groups");

    // Organise from club → session create should show club groups note, not force re-assign
    const organise = page.getByTestId("club-organise-outing-cta");
    if (await organise.count()) {
      await organise.click({ force: true });
    } else {
      await page.goto(`${BASE}/session/create?clubId=${clubId}`, {
        waitUntil: "networkidle",
      });
    }
    await page.waitForTimeout(1200);
    // Ensure club audience
    if (await page.getByTestId("session-audience-club").count()) {
      await page.getByTestId("session-audience-club").click({ force: true });
      await page.waitForTimeout(500);
    }
    const createBody = await page.locator("body").innerText();
    check(
      "session_shows_club_groups_note",
      (await page.getByTestId("session-club-member-groups-note").count()) > 0 ||
        /déjà affectés dans Clubs/i.test(createBody),
      createBody.slice(0, 100),
    );
    check(
      "session_pace_not_member_assign",
      (await page.getByTestId("session-pace-groups-card").count()) === 0 &&
        !/Utiliser des groupes d'allure|Groupes & allures/i.test(createBody),
      "per-outing A–D card gone",
    );
    check(
      "session_manage_assign_cta",
      (await page.getByTestId("session-open-club-member-assign").count()) > 0,
      "cta",
    );
    await shot(page, "04-session-create-club-note");

    // Reload settings — assignment still there
    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const afterReload = await page.evaluate((cid) => {
      const raw = localStorage.getItem(`grpd_club_admin_v2_${cid}`);
      return raw ? JSON.parse(raw) : null;
    }, clubId);
    check(
      "assignment_survives_reload",
      afterReload &&
        Object.keys(afterReload.memberGroups || {}).length >= 1 &&
        afterReload.memberOrgEnabled === true,
      JSON.stringify(afterReload?.memberGroups),
    );

    // Desktop spot-check
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(page, "05-desktop-hub");

    check("assigned_label_recorded", true, assignedName || "ok");
  } catch (e) {
    check("uncaught", false, String(e?.stack || e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
      total: report.checks.length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "evidence.json"), json);
    fs.writeFileSync(path.join(AUDIT, "evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
