/**
 * Pitch deck smoke — PDF visuals, "déteste courir" hook, no structure titles.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8085";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "pitch-deck-pdf-assets",
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
    let body = await page.locator("body").innerText();
    check("hook_deteste", /déteste courir|DETESTE COURIR/i.test(body), body.slice(0, 200));
    check("no_structure_labels", !/L'ACCROCHE|LE PROBLÈME|LA SOLUTION|LA CIBLE/i.test(body), "ok");
    check("has_images", (await page.locator("img").count()) >= 1, "img");
    await shot(page, "pitch-pdf-01-hook");
    for (let i = 2; i <= 7; i++) {
      await page.getByTestId("pitch-next").click({ force: true });
      await page.waitForTimeout(400);
      await shot(page, `pitch-pdf-0${i}`);
    }
  } catch (e) {
    check("smoke_error", false, e?.message || String(e));
  } finally {
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = fail === 0 ? "pass" : "fail";
    fs.writeFileSync(path.join(OUT, "pitch-deck-report.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary, `fails=${fail}`);
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
