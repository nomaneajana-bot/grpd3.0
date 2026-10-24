/**
 * Pitch deck — human copy + structure + business model + GRpD PDF visuals.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8085";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "pitch-deck-business-model",
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
  [/déteste courir|franchement/i, "01-accroche"],
  [/WhatsApp|annules|survivre à une appli/i, "02-probleme"],
  [/on sort ensemble|chez-soi/i, "03-solution"],
  [/vraie bande|Casa/i, "04-cible"],
  [/excuse pour se retrouver|likes/i, "05-valeur"],
  [/Gratuit pour sortir|marques et événements|outils/i, "06-business"],
  [/pas une idée|partenaires de terrain/i, "07-credibilite"],
  [/prochain tour|pilote/i, "08-cta"],
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

    const first = await page.locator("body").innerText();
    check("eight_slides", /\/\s*08/.test(first), first.slice(0, 80));

    for (let i = 0; i < STEPS.length; i++) {
      if (i > 0) {
        await page.getByTestId("pitch-next").click({ force: true });
        await page.waitForTimeout(400);
      }
      const body = await page.locator("body").innerText();
      const [re, name] = STEPS[i];
      check(`slide_${name}`, re.test(body), body.slice(0, 200));
      await shot(page, `pitch-biz-${name}`);
    }
    check("has_bullets", (await page.getByTestId("pitch-bullets").count()) >= 1, "ok");
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
