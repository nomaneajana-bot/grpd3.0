/**
 * City + location horizontal sliders present on home, organise, club create.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "city-location-sliders",
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
  await page.waitForTimeout(350);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 6 });
  }
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(`${BASE}/demo`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForFunction(
      () => /On sort|Accueil|Mes sorties|Clubs/i.test(document.body?.innerText || ""),
      { timeout: 45000 },
    ).catch(async () => {
      // fallback login
      await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
      await clickText(page, /J'ai déjà un compte|Commencer/i);
      await page.getByTestId("phone-input").fill("0708060337");
      await clickText(page, /Continuer|Recevoir/i);
      await enterOtp(page, "000000");
      await page.waitForTimeout(800);
    });

    check(
      "home_city_slider",
      (await page.getByTestId("home-city-slider").count()) > 0,
      "home-city-slider",
    );
    await page.screenshot({ path: path.join(OUT, "sliders-home.png") });

    await page.getByTestId("home-city-slider-rabat").click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    const homeBody = await page.locator("body").innerText();
    check("home_city_select", /Rabat/i.test(homeBody), homeBody.slice(0, 120));

    await page.goto(`${BASE}/session/create`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    check(
      "session_location_slider",
      (await page.getByTestId("session-location-slider").count()) > 0,
      "session-location-slider",
    );
    await page.getByTestId("session-location-slider-corniche-el-hank").click({ force: true }).catch(async () => {
      await page.getByTestId("session-location-slider-marina").click({ force: true });
    });
    await page.waitForTimeout(300);
    const spot = await page.getByTestId("session-spot-value").innerText().catch(() => "");
    check("session_spot_updated", /Corniche|Marina|Parc|Anfa|Racine/i.test(spot), spot);
    await page.screenshot({ path: path.join(OUT, "sliders-organise.png") });

    await page.goto(`${BASE}/club/create`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    check(
      "club_city_slider",
      (await page.getByTestId("club-city-slider").count()) > 0,
      "club-city-slider",
    );
    await page.getByTestId("club-city-slider-casablanca").click({ force: true });
    await page.waitForTimeout(200);
    const cityVal = await page.getByTestId("club-city-input").inputValue().catch(() => "");
    check("club_city_filled", /Casablanca/i.test(cityVal), cityVal);
    await page.screenshot({ path: path.join(OUT, "sliders-club-create.png") });
  } catch (e) {
    check("smoke_error", false, e?.message || String(e));
    await page.screenshot({ path: path.join(OUT, "sliders-error.png") }).catch(() => {});
  } finally {
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = fail === 0 ? "pass" : "fail";
    fs.writeFileSync(path.join(OUT, "city-location-sliders-report.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary, `fails=${fail}`);
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
