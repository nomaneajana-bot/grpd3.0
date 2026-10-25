/**
 * Screen-completion PROMPT 2 — create club → club home → edit (demo).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts/screen-completion";
const AUDIT = "/workspace/docs/audit/screen-completion";
fs.mkdirSync(path.join(OUT, "p2"), { recursive: true });
fs.mkdirSync(path.join(AUDIT, "p2"), { recursive: true });

const TOKEN = Date.now().toString(36).slice(-5).toUpperCase();
const CLUB_A = `P2 Club A ${TOKEN}`;
const CLUB_B = `P2 Club B ${TOKEN}`;
const CLUB_A_EDIT = `P2 Club A edit ${TOKEN}`;

const report = {
  prompt: 2,
  journey: "create-club-home-edit",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  environment: "demo",
  hosted_claim: false,
  blockers: [
    {
      id: "server_group_catalog",
      status: "BLOCKED",
      note: "Club color-group catalog remains client AdminStore; not a fake server production feature",
    },
  ],
  checks: [],
  ids: {},
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, "p2", `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, "p2", `${name}.png`));
}

async function enterOtp(page) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type("0");
  }
}

async function login(page, phone, wipe = false) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  if (wipe) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } else {
    await page.evaluate(() => {
      const keep = {};
      for (const k of Object.keys(localStorage)) {
        if (/mock:|grpd_club_admin|grpd_focused/i.test(k)) keep[k] = localStorage.getItem(k);
      }
      localStorage.clear();
      sessionStorage.clear();
      for (const [k, v] of Object.entries(keep)) if (v != null) localStorage.setItem(k, v);
    });
  }
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
  try {
    await login(page, "0611111111", true);

    // Validation: empty name
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(800);
    const emptyBody = await page.locator("body").innerText();
    check(
      "p2_empty_name_validation",
      /Ajoute un nom|nom de club/i.test(emptyBody) || page.url().includes("create"),
      emptyBody.slice(0, 80),
    );

    // Draft abandon
    const abandon = `ABANDON-P2-${TOKEN}`;
    await page.getByTestId("club-name-input").fill(abandon);
    await page.getByTestId("club-create-cancel").click({ force: true });
    await page.waitForTimeout(800);
    const abandoned = await page.evaluate((n) => {
      const clubs = Object.values(JSON.parse(localStorage.getItem("mock:clubs") || "{}"));
      return clubs.some((c) => c.name === n);
    }, abandon);
    check("p2_cancel_clears_draft_no_publish", !abandoned, abandon);

    // Create A — unrestricted purpose
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.getByTestId("club-name-input").fill(CLUB_A);
    await page.getByTestId("club-city-input").fill("Casablanca");
    await page.getByTestId("club-purpose-input").fill(`Langue et marche libre ${TOKEN}`);
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2200);
    const storeA = await page.evaluate((n) => {
      const clubs = Object.values(JSON.parse(localStorage.getItem("mock:clubs") || "{}"));
      const c = clubs.find((x) => x.name === n);
      const focus = localStorage.getItem("grpd_focused_club_id_v1");
      const admin = c
        ? JSON.parse(localStorage.getItem(`grpd_club_admin_v2_${c.id}`) || "null")
        : null;
      return { club: c, focus, admin };
    }, CLUB_A);
    check("p2_create_a_exact", storeA.club?.name === CLUB_A && storeA.club?.city === "Casablanca", storeA.club?.id);
    check("p2_create_a_focused", storeA.focus === storeA.club?.id, storeA.focus);
    check(
      "p2_no_forced_running_groups",
      storeA.admin?.memberOrgEnabled === false &&
        (storeA.admin?.activityStructure === "neutral" ||
          storeA.admin?.activityStructure === "walk"),
      JSON.stringify({
        memberOrgEnabled: storeA.admin?.memberOrgEnabled,
        activityStructure: storeA.admin?.activityStructure,
      }),
    );
    report.ids.clubA = storeA.club?.id;
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const homeA = await page.locator("body").innerText();
    check("p2_club_home_shows_a", homeA.includes(CLUB_A), homeA.slice(0, 80));
    check("p2_admin_actions_visible", /Paramètres|Organiser|Quitter/i.test(homeA), "admin chrome");
    await shot(page, "01-club-a-home");

    // Edit round-trip
    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const nameInput = page.getByPlaceholder(/Nom du club/i).first();
    if (await nameInput.count()) {
      await nameInput.fill(CLUB_A_EDIT);
      await page.getByText(/Enregistrer le club/i).first().click({ force: true });
      await page.waitForTimeout(1500);
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const after = await page.locator("body").innerText();
      check("p2_edit_round_trip", after.includes(CLUB_A_EDIT), after.slice(0, 80));
      const persisted = await page.evaluate(
        ({ id, name }) => {
          const clubs = JSON.parse(localStorage.getItem("mock:clubs") || "{}");
          return clubs[id]?.name === name;
        },
        { id: report.ids.clubA, name: CLUB_A_EDIT },
      );
      check("p2_edit_persisted_store", persisted, CLUB_A_EDIT);
    } else {
      check("p2_edit_round_trip", false, "name input missing");
    }
    await shot(page, "02-club-edited");

    // Create B — preserve A
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.getByTestId("club-name-input").fill(CLUB_B);
    await page.getByTestId("club-city-input").fill("Rabat");
    await page.getByTestId("club-purpose-input").fill(`Second club ${TOKEN}`);
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2200);
    const two = await page.evaluate(
      ({ aId, aName, bName }) => {
        const clubs = JSON.parse(localStorage.getItem("mock:clubs") || "{}");
        const b = Object.values(clubs).find((c) => c.name === bName);
        return {
          aStill: Boolean(clubs[aId]) && clubs[aId].name === aName,
          bId: b?.id ?? null,
          focus: localStorage.getItem("grpd_focused_club_id_v1"),
        };
      },
      { aId: report.ids.clubA, aName: CLUB_A_EDIT, bName: CLUB_B },
    );
    check("p2_second_preserves_first", two.aStill && Boolean(two.bId), JSON.stringify(two));
    check("p2_second_focused", two.focus === two.bId, two.focus);
    report.ids.clubB = two.bId;
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const bothUi = await page.locator("body").innerText();
    check(
      "p2_both_clubs_visible",
      bothUi.includes(CLUB_B) && bothUi.includes(CLUB_A_EDIT),
      bothUi.slice(0, 100),
    );
    await shot(page, "03-two-clubs");

    // Outsider phone — no admin settings
    await login(page, "0655555555");
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const out = await page.locator("body").innerText();
    check(
      "p2_outsider_no_admin",
      !/Enregistrer le club/i.test(out) &&
        (/J'ai une clé|invitation|Créer/i.test(out) || Boolean(await page.getByTestId("club-key-empty").count())),
      out.slice(0, 80),
    );
    await shot(page, "04-outsider");
  } catch (e) {
    check("p2_uncaught", false, String(e?.stack || e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
      total: report.checks.length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "p2-club-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "p2-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
