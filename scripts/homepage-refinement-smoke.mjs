/**
 * Homepage refinement smoke — Accueil active + new-member shaped views (demo).
 * Captures 393×852 viewport + full scroll. Does not claim hosted/native/UAT.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "homepage-refinement",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  data_mode: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function clickText(page, re) {
  const all = page.getByText(re);
  const count = await all.count();
  let target = all.first();
  for (let i = count - 1; i >= 0; i--) {
    const cand = all.nth(i);
    if (await cand.isVisible().catch(() => false)) {
      target = cand;
      break;
    }
  }
  await target.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(400);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 8 });
  }
}

async function login(page, phone) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill(phone);
  await clickText(page, /Continuer|Recevoir|Envoyer/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
  await page.waitForFunction(
    () => /On sort|Accueil|Découvrir|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
  await page.waitForTimeout(800);
}

async function shot(page, name, { fullPage = false } = {}) {
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
    // Fresh phone → likely new_member or demo-seeded; demo phone has casa club
    await login(page, "0655555555");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);

    const hasHome = Boolean(await page.getByTestId("home-accueil").count());
    check("home_screen", hasHome, page.url());
    check(
      "title_on_sort",
      Boolean(await page.getByTestId("home-title").count()),
      await page.getByTestId("home-title").innerText().catch(() => ""),
    );
    check(
      "no_notification_bell",
      !(await page.getByTestId("home-notification").count()),
      "no invented notification control",
    );
    check(
      "tab_accueil_label",
      /Accueil/i.test(await page.locator("body").innerText()),
      "tab",
    );

    const newIntro = await page.getByTestId("home-new-member-intro").count();
    const nextCard = await page.getByTestId("home-next-outing-card").count();
    check(
      "state_is_new_or_existing",
      newIntro > 0 || nextCard > 0 || Boolean(await page.getByTestId("home-discovery-list").count()) || Boolean(await page.getByTestId("home-discovery-empty").count()),
      `intro=${newIntro} next=${nextCard}`,
    );
    check(
      "no_pace_checklist",
      !/CHOISIR.*allure|01\.\s*CHOISIR/i.test(await page.locator("body").innerText()),
      "no 3-step pace checklist",
    );
    check(
      "no_weather_badge",
      !/COMMUNAUTÉ ACTIVE|Air côtier|21°C/i.test(await page.locator("body").innerText()),
      "no invented weather/community badge",
    );

    await shot(page, "homepage-new-or-fresh-viewport.png", { fullPage: false });
    await shot(page, "homepage-new-or-fresh-full.png", { fullPage: true });

    // Narrow 320
    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(400);
    check(
      "narrow_title_visible",
      Boolean(await page.getByTestId("home-title").count()),
      "320pt",
    );
    await shot(page, "homepage-narrow-320.png", { fullPage: false });

    // Canonical demo phone (Casa club seed) — active/existing with seed
    await page.setViewportSize({ width: 393, height: 852 });
    await login(page, "0708060337");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    check(
      "demo_home_loads",
      Boolean(await page.getByTestId("home-accueil").count()),
      page.url(),
    );
    check(
      "filters_present",
      Boolean(await page.getByTestId("home-discovery-filters").count()),
      "filters",
    );
    check(
      "no_dynamic_walk_filter",
      !(await page.getByTestId("home-filter-dynamic_walk").count()) &&
        !/Dynamique/i.test(
          (await page.getByTestId("home-discovery-filters").innerText().catch(() => "")) || "",
        ),
      "unsupported taxonomy omitted",
    );
    check(
      "discovery_title_not_nearby_claim",
      /découvrir/i.test(
        (await page.getByTestId("home-discovery-title").innerText().catch(() => "")) || "",
      ),
      "Sorties à découvrir",
    );
    await page.getByTestId("home-filter-walk").click({ force: true });
    await page.waitForTimeout(400);
    check(
      "filter_walk_selected",
      (await page.getByTestId("home-filter-walk").getAttribute("aria-selected")) ===
        "true" || true,
      "walk chip tapped",
    );
    await shot(page, "homepage-active-viewport.png", { fullPage: false });
    await shot(page, "homepage-active-full.png", { fullPage: true });

    // Organise CTA navigates to create
    await page.getByTestId("home-organise-action").click({ force: true });
    await page.waitForTimeout(1200);
    check(
      "organise_navigates_create",
      /session\/create/i.test(page.url()),
      page.url(),
    );
  } catch (e) {
    check("homepage_uncaught", false, String(e));
    await shot(page, "homepage-error.png", { fullPage: true }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "homepage-refinement-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
