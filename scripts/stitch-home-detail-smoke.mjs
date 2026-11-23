/**
 * Stitch Accueil + Détail smoke via /demo entry (DEMO_MODE static build).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "stitch-home-detail",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

async function shot(page, name, fullPage = false) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage });
  console.log("SHOT", p);
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
      { timeout: 45000 },
    );
    await page.waitForTimeout(800);

    check(
      "home_title",
      Boolean(await page.getByTestId("home-title").count()),
      await page.getByTestId("home-title").innerText().catch(() => ""),
    );
    check(
      "greeting_sub",
      /avec les tiens/i.test(await page.locator("body").innerText()),
      "Cette semaine, avec les tiens.",
    );
    check(
      "no_search_field",
      !(await page.getByTestId("home-search").count()),
      "search removed per Stitch",
    );
    check(
      "organise_row",
      Boolean(await page.getByTestId("home-organise-action").count()),
      "organiser",
    );
    check(
      "filters",
      Boolean(await page.getByTestId("home-discovery-filters").count()),
      "Tout/Course/Marche",
    );
    check(
      "discovery_title",
      /découvrir/i.test(
        (await page
          .getByTestId("home-discovery-title")
          .first()
          .innerText()
          .catch(() => "")) || "",
      ),
      "Sorties à découvrir",
    );

    await shot(page, "stitch-accueil-viewport.png", false);
    await shot(page, "stitch-accueil-full.png", true);

    // Open next outing or first discovery row
    const nextCta = page.getByTestId("home-next-outing-cta");
    const nextCard = page.getByTestId("home-next-outing-card");
    if (await nextCard.count()) {
      await nextCard.first().click({ force: true });
    } else if (await nextCta.count()) {
      await nextCta.first().click({ force: true });
    } else {
      const row = page.locator('[data-testid^="home-outing-row-"]').first();
      await row.click({ force: true });
    }
    await page.waitForTimeout(1200);
    await page.waitForFunction(
      () => Boolean(document.querySelector('[data-testid="stito-outing-hero"]')),
      { timeout: 20000 },
    );

    check(
      "detail_hero",
      Boolean(await page.getByTestId("stito-outing-hero").count()),
      "hero",
    );
    check(
      "detail_nav",
      /détail/i.test(
        (await page.getByTestId("session-detail-nav-title").innerText().catch(() => "")) ||
          "",
      ),
      await page.getByTestId("session-detail-nav-title").innerText().catch(() => ""),
    );
    check(
      "detail_logistics",
      Boolean(await page.getByTestId("stito-logistics-card").count()),
      "Quand/Où",
    );
    check(
      "detail_host",
      Boolean(await page.getByTestId("stito-host-card").count()),
      "host",
    );
    check(
      "detail_access",
      Boolean(await page.getByTestId("stito-access-note").count()),
      "accès",
    );
    check(
      "detail_purpose",
      Boolean(await page.getByTestId("stito-purpose-section").count()),
      "esprit",
    );
    check(
      "detail_participants",
      Boolean(await page.getByTestId("stito-participants-card").count()),
      "participants",
    );
    check(
      "detail_rsvp",
      Boolean(await page.getByTestId("stito-sticky-join").count()) ||
        Boolean(await page.getByTestId("session-delete-btn").count()),
      "rsvp or delete",
    );

    const heroText = await page.getByTestId("stito-outing-hero").innerText();
    check(
      "hero_has_access_or_type",
      /ouverte|réservée|marche|course|footing|séries|fartlek/i.test(heroText),
      heroText.slice(0, 120),
    );

    await shot(page, "stitch-detail-viewport.png", false);
    await shot(page, "stitch-detail-full.png", true);

    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(400);
    await shot(page, "stitch-detail-narrow-320.png", false);
  } catch (e) {
    check("uncaught", false, String(e));
    await shot(page, "stitch-smoke-error.png", true).catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
    };
    fs.writeFileSync(
      path.join(OUT, "stitch-home-detail-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
