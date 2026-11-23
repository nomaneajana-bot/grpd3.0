/**
 * Prove onboarding Allure step is gone: role → goal, deep-link /pace redirects.
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
  console.log("SHOT", p);
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
  await page.waitForTimeout(600);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
  await page.waitForTimeout(500);
  if (await page.getByText(/^Vérifier$/i).count()) {
    await clickText(page, /^Vérifier$/i);
    await page.waitForTimeout(600);
  }
}

async function clearAll(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(30000);

  try {
    await clearAll(page);
    await clickText(page, /Commencer/i);
    await page.waitForTimeout(400);
    const phone = page.getByTestId("phone-input");
    await phone.click({ force: true });
    await phone.fill("0708060337", { force: true });
    await clickText(page, /Continuer|Recevoir/i);
    await page.waitForTimeout(700);
    const verifyBody = await page.locator("body").innerText();
    const codeMatch = verifyBody.match(/code\s+(000000|123456)/i);
    await enterOtp(page, codeMatch ? codeMatch[1] : "000000");
    await page.getByPlaceholder(/Sara/i).first().fill("SansAllure", { force: true });
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(700);

    await shot(page, "no-pace-01-role.png");
    await clickText(page, /Découvrir à mon rythme/i);
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(900);

    await shot(page, "no-pace-02-after-role.png");
    const afterRole = await page.locator("body").innerText();
    const urlAfterRole = page.url();
    check(
      "role_lands_on_goal",
      /\/goal/i.test(urlAfterRole) || /Ton intention/i.test(afterRole),
      `${urlAfterRole} :: ${afterRole.slice(0, 200)}`,
    );
    check(
      "allure_ui_absent",
      !/Allure de course \(optionnel\)/i.test(afterRole) &&
        !/Continuer avec cette allure/i.test(afterRole) &&
        !/Passer — je n/i.test(afterRole) &&
        !/onboarding-pace-picker/i.test(afterRole),
      afterRole.slice(0, 280),
    );

    // Deep link leftover must redirect away from Allure UI
    await page.goto(`${BASE}/onboarding/pace`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(1200);
    await shot(page, "no-pace-03-deeplink-pace.png");
    const deepBody = await page.locator("body").innerText();
    const deepUrl = page.url();
    check(
      "pace_deeplink_redirects_to_goal",
      /\/goal/i.test(deepUrl) &&
        !/Allure de course \(optionnel\)|Continuer avec cette allure/i.test(deepBody),
      `${deepUrl} :: ${deepBody.slice(0, 200)}`,
    );
  } catch (e) {
    console.error("NO_PACE_SMOKE_ERROR", e);
    report.error = String(e);
    try {
      await shot(page, "no-pace-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "remove-onboarding-pace-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
