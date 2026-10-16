/**
 * Organise audience: only Ouverte / Réservée au club — no Femmes/Équipe access chips.
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
  await page.waitForTimeout(450);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 8 });
  }
  await page.waitForTimeout(400);
  if (await page.getByText(/^Vérifier$/i).count()) await clickText(page, /^Vérifier$/i);
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
    await page.waitForTimeout(500);
    const verify = await page.locator("body").innerText();
    const m = verify.match(/code\s+(000000|123456)/i);
    await enterOtp(page, m ? m[1] : "000000");
    await page.getByPlaceholder(/Sara/i).first().fill("Visibilite", { force: true });
    await clickText(page, /^Continuer$/);
    await clickText(page, /Découvrir à mon rythme/i);
    await clickText(page, /^Continuer$/);
    await clickText(page, /Marche|Régularité/i);
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(600);
    if (await page.getByText(/^Continuer$/i).count()) {
      await clickText(page, /^Continuer$/);
      await page.waitForTimeout(600);
    }
    await clickText(page, /Voir l'accueil|Voir l’accueil/i);
    await page.waitForTimeout(1000);

    await page.goto(`${BASE}/session/create`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1200);
    await shot(page, "visibility-01-create.png");
    const body = await page.locator("body").innerText();
    check(
      "two_mode_labels_present",
      /Ouverte à tous|Réservée au club/i.test(body),
      body.slice(0, 280),
    );
    check(
      "legacy_access_chips_gone",
      !/session-audience-women|session-audience-team/i.test(body) &&
        !(
          await page.getByTestId("session-audience-women").count()
        ) &&
        !(await page.getByTestId("session-audience-team").count()) &&
        !/\bFemmes\b/.test(body) &&
        !/\bÉquipe\b/.test(body),
      body.slice(0, 280),
    );
    check(
      "section_renamed_access",
      /CETTE SORTIE EST|Qui peut voir et rejoindre/i.test(body),
      body.slice(0, 200),
    );

    await page.getByTestId("session-audience-club").click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, "visibility-02-club.png");
    const clubBody = await page.locator("body").innerText();
    check(
      "club_mode_hint",
      /membres confirmés|Réservée au club/i.test(clubBody),
      clubBody.slice(0, 240),
    );
  } catch (e) {
    report.error = String(e);
    console.error(e);
    try {
      await shot(page, "visibility-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "visibility-simplify-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
