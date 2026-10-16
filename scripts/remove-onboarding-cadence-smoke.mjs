/**
 * Prove Cadence visée slider is gone from onboarding goal + welcome.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], base: BASE, tested_at: new Date().toISOString() };

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
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
    await page.getByPlaceholder(/Sara/i).first().fill("SansCadence", { force: true });
    await clickText(page, /^Continuer$/);
    await clickText(page, /Découvrir à mon rythme/i);
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(800);
    await shot(page, "no-cadence-01-goal.png");
    const goal = await page.locator("body").innerText();
    check(
      "goal_has_intention",
      /Ton intention|Marche & bien-être/i.test(goal),
      goal.slice(0, 200),
    );
    check(
      "cadence_slider_absent",
      !/Cadence visée|séances\s*\/\s*semaine/i.test(goal),
      goal.slice(0, 280),
    );
    await clickText(page, /Marche & bien-être|Marche/i);
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(700);
    if (await page.getByText(/^Continuer$/i).count()) {
      await clickText(page, /^Continuer$/);
      await page.waitForTimeout(800);
    }
    await shot(page, "no-cadence-02-welcome.png");
    const welcome = await page.locator("body").innerText();
    check(
      "welcome_no_rythme_row",
      /C.est prêt|BIENVENUE/i.test(welcome) &&
        !/RYTHME|sorties\s*\/\s*semaine|Cadence visée/i.test(welcome),
      welcome.slice(0, 280),
    );
  } catch (e) {
    report.error = String(e);
    console.error(e);
    try {
      await shot(page, "no-cadence-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "remove-onboarding-cadence-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
