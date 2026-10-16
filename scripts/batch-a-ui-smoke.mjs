/**
 * Batch A onboarding UI smoke — local Expo web (mock).
 * Fresh storage; screenshot key screens; record join-path blocker.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BATCH_A_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log("SHOT", p);
  return p;
}

async function clearStorage(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
}

async function clickText(page, re, opts = {}) {
  // Prefer the last matching visible control (RN web often keeps prior screens mounted/hidden).
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
  await target.waitFor({ state: "attached", timeout: opts.timeout ?? 20000 });
  await target.click({ force: true, timeout: 10000 });
  await page.waitForTimeout(600);
}

async function fillNearby(page, placeholderOrLabel, value) {
  const input = page
    .locator("input, textarea, [contenteditable=true]")
    .filter({ hasNot: page.locator("[type=hidden]") })
    .first();
  // Prefer placeholder match
  const byPh = page.getByPlaceholder(placeholderOrLabel);
  if ((await byPh.count()) > 0) {
    await byPh.first().fill(value);
    return;
  }
  await input.fill(value);
}

const report = {
  base: BASE,
  paths: {},
  blockers: [],
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail });
  console.log(ok ? "PASS" : "FAIL", id, detail || "");
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  try {
    await clearStorage(page);
    await shot(page, "batch-a-00-start.png");

    // Commencer
    await clickText(page, /Commencer/i);
    await page.waitForTimeout(800);
    await shot(page, "batch-a-01-phone.png");

    // Phone — enter digits. CountryPhoneInput may be custom.
    const phoneInputs = page.locator("input");
    const n = await phoneInputs.count();
    let filled = false;
    for (let i = 0; i < n; i++) {
      const el = phoneInputs.nth(i);
      const type = await el.getAttribute("type");
      if (type === "password" || type === "hidden") continue;
      await el.click({ force: true });
      await el.fill("0708060337");
      filled = true;
      break;
    }
    check("phone_fill", filled, "entered 0708060337");
    await page.waitForTimeout(400);
    const bodyPhone = await page.locator("body").innerText();
    check(
      "sim_hint_phone",
      /simulation|mock|aucun SMS|123456/i.test(bodyPhone),
      bodyPhone.slice(0, 200),
    );
    await shot(page, "batch-a-01b-phone-filled.png");

    await clickText(page, /Continuer|Recevoir/i);
    await page.waitForTimeout(900);
    await shot(page, "batch-a-02-verify.png");
    const bodyVerify = await page.locator("body").innerText();
    check(
      "sim_hint_verify",
      /simulation|aucun SMS|123456|000000/i.test(bodyVerify),
      bodyVerify.slice(0, 240),
    );
    // Use the code the UI discloses (Preview mock=123456; local .env demo=000000)
    const codeMatch = bodyVerify.match(/code\s+(000000|123456)/i);
    const otpCode = codeMatch ? codeMatch[1] : "123456";
    console.log("OTP_CODE", otpCode);

    // OTP digit boxes (testID otp-digit-0..5)
    for (let i = 0; i < 6; i++) {
      const box = page.getByTestId(`otp-digit-${i}`);
      await box.waitFor({ state: "attached", timeout: 10000 });
      await box.click({ force: true });
      await page.keyboard.type(String(otpCode[i]), { delay: 30 });
    }
    await page.waitForTimeout(1000);
    if (await page.getByText(/^Vérifier$/i).count()) {
      await clickText(page, /^Vérifier$/i);
      await page.waitForTimeout(1000);
    }
    await shot(page, "batch-a-03-after-verify.png");

    // Profile — first name
    const after = await page.locator("body").innerText();
    if (/On t'appelle|PRÉNOM|prenom/i.test(after)) {
      const prenom = page.getByPlaceholder(/Sara/i).first();
      await prenom.click({ force: true });
      await prenom.fill("Revue", { force: true });
      const ville = page.getByPlaceholder(/Casablanca/i).first();
      if (await ville.count()) {
        await ville.click({ force: true });
        await ville.fill("Casablanca", { force: true });
      }
      await shot(page, "batch-a-04-profile.png");
      await clickText(page, /^Continuer$/);
      await page.waitForTimeout(900);
    }

    await shot(page, "batch-a-05-role.png");
    const roleText = await page.locator("body").innerText();
    check(
      "role_inclusive",
      /Découvrir à mon rythme/i.test(roleText) &&
        /Rejoindre un club/i.test(roleText) &&
        /Créer un club/i.test(roleText),
      roleText.slice(0, 300),
    );
    check(
      "role_not_runners_only",
      !/Comment tu cours/i.test(roleText) && !/Je cours en solo/i.test(roleText),
      roleText.slice(0, 200),
    );

    await clickText(page, /Découvrir à mon rythme/i);
    await clickText(page, /Continuer/i);
    await page.waitForTimeout(900);
    await shot(page, "batch-a-06-pace.png");
    const paceText = await page.locator("body").innerText();
    check(
      "pace_no_invented_group",
      !/Groupe [A-D]/i.test(paceText) &&
        /optionnel|Passer|allure/i.test(paceText),
      paceText.slice(0, 280),
    );

    await clickText(page, /Passer/i);
    await page.waitForTimeout(900);
    await shot(page, "batch-a-07-goal.png");
    await clickText(page, /Marche & bien-être|Marche/i);
    await clickText(page, /Continuer/i);
    await page.waitForTimeout(900);
    await shot(page, "batch-a-08-permissions.png");
    if (await page.getByText(/Continuer/i).count()) {
      await clickText(page, /Continuer/i);
      await page.waitForTimeout(1000);
    }
    await shot(page, "batch-a-09-welcome.png");
    const welcome = await page.locator("body").innerText();
    check(
      "welcome_no_youssef",
      !/Coach Youssef/i.test(welcome),
      welcome.slice(0, 300),
    );
    check(
      "welcome_no_fake_outing",
      !/12 participants|12 inscrits|séance est déjà programmée|GROUPE D/i.test(
        welcome,
      ),
      welcome.slice(0, 300),
    );
    check(
      "welcome_truthful",
      /Découvrir à mon rythme|Aucun|accueil|réserv/i.test(welcome),
      welcome.slice(0, 300),
    );

    await clickText(page, /Voir l'accueil|Voir l’accueil/i);
    await page.waitForTimeout(1500);
    await shot(page, "batch-a-10-home.png");
    const home = await page.locator("body").innerText();
    check(
      "home_not_onboarding_start",
      !/Commencer[\s\S]{0,40}compte/i.test(home) ||
        /Découvrir|Mes sorties|Clubs|Profil/i.test(home),
      home.slice(0, 250),
    );

    await page.reload({ waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    await shot(page, "batch-a-11-reload-home.png");
    const afterReload = await page.locator("body").innerText();
    check(
      "reload_stays_authed",
      /Découvrir|Mes sorties|Clubs|Profil/i.test(afterReload) &&
        !/^[\s\S]*Sors\. Avec les tiens[\s\S]*Commencer/i.test(afterReload),
      afterReload.slice(0, 250),
    );

    // Mobile viewport role (navigate fresh to role if still authed — skip if hard)
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "batch-a-12-mobile-home.png");

    // PATH 2 — create club screen (direct route after auth from path 1 still in page)
    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE}/onboarding/create-club`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForTimeout(800);
      await shot(page, "batch-a-14-create-club.png");
      const createBody = await page.locator("body").innerText();
      check(
        "create_club_inclusive_copy",
        /membres/i.test(createBody) && !/aux coureurs/i.test(createBody),
        createBody.slice(0, 280),
      );
    } catch (e) {
      check("create_club_inclusive_copy", false, String(e));
    }

    // PATH 3 — join club blocker
    const ctx2 = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page2 = await ctx2.newPage();
    await page2.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
    await page2.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page2.reload({ waitUntil: "networkidle", timeout: 60000 });
    try {
      await page2.goto(`${BASE}/onboarding/club`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page2.waitForTimeout(800);
      await shot(page2, "batch-a-13-join-club.png");
      const joinBody = await page2.locator("body").innerText();
      check(
        "join_no_fake_approval",
        !/approuvé automatiquement|déjà membre confirmé/i.test(joinBody),
        joinBody.slice(0, 280),
      );
      report.blockers.push({
        path: "Rejoindre un club / invite",
        exact:
          "Invite/approval not seeded in Batch A. Without a valid invite code, join cannot be PASSed. Remaining for batch D: invitation create → pending → approval + two-account visibility.",
        ui_excerpt: joinBody.slice(0, 400),
      });
    } catch (e) {
      report.blockers.push({
        path: "Rejoindre un club / invite",
        exact: `Could not fully drive join UI in smoke: ${String(e)}. Product blocker for D unchanged: no invite seed/approval in Batch A.`,
      });
    }
    await ctx2.close();
  } catch (e) {
    console.error("SMOKE_ERROR", e);
    report.error = String(e);
    try {
      await shot(page, "batch-a-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "batch-a-ui-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
