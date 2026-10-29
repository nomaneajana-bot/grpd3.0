/**
 * Accueil density — discovery first + pinned next-outing dock (demo web).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "accueil-density-dock",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
  metrics: {},
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 180));
}

async function shot(page, name, fullPage = false) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage });
  console.log("SHOT", p);
  return p;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
  });
  try {
    await page.goto(`${BASE}/demo`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForFunction(
      () => /On sort \?/i.test(document.body?.innerText || ""),
      { timeout: 60000 },
    );
    await page.waitForTimeout(1000);

    check(
      "home_accueil",
      Boolean(await page.getByTestId("home-accueil").count()),
      "Accueil",
    );

    const discovery = page
      .getByTestId("home-discovery-title")
      .locator("visible=true")
      .first();
    check(
      "discovery_title",
      /découvrir/i.test((await discovery.innerText().catch(() => "")) || ""),
      await discovery.innerText().catch(() => ""),
    );
    const discBox = await discovery.boundingBox();
    report.metrics.discoveryTitle = discBox;
    // Discovery immediately under header (no feed next-outing card).
    check(
      "discovery_near_top",
      (discBox?.y ?? 999) < 220,
      `discoveryTitle.y=${Math.round(discBox?.y ?? -1)}`,
    );

    const firstRow = page
      .locator('[data-testid^="home-outing-row-"]')
      .locator("visible=true")
      .first();
    if (await firstRow.count()) {
      const rowBox = await firstRow.boundingBox();
      report.metrics.firstDiscoveryRow = rowBox;
      check(
        "first_discovery_early",
        (rowBox?.y ?? 999) > 0 && (rowBox?.y ?? 999) < 360,
        `row.y=${Math.round(rowBox?.y ?? -1)}`,
      );
    }

    const dock = page
      .getByTestId("home-next-outing-dock")
      .locator("visible=true")
      .first();
    const hasDock = Boolean(await dock.count());
    check("next_dock_present", hasDock, "pinned dock");

    if (hasDock) {
      const dockBox = await dock.boundingBox();
      report.metrics.dock = dockBox;
      const card = page
        .getByTestId("home-next-outing-card")
        .locator("visible=true")
        .first();
      const cardBox = await card.boundingBox();
      report.metrics.nextCard = cardBox;
      check(
        "dock_compact",
        (cardBox?.height ?? 999) > 40 && (cardBox?.height ?? 999) <= 90,
        `collapsed height=${Math.round(cardBox?.height ?? -1)}`,
      );
      check(
        "dock_pinned_bottom",
        (dockBox?.y ?? 0) > 600,
        `dock.y=${Math.round(dockBox?.y ?? -1)}`,
      );
      check(
        "dock_below_discovery",
        (dockBox?.y ?? 0) > (discBox?.y ?? 999),
        "dock under discovery",
      );

      // Expand peek
      await page.getByTestId("home-next-outing-expand").locator("visible=true").first().click();
      await page.waitForTimeout(400);
      const expanded = page
        .getByTestId("home-next-outing-expanded")
        .locator("visible=true")
        .first();
      check(
        "dock_expands",
        Boolean(await expanded.count()),
        "expanded meta + CTA",
      );
      await shot(page, "accueil-dock-expanded.png", false);

      await page.getByTestId("home-next-outing-cta").locator("visible=true").first().click();
      await page.waitForTimeout(1200);
      const onDetail = await page.evaluate(
        () =>
          Boolean(document.querySelector('[data-testid="stito-outing-hero"]')) ||
          /détail/i.test(document.body?.innerText || ""),
      );
      check("dock_opens_detail", onDetail, "session detail");
    }

    // Back for top viewport shot if still on detail
    if ((await page.url()).includes("/session/")) {
      await page.goBack({ waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(800);
    }
    await shot(page, "accueil-density-viewport.png", false);
    await shot(page, "accueil-dock-full.png", true);

    const failed = report.checks.filter((c) => !c.ok).length;
    report.ok = failed === 0;
    fs.writeFileSync(
      path.join(OUT, "accueil-density-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report.metrics, null, 2));
    console.log(failed === 0 ? "ALL PASS" : `FAILED ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
