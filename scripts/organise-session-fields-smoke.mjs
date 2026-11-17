/**
 * Verify organise form shows Titre / Objectif / Structure for every session mode
 * (not only Marche).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  base: BASE,
  tested_at: new Date().toISOString(),
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 240) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log("SHOT", p);
  return p;
}

async function clickTestId(page, id) {
  const all = page.getByTestId(id);
  const count = await all.count();
  let target = all.first();
  for (let i = 0; i < count; i++) {
    const cand = all.nth(i);
    if (await cand.isVisible().catch(() => false)) {
      target = cand;
      break;
    }
  }
  await target.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(500);
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
    const box = page.getByTestId(`otp-digit-${i}`);
    await box.click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 15 });
  }
  await page.waitForTimeout(600);
}

async function loginDemoHost(page) {
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
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  const phone = page.getByTestId("phone-input");
  await phone.click({ force: true });
  await phone.fill("");
  await phone.fill("0611111111");
  await clickText(page, /Continuer|Suivant|Envoyer/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {
    /* auto-advance */
  }
  await page.waitForFunction(
    () =>
      /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
  await page.waitForTimeout(600);
}

async function assertModeFields(page, modeLabel, shotName) {
  await clickText(page, new RegExp(`^${modeLabel}$`, "i"));
  await page.waitForTimeout(400);
  await shot(page, shotName);
  const title = await page.getByTestId("session-title-input").count();
  const purpose = await page.getByTestId("session-purpose-input").count();
  const structure = await page.getByTestId("session-structure-input").count();
  const block = await page.getByTestId("session-detail-fields").count();
  const titleVisible = await page
    .getByTestId("session-title-input")
    .first()
    .isVisible()
    .catch(() => false);
  const langToggle = await page.getByTestId("session-language-toggle").count();
  check(`${modeLabel}_detail_block`, block > 0, `block=${block}`);
  check(`${modeLabel}_title`, title > 0 && titleVisible, `title=${title} visible=${titleVisible}`);
  check(`${modeLabel}_purpose`, purpose > 0, `purpose=${purpose}`);
  check(`${modeLabel}_structure`, structure > 0, `structure=${structure}`);
  check(`${modeLabel}_no_language_toggle`, langToggle === 0, `langToggle=${langToggle}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await loginDemoHost(page);
    await page.goto(`${BASE}/session/create`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1200);
    await shot(page, "organise-fields-00-create.png");

    const body = await page.locator("body").innerText();
    const onCreate = /TYPE DE SÉANCE|Créer une séance/i.test(body);
    check("create_screen", onCreate, body.slice(0, 200));

    if (onCreate) {
      await assertModeFields(
        page,
        "Workout structuré",
        "organise-fields-workout.png",
      );
      await assertModeFields(page, "Course libre", "organise-fields-libre.png");
      await assertModeFields(
        page,
        "Découverte",
        "organise-fields-decouverte.png",
      );
      await assertModeFields(page, "Marche", "organise-fields-marche.png");
    }
  } finally {
    await browser.close();
  }

  const pass = report.checks.filter((c) => c.ok).length;
  const fail = report.checks.filter((c) => !c.ok).length;
  report.summary = { pass, fail };
  fs.writeFileSync(
    path.join(OUT, "organise-session-fields-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
