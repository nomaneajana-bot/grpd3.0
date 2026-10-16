/**
 * Verify Entraînement avancé is gone from Profil and deep links redirect.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = { base: BASE, tested_at: new Date().toISOString(), checks: [] };

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
  await page.waitForTimeout(500);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
  await page.waitForTimeout(500);
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
  await clickText(page, /Continuer|Suivant|Envoyer/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
  await page.waitForFunction(
    () => /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await login(page);
    await page.goto(`${BASE}/profile`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);
    const profileText = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "profile-no-advanced-training.png"),
      fullPage: true,
    });
    check(
      "profile_no_entrainement_section",
      !/Entraînement avancé|ENTRAÎNEMENT\n/i.test(profileText),
      profileText.slice(0, 200),
    );
    check(
      "profile_no_training_link",
      (await page.getByTestId("profile-training-link").count()) === 0,
      "link count",
    );
    check("profile_keeps_clubs", /CLUBS/i.test(profileText), "clubs");
    check("profile_keeps_prefs", /PRÉFÉRENCES/i.test(profileText), "prefs");

    for (const route of [
      "/profile/training",
      "/workouts",
      "/profile/update-tests",
      "/workout/abc",
    ]) {
      await page.goto(`${BASE}${route}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForTimeout(800);
      const t = await page.locator("body").innerText();
      check(
        `redirect_${route.replace(/\W+/g, "_")}`,
        /Profil|CLUBS|PRÉFÉRENCES/i.test(t) &&
          !/SÉRIE EN COURS|RECORDS PERSONNELS|Plans et workouts/i.test(t),
        t.slice(0, 160),
      );
    }
    await page.screenshot({
      path: path.join(OUT, "training-route-redirects-profile.png"),
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
  const pass = report.checks.filter((c) => c.ok).length;
  const fail = report.checks.filter((c) => !c.ok).length;
  report.summary = { pass, fail };
  fs.writeFileSync(
    path.join(OUT, "remove-advanced-training-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
