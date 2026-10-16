/**
 * Member color groups v1: org off by default; enable in settings; hub GROUPES.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], base: BASE, tested_at: new Date().toISOString() };

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 300) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  return p;
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
  await page.waitForTimeout(500);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 8 });
  }
  await page.waitForTimeout(400);
  if (await page.getByText(/^Vérifier$/i).count()) {
    await clickText(page, /^Vérifier$/i);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.reload({ waitUntil: "networkidle", timeout: 60000 });
    await clickText(page, /Commencer/i);
    await page.getByTestId("phone-input").fill("0708060337", { force: true });
    await clickText(page, /Continuer|Recevoir/i);
    await page.waitForTimeout(600);
    const verify = await page.locator("body").innerText();
    const m = verify.match(/code\s+(000000|123456)/i);
    await enterOtp(page, m ? m[1] : "000000");
    await page.getByPlaceholder(/Sara/i).first().fill("Groupes", { force: true });
    await clickText(page, /^Continuer$/);
    await clickText(page, /Créer un club/i);
    await clickText(page, /^Continuer$/);
    await clickText(page, /Marche & bien-être|Marche/i);
    await clickText(page, /^Continuer$/);
    await page.getByTestId("onboarding-club-name").fill("Couleurs Club", { force: true });
    await clickText(page, /Créer le club/i);
    await page.waitForTimeout(900);
    if (await page.getByText(/^Continuer$/i).count()) {
      await clickText(page, /^Continuer$/);
      await page.waitForTimeout(700);
    }
    await clickText(page, /Voir l'accueil|Voir l’accueil/i);
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/club`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot(page, "member-groups-01-hub-off.png");
    let body = await page.locator("body").innerText();
    check(
      "hub_no_pace_elite",
      !/GROUPES DE PACE|Élite|Sub 4:30/i.test(body),
      body.slice(0, 280),
    );
    check(
      "hub_offers_enable_or_hides_groups",
      /Organiser les membres|GROUPES/i.test(body) ||
        !/Groupe A —/i.test(body),
      body.slice(0, 280),
    );

    await page.goto(`${BASE}/club/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await shot(page, "member-groups-02-settings.png");
    body = await page.locator("body").innerText();
    check(
      "settings_has_org_toggle",
      /Organiser les membres|Groupes couleur/i.test(body),
      body.slice(0, 280),
    );

    const toggle = page.getByTestId("member-org-toggle");
    if (await toggle.count()) {
      await toggle.click({ force: true });
      await page.waitForTimeout(800);
      await shot(page, "member-groups-03-enabled.png");
      body = await page.locator("body").innerText();
      check(
        "settings_enabled_shows_groups",
        /Élite|Conversation|Intermédiaire|Créer un groupe|Affecter/i.test(body),
        body.slice(0, 300),
      );
      await page.goto(`${BASE}/club`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await shot(page, "member-groups-04-hub-on.png");
      body = await page.locator("body").innerText();
      check(
        "hub_shows_groupes_not_pace_label",
        /GROUPES/i.test(body) && !/GROUPES DE PACE/i.test(body),
        body.slice(0, 300),
      );
    } else {
      check("settings_has_org_toggle", false, "toggle missing");
    }
  } catch (e) {
    report.error = String(e);
    console.error(e);
    try {
      await shot(page, "member-groups-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "member-groups-v1-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
