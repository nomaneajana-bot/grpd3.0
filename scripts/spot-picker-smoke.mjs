/**
 * Open organise → spot picker; screenshot redesigned sheet.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

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

const report = { checks: [], summary: {} };
function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 200) });
  console.log(ok ? "PASS" : "FAIL", id);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await login(page);
    await page.goto(`${BASE}/session/create`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    await page.getByTestId("session-spot-field").click({ force: true });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(OUT, "spot-picker-redesign.png"),
      fullPage: true,
    });
    const body = await page.locator("body").innerText();
    check(
      "title_sentence_case",
      /Lieu de rendez-vous/i.test(body) && !/CHOISIR UN SPOT/i.test(body),
      body.slice(0, 120),
    );
    check(
      "no_blue_chrome_copy",
      !/Rechercher un spot|Ajouter un nouveau spot/i.test(body),
      "old copy gone",
    );
    check(
      "has_spots",
      /Marina|Parc|Piste/i.test(body),
      "defaults listed",
    );
    check(
      "picker_present",
      (await page.getByTestId("session-spot-picker").count()) > 0,
      "sheet",
    );

    // Type a new spot → create row appears
    await page.getByTestId("session-spot-custom-input").fill("Corniche Anfa");
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT, "spot-picker-add-row.png"),
      fullPage: true,
    });
    check(
      "create_row_visible",
      (await page.getByTestId("session-spot-custom-add").count()) > 0,
      "add row",
    );
  } finally {
    await browser.close();
  }
  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "spot-picker-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
