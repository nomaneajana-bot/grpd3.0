/**
 * Preview share links must land on Accueil, not stuck on onboarding.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "demo-link-entry",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function assertHome(page, label) {
  await page.waitForFunction(
    () =>
      /On sort|Découvrir|Mes sorties|Clubs|Profil|ACCUEIL/i.test(
        document.body?.innerText || "",
      ) && !/Commencer[\s\S]{0,40}J'ai déjà un compte/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
  const body = await page.locator("body").innerText();
  const url = page.url();
  check(
    `${label}_not_onboarding`,
    !/Commencer/i.test(body) || /On sort|Découvrir|ACCUEIL/i.test(body),
    url + " · " + body.slice(0, 100),
  );
  check(
    `${label}_reached_app`,
    /On sort|Découvrir|Mes sorties|Clubs|Profil|ACCUEIL/i.test(body),
    body.slice(0, 120),
  );
  await page.screenshot({
    path: path.join(OUT, `demo-link-${label}.png`),
    fullPage: true,
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    // Fresh profile — like sending the link to phone Chrome
    const pageDemo = await context.newPage();
    await pageDemo.goto(`${BASE}/demo`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await assertHome(pageDemo, "demo");

    const pageRoot = await context.newPage();
    await pageRoot.goto(`${BASE}/`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await assertHome(pageRoot, "root");
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "demo-link-entry-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
