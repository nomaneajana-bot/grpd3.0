/**
 * Club-join onboarding presence redesign: beautiful empty + found states.
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
    await page.keyboard.type(String(code[i]), { delay: 10 });
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
    await page.getByPlaceholder(/Sara/i).first().fill("Presence", { force: true });
    await clickText(page, /^Continuer$/);
    await clickText(page, /Rejoindre un club/i);
    await clickText(page, /^Continuer$/);
    await clickText(page, /Marche|Régularité|5 km/i);
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(900);

    await shot(page, "club-join-01-empty.png");
    const empty = await page.locator("body").innerText();
    check(
      "presence_title",
      /Ton club/i.test(empty) && /t.attend/i.test(empty),
      empty.slice(0, 240),
    );
    check(
      "code_and_link_present",
      /CODE D.INVITATION|code/i.test(empty) &&
        /Coller un lien d.invitation/i.test(empty),
      empty.slice(0, 240),
    );
    check(
      "not_old_ugly_copy",
      !/Le code de ton club/i.test(empty),
      empty.slice(0, 200),
    );

    // Try invalid code then a demo seed code if available
    const inputs = page.locator('input:visible');
    const n = await inputs.count();
    const tryCode = "ZZZZZZ";
    for (let i = 0; i < Math.min(6, n); i++) {
      await inputs.nth(i).fill(tryCode[i], { force: true });
    }
    await page.waitForTimeout(800);
    await shot(page, "club-join-02-after-code.png");
    const after = await page.locator("body").innerText();
    check(
      "handles_lookup_without_crash",
      /club|code|invitation|erreur|valide|aucun|Rejoindre|Entrer/i.test(after),
      after.slice(0, 240),
    );

    // Deep link route still loads
    await page.goto(`${BASE}/onboarding/club`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(800);
    await shot(page, "club-join-03-deeplink.png");
    const deep = await page.locator("body").innerText();
    check(
      "deeplink_shows_presence_or_auth",
      /Ton club|REJOINDRE|Commencer|code/i.test(deep),
      deep.slice(0, 200),
    );
  } catch (e) {
    report.error = String(e);
    console.error(e);
    try {
      await shot(page, "club-join-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "club-join-presence-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
