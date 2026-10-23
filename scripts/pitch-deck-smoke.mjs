/**
 * Pitch deck — 7-step structure + GRpD PDF visuals only.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8085";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "pitch-deck-structure",
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

const STEPS = [
  [/L'accroche|déteste courir|WhatsApp/i, "01-accroche"],
  [/Le problème|Apps de perf|fils illisibles/i, "02-probleme"],
  [/La solution|A → D|100% femmes/i, "03-solution"],
  [/La cible|Organisateurs|Casablanca/i, "04-cible"],
  [/proposition de valeur|jamais seul|Strava/i, "05-valeur"],
  [/crédibilité|Partenaires|B2B/i, "06-credibilite"],
  [/appel à l'action|club pilote|Partenariat/i, "07-cta"],
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(`${BASE}/pitch`, { waitUntil: "networkidle", timeout: 90000 });
    await page.getByTestId("pitch-deck").waitFor({ state: "visible", timeout: 45000 });

    for (let i = 0; i < STEPS.length; i++) {
      if (i > 0) {
        await page.getByTestId("pitch-next").click({ force: true });
        await page.waitForTimeout(400);
      }
      const body = await page.locator("body").innerText();
      const [re, name] = STEPS[i];
      check(`slide_${name}`, re.test(body), body.slice(0, 180));
      await shot(page, `pitch-struct-${name}`);
    }
    check("has_images", (await page.locator("img").count()) >= 1, "img");
    check(
      "has_bullets",
      (await page.getByTestId("pitch-bullets").count()) >= 1,
      "bullets",
    );
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
