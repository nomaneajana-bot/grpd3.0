/**
 * Mes Sorties Stito smoke — tabs, empty/confirmed paths, cancel modal chrome.
 * Demo web only — not native/hosted/UAT.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "mes-sorties-stito",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  data_mode: "demo",
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
    () => /On sort|Accueil|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
  await page.waitForTimeout(600);
}

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log("SHOT", p);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  try {
    await login(page, "0708060337");
    await page.goto(`${BASE}/my-sessions`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);

    check(
      "mes_sorties_screen",
      Boolean(await page.getByTestId("mes-sorties").count()),
      page.url(),
    );
    check(
      "title_stito",
      /Mes Sorties & Réservations/i.test(await page.locator("body").innerText()),
      "headline",
    );
    check(
      "tabs_present",
      Boolean(await page.getByTestId("mes-sorties-tab-upcoming").count()) &&
        Boolean(await page.getByTestId("mes-sorties-tab-pending").count()) &&
        Boolean(await page.getByTestId("mes-sorties-tab-past").count()),
      "À venir / En attente / Passées",
    );
    check(
      "no_cancel_preview_chrome",
      !/Aperçu · Fiche d'annulation/i.test(await page.locator("body").innerText()),
      "prototype preview omitted",
    );
    check(
      "no_dynamic_walk",
      !/M\.\s*dynamique|Dynamique/i.test(await page.locator("body").innerText()),
      "taxonomy omitted",
    );

    await shot(page, "mes-sorties-upcoming-viewport.png");

    await page.getByTestId("mes-sorties-tab-past").click({ force: true });
    await page.waitForTimeout(400);
    check(
      "past_tab",
      /Sorties passées/i.test(await page.locator("body").innerText()),
      "past",
    );
    await shot(page, "mes-sorties-past-viewport.png");

    await page.getByTestId("mes-sorties-tab-upcoming").click({ force: true });
    await page.waitForTimeout(400);

    // Join an outing then return so confirmed card + cancel modal can be exercised
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const row = page.locator('[data-testid^="home-outing-row-"]').first();
    if (await row.count()) {
      await row.click({ force: true });
      await page.waitForTimeout(1000);
      const join = page.getByText(/M'inscrire à cette sortie/i);
      if (await join.count()) {
        await join.last().click({ force: true });
        await page.waitForTimeout(1200);
      }
    }
    await page.goto(`${BASE}/my-sessions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const confirmed = await page.locator('[data-testid^="mes-sorties-confirmed-"]').count();
    check("confirmed_after_join", confirmed > 0, `count=${confirmed}`);
    await shot(page, "mes-sorties-confirmed-viewport.png");

    if (confirmed > 0) {
      await page.locator('[data-testid^="mes-sorties-desist-"]').first().click({ force: true });
      await page.waitForTimeout(500);
      check(
        "cancel_modal",
        Boolean(await page.getByTestId("mes-sorties-cancel-modal").count()),
        "modal",
      );
      await shot(page, "mes-sorties-cancel-modal.png");
      await page.getByTestId("mes-sorties-cancel-keep").click({ force: true });
      await page.waitForTimeout(300);
    }

    // Narrow
    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(300);
    await shot(page, "mes-sorties-narrow-320.png");
    check(
      "narrow_ok",
      Boolean(await page.getByTestId("mes-sorties").count()),
      "320",
    );
  } catch (e) {
    check("uncaught", false, String(e));
    await page.screenshot({ path: path.join(OUT, "mes-sorties-error.png"), fullPage: true }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(path.join(OUT, "mes-sorties-stito-smoke.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
