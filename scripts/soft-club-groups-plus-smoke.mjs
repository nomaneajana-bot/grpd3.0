/**
 * Soft “Organisé avec” + member self-assign (demo).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [] };

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 240) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

async function clickText(page, re) {
  const all = page.getByText(re);
  const count = await all.count();
  let target = all.first();
  for (let i = count - 1; i >= 0; i--) {
    const cand = all.nth(i);
    if (await cand.isVisible().catch(() => false)) {
      target = cand;
      break;
    }
  }
  await target.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(400);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 8 });
  }
}

async function login(page) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill("0611111111");
  await clickText(page, /Continuer|Recevoir|Envoyer/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
  await page.waitForFunction(
    () => /Découvrir|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {}
  });
  try {
    await login(page);
    const clubName = `Soft Club ${Date.now().toString(36).slice(-4)}`;
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.getByTestId("club-name-input").fill(clubName);
    await page.getByTestId("club-city-input").fill("Fès");
    await page.getByTestId("club-purpose-input").fill("Soft association");
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2200);

    // Enable member org via settings if CTA present
    const enable = page.getByTestId("club-enable-member-org");
    if (await enable.count()) {
      await enable.click({ force: true });
      await page.waitForTimeout(800);
    } else {
      await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
    }
    // Toggle member org if switch exists
    const toggle = page.getByTestId("member-org-toggle");
    if (await toggle.count()) {
      await toggle.click({ force: true });
      await page.waitForTimeout(600);
      // Add a starter group if empty
      const add = page.getByTestId("member-org-add-group");
      if (await add.count()) {
        await add.click({ force: true });
        await page.waitForTimeout(500);
      }
    } else {
      // Seed settings in storage
      await page.evaluate((cidName) => {
        const memRaw = localStorage.getItem("mock:club_memberships");
        const mem = memRaw ? JSON.parse(memRaw) : {};
        const clubId = Object.values(mem)[0]?.clubId;
        if (!clubId) return;
        const key = `grpd_club_admin_v2_${clubId}`;
        const settings = {
          memberOrgEnabled: true,
          colorGroups: [
            { id: "g_red", name: "Rouge", colorKey: "red", sortOrder: 0, active: true },
            { id: "g_blue", name: "Bleu", colorKey: "blue", sortOrder: 1, active: true },
          ],
          memberGroups: {},
          groups: [],
        };
        localStorage.setItem(key, JSON.stringify(settings));
        void cidName;
      }, clubName);
    }

    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const selfBtn = page.getByTestId("club-self-assign-group");
    check("self_assign_cta", Boolean(await selfBtn.count()), await page.locator("body").innerText().then((t) => t.slice(0, 80)));
    if (await selfBtn.count()) {
      await selfBtn.click({ force: true });
      await page.waitForTimeout(500);
      const groupChip = page.getByTestId(/assign-group-/).first();
      if (await groupChip.count()) {
        await groupChip.click({ force: true });
        await page.waitForTimeout(800);
        check("self_assign_picked", true, "picked");
      } else {
        check("self_assign_picked", false, "no chips");
      }
    }
    await page.screenshot({ path: path.join(OUT, "walkthrough-self-assign.png"), fullPage: true });

    // Soft public outing from club
    const organise = page.getByTestId("club-organise-outing-cta");
    if (await organise.count()) await organise.click({ force: true });
    else await page.goto(`${BASE}/session/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    // Switch to public while keeping soft club
    await page.getByTestId("session-audience-club").click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    await page.getByTestId("session-audience-public").click({ force: true });
    await page.waitForTimeout(800);
    // confirm dialog may auto-accept via handler
    const softNote = page.getByTestId("create-public-soft-club");
    check("soft_club_note_on_create", Boolean(await softNote.count()), await softNote.count());

    await clickText(page, /^Marche$/i);
    await page.getByTestId("session-title-input").fill("Ouverte soft club");
    await page.getByTestId("session-purpose-input").fill("Public mais associée");
    await page.getByTestId("session-structure-input").fill("Soft · 20 min");
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2500);
    let url = page.url();
    let id = null;
    if (/published/i.test(url)) id = new URL(url).searchParams.get("id");
    else {
      const m = url.match(/\/session\/([^/?]+)/);
      id = m && m[1] !== "create" ? m[1] : null;
    }
    if (id) {
      await page.goto(`${BASE}/session/${id}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
    }
    const softRow = page.getByTestId("session-soft-club-name");
    const softOk = Boolean(await softRow.count()) && (await softRow.innerText()).length > 0;
    check("detail_organise_avec", softOk, softOk ? await softRow.innerText() : await page.locator("body").innerText().then((t) => t.slice(0, 120)));
    await page.screenshot({ path: path.join(OUT, "walkthrough-soft-club-detail.png"), fullPage: true });
  } catch (e) {
    check("soft_groups_uncaught", false, String(e));
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(path.join(OUT, "soft-club-groups-plus-smoke.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
