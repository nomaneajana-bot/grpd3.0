/**
 * Club group detail — Stito light, no Changer pill clutter.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts/club-group-detail-light";
const CLUB = "club_casa_running";
const GROUP = "g_casa_rouge";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  feature: "club-group-detail-light",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

async function shot(page, name) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: false,
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/demo`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForFunction(
      () => /On sort|ACCUEIL|Clubs/i.test(document.body?.innerText || ""),
      { timeout: 45000 },
    );

    await page.goto(
      `${BASE}/club/group-detail?clubId=${CLUB}&groupId=${GROUP}`,
      { waitUntil: "networkidle", timeout: 90000 },
    );
    await page.waitForSelector('[data-testid="club-group-detail-title"]', {
      timeout: 20000,
    });
    await page.waitForTimeout(700);

    const title = await page.getByTestId("club-group-detail-title").innerText();
    const meta = await page
      .getByTestId("club-group-detail-meta")
      .innerText()
      .catch(() => "");
    const body = await page.locator("body").innerText();

    check("title_rouge", /Rouge/i.test(title), title);
    check("meta_has_count", /\d+\s+membre/i.test(meta), meta);
    check("meta_has_note", /Sub|4:45/i.test(meta), meta);
    check(
      "no_note_stat_card",
      !/\bNOTE\b/.test(body),
      "NOTE label removed from layout",
    );
    check("no_changer_pills", !/\bChanger\b/.test(body), body.slice(0, 120));
    check(
      "settings_text_link",
      /Affecter depuis Paramètres du club/i.test(body),
      "link present",
    );

    const bg = await page.evaluate(() => {
      const el =
        document.querySelector('[data-testid="club-group-detail-scroll"]')
          ?.parentElement || document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
    const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    check("light_canvas", lum > 0.55, `bg=${bg} lum=${lum.toFixed(2)}`);

    await shot(page, "01-group-detail-light");

    const change = page.locator('[data-testid^="club-group-member-change-"]').first();
    if (await change.isVisible().catch(() => false)) {
      await change.click({ force: true });
      await page.waitForTimeout(800);
      const sheetBody = await page.locator("body").innerText();
      check(
        "assign_sheet_opens",
        /AFFECTER|Choisis un groupe|Sans groupe/i.test(sheetBody),
        sheetBody.slice(0, 120),
      );
      await shot(page, "02-assign-sheet");
    } else {
      check("assign_sheet_opens", false, "no change row");
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const vids = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
  if (vids[0]) {
    fs.renameSync(
      path.join(OUT, vids[0]),
      path.join(OUT, "group-detail-walkthrough.webm"),
    );
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(path.join(OUT, "smoke.json"), JSON.stringify(report, null, 2));
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
