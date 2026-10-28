/**
 * Club settings — multi-select / smart assign to colour groups.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts/club-multi-assign";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  feature: "club-multi-assign",
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

    await page.goto(`${BASE}/club/settings`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForSelector('[data-testid="club-settings-form"]', {
      timeout: 20000,
    });
    await page.waitForTimeout(600);

    // Scroll assign section into view
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="assign-members-roster"]');
      el?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForTimeout(400);

    check(
      "multi_toggle_visible",
      (await page.getByTestId("assign-multi-toggle").count()) > 0,
      "Sélectionner",
    );
    check(
      "filter_row_visible",
      (await page.getByTestId("assign-filter-row").count()) > 0,
      "filters",
    );

    const smart = page.getByTestId("assign-unassigned-smart");
    const hasSmart = (await smart.count()) > 0;
    check("smart_unassigned_cta", hasSmart, "Affecter les N sans groupe");
    await shot(page, "01-assign-section");

    if (hasSmart) {
      await smart.click({ force: true });
      await page.waitForTimeout(700);
      check(
        "batch_sheet_from_smart",
        /membres|AFFECTER/i.test(await page.locator("body").innerText()),
        "sheet open",
      );
      await shot(page, "02-smart-batch-sheet");

      // Pick Gris group if present
      const gris = page.getByTestId("assign-group-g_casa_gris");
      if ((await gris.count()) > 0) {
        await gris.click({ force: true });
        await page.waitForTimeout(1200);
        check(
          "smart_batch_applied",
          (await page.getByTestId("assign-batch-bar").count()) === 0,
          "selection cleared after assign",
        );
        await shot(page, "03-after-smart-assign");
      } else {
        // Cancel sheet and fall through to manual multi
        await page.getByText(/^Annuler$/i).last().click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    // Manual multi-select path
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="assign-members-roster"]')
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForTimeout(300);

    // Ensure multi mode
    const toggle = page.getByTestId("assign-multi-toggle");
    const toggleLabel = await toggle.innerText();
    if (/Sélectionner/i.test(toggleLabel)) {
      await toggle.click({ force: true });
      await page.waitForTimeout(300);
    }
    check(
      "multi_mode_on",
      /Terminer/i.test(await toggle.innerText()),
      await toggle.innerText(),
    );

    await page.getByTestId("assign-filter-all").click({ force: true });
    await page.waitForTimeout(200);
    await page.getByTestId("assign-select-visible").click({ force: true });
    await page.waitForTimeout(400);

    const bar = page.getByTestId("assign-batch-bar");
    check("batch_bar_visible", (await bar.count()) > 0, "bar");
    await shot(page, "04-multi-selected-bar");

    await page.getByTestId("assign-batch-open").click({ force: true });
    await page.waitForTimeout(600);
    await shot(page, "05-batch-sheet");

    // Assign to Vert
    const vert = page.getByTestId("assign-group-g_casa_vert");
    if ((await vert.count()) > 0) {
      await vert.click({ force: true });
      await page.waitForTimeout(1400);
      check(
        "batch_assign_done",
        (await page.getByTestId("assign-batch-bar").count()) === 0 &&
          /Terminer|Sélectionner/i.test(
            await page.getByTestId("assign-multi-toggle").innerText(),
          ),
        "exited multi after batch",
      );
      await shot(page, "06-after-batch");
    } else {
      check("batch_assign_done", false, "vert group missing");
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const vids = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
  if (vids[0]) {
    fs.renameSync(
      path.join(OUT, vids[0]),
      path.join(OUT, "multi-assign-walkthrough.webm"),
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
