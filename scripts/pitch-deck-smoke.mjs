/**
 * Pitch deck smoke — 7 slides load, brand on slide 1, public cold access.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8084";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "pitch-deck",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
  screenshots: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const abs = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: abs, fullPage: false });
  report.screenshots.push(abs);
  return abs;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(`${BASE}/pitch`, { waitUntil: "networkidle", timeout: 90000 });
    await page.getByTestId("pitch-deck").waitFor({ state: "visible", timeout: 45000 });
    check("cold_load_pitch", /\/pitch/.test(page.url()), page.url());

    let body = await page.locator("body").innerText();
    check("slide1_brand_grpd", /\bGRPD\b/.test(body), body.slice(0, 200));
    check("slide1_accroche", /accroche|Casablanca/i.test(body), body.slice(0, 200));
    await shot(page, "pitch-01-accroche");

    const labels = [
      [/problème|compliqué/i, "pitch-02-probleme"],
      [/solution|sans chrono/i, "pitch-03-solution"],
      [/cible|Casa/i, "pitch-04-cible"],
      [/proposition|valeur|feed/i, "pitch-05-valeur"],
      [/crédibilité|vivant/i, "pitch-06-credibilite"],
      [/appel|pilote|avenir/i, "pitch-07-cta"],
    ];

    for (const [re, name] of labels) {
      await page.getByTestId("pitch-next").click({ force: true });
      await page.waitForTimeout(500);
      body = await page.locator("body").innerText();
      check(`slide_${name}`, re.test(body), body.slice(0, 180));
      await shot(page, name);
    }

    check(
      "cta_avenir_present",
      (await page.getByTestId("pitch-cta-avenir").count()) > 0,
      "pitch-cta-avenir",
    );
  } catch (e) {
    check("smoke_error", false, e?.message || String(e));
    await shot(page, "pitch-error").catch(() => {});
  } finally {
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = fail === 0 ? "pass" : "fail";
    fs.writeFileSync(
      path.join(OUT, "pitch-deck-report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary, `fails=${fail}`);
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
