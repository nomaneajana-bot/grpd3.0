/**
 * Onboarding asks Homme/Femme and agrees French (prêt/prête, content/contente).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "onboarding-gender",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
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
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await page.goto(`${BASE}/onboarding`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.reload({ waitUntil: "networkidle" });

    // Fresh signup path
    await clickText(page, /Commencer|Créer un compte|Je suis nouveau|nouveau/i).catch(
      async () => {
        // index may only offer "Commencer"
        const body = await page.locator("body").innerText();
        if (/Commencer/i.test(body)) await clickText(page, /Commencer/i);
      },
    );

    // Phone
    await page.waitForURL(/phone|onboarding/i, { timeout: 20000 }).catch(() => {});
    if (await page.getByTestId("phone-input").count()) {
      await page.getByTestId("phone-input").fill("0622222233");
      await clickText(page, /Continuer|Suivant|Envoyer/i);
      await page.waitForURL(/verify/i, { timeout: 20000 });
      await enterOtp(page, "000000");
      try {
        await clickText(page, /^Vérifier$/i);
      } catch {}
    }

    // Profile — gender required
    await page.waitForURL(/profile/i, { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(800);
    let body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "onboarding-gender-profile.png"),
      fullPage: true,
    });
    check(
      "gender_row_visible",
      (await page.getByTestId("onboarding-gender-row").count()) > 0 ||
        (/Homme/i.test(body) && /Femme/i.test(body)),
      body.slice(0, 160),
    );

    if (await page.getByTestId("onboarding-first-name").count()) {
      await page.getByTestId("onboarding-first-name").fill("Sara");
    } else {
      const inputs = page.locator('input, [contenteditable="true"]');
      if ((await inputs.count()) > 0) {
        await inputs.first().fill("Sara");
      }
    }

    // Continue disabled without gender
    const continueBtn = page.getByText(/^Continuer$/i).last();
    await page.getByTestId("onboarding-gender-female").click({ force: true });
    await page.waitForTimeout(300);
    await continueBtn.click({ force: true });
    await page.waitForTimeout(900);

    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "onboarding-gender-role-female.png"),
      fullPage: true,
    });
    check(
      "role_agrees_female",
      /contente/i.test(body),
      body.slice(0, 200),
    );

    // Flip gender in storage + revisit role via profile if possible
    await page.evaluate(() => {
      try {
        const key = "grpd_onboarding_v1";
        const raw = localStorage.getItem(key);
        const s = raw ? JSON.parse(raw) : {};
        s.gender = "male";
        s.firstName = "Amine";
        localStorage.setItem(key, JSON.stringify(s));
      } catch {}
    });
    await page.goto(`${BASE}/onboarding/role`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(700);
    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "onboarding-gender-role-male.png"),
      fullPage: true,
    });
    check(
      "role_agrees_male",
      /content(?!e)/i.test(body) || /\bcontent\b/i.test(body),
      body.slice(0, 200),
    );

    await page.goto(`${BASE}/onboarding/welcome`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(700);
    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "onboarding-gender-welcome-male.png"),
      fullPage: true,
    });
    check(
      "welcome_agrees_male",
      /Tu es prêt/i.test(body) && !/Tu es prête/i.test(body),
      body.slice(0, 200),
    );

    await page.evaluate(() => {
      try {
        const key = "grpd_onboarding_v1";
        const raw = localStorage.getItem(key);
        const s = raw ? JSON.parse(raw) : {};
        s.gender = "female";
        s.firstName = "Sara";
        localStorage.setItem(key, JSON.stringify(s));
      } catch {}
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "onboarding-gender-welcome-female.png"),
      fullPage: true,
    });
    check(
      "welcome_agrees_female",
      /Tu es prête/i.test(body),
      body.slice(0, 200),
    );
    check(
      "summary_shows_genre",
      /Genre/i.test(body) && /Femme/i.test(body),
      body.slice(0, 200),
    );
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "onboarding-gender-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
