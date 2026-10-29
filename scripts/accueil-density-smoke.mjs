/**
 * Accueil density — next outing compact + discovery higher (demo web).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "accueil-density",
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

    const home = page.getByTestId("home-accueil");
    check("home_accueil", Boolean(await home.count()), "Accueil");

    const nextCard = page.getByTestId("home-next-outing-card");
    const hasNext = Boolean(await nextCard.count());
    check("next_outing_present", hasNext, "Ta prochaine sortie");

    if (hasNext) {
      const box = await nextCard.first().boundingBox();
      report.metrics.nextCard = box;
      const h = box?.height ?? 999;
      // Was ~187px; target denser but still readable.
      check(
        "next_card_compact",
        h > 90 && h <= 155,
        `height=${Math.round(h)} (was ~187)`,
      );
    }

    const discovery = page.getByTestId("home-discovery-title").locator("visible=true").first();
    check(
      "discovery_title",
      /découvrir/i.test((await discovery.innerText().catch(() => "")) || ""),
      await discovery.innerText().catch(() => ""),
    );
    const discBox = await discovery.boundingBox();
    report.metrics.discoveryTitle = discBox;
    // Previously discovery section started ~511; aim for first viewport.
    check(
      "discovery_higher",
      (discBox?.y ?? 999) < 420,
      `discoveryTitle.y=${Math.round(discBox?.y ?? -1)}`,
    );

    // Measure discovery row before any scroll.
    const firstRow = page
      .locator('[data-testid^="home-outing-row-"]')
      .locator("visible=true")
      .first();
    if (await firstRow.count()) {
      const rowBox = await firstRow.boundingBox();
      report.metrics.firstDiscoveryRow = rowBox;
      check(
        "first_discovery_in_viewport",
        (rowBox?.y ?? 999) > 0 && (rowBox?.y ?? 999) < 820,
        `row.y=${Math.round(rowBox?.y ?? -1)}`,
      );
      check(
        "discovery_block_early",
        (rowBox?.y ?? 999) > 0 && (rowBox?.y ?? 999) < 480,
        `first row y=${Math.round(rowBox?.y ?? -1)} (was discovery@~511)`,
      );
    }

    await shot(page, "accueil-density-viewport.png", false);

    const organise = page
      .getByTestId("home-organise-action")
      .locator("visible=true")
      .first();
    check("organise_present", Boolean(await organise.count()), "Organiser");
    const orderOk = await page.evaluate(() => {
      const next = document.querySelector('[data-testid="home-next-outing-card"]');
      const disc = [...document.querySelectorAll('[data-testid="home-discovery-title"]')].find(
        (el) => el.getClientRects().length,
      );
      const org = [...document.querySelectorAll('[data-testid="home-organise-action"]')].find(
        (el) => el.getClientRects().length,
      );
      if (!next || !disc || !org) return false;
      const follows = (a, b) =>
        !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return follows(next, disc) && follows(disc, org);
    });
    check("dom_order_next_discovery_organise", orderOk, "next → discovery → organise");

    await organise.scrollIntoViewIfNeeded().catch(() => {});
    report.metrics.organise = await organise.boundingBox().catch(() => null);

    await shot(page, "accueil-density-full.png", true);

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
