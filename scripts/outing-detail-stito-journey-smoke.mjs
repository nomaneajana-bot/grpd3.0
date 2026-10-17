/**
 * Outing detail Stito journey — detail → join → Mes sorties → cancel → reload.
 * Asserts exact outing identity/state. Demo web only — not hosted/native/UAT.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts/outing-detail-compare";
const REPO_EV = "docs/audit/outing-detail-stito";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REPO_EV, { recursive: true });

const report = {
  batch: "outing-detail-stito-journey",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  data_mode: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  viewport: "393x852",
  checks: [],
  journey: {},
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
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

async function shot(page, name, { fullPage = false } = {}) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage });
  fs.copyFileSync(p, path.join(REPO_EV, name));
  console.log("SHOT", p);
  return p;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  try {
    await login(page, "0708060337");

    // Homepage evidence (preserve Accueil tip)
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    check("homepage_on_sort", Boolean(await page.getByTestId("home-title").count()), "On sort ?");
    await shot(page, "current-homepage-393.png");

    // Open first discovery outing
    const row = page.locator('[data-testid^="home-outing-row-"]').first();
    check("discovery_row", (await row.count()) > 0, "has discovery");
    const rowId = await row.getAttribute("data-testid");
    const sessionId = rowId?.replace("home-outing-row-", "") || "";
    report.journey.sessionId = sessionId;
    await row.click({ force: true });
    await page.waitForTimeout(1400);
    check("detail_url", new RegExp(`/session/${sessionId}`).test(page.url()), page.url());

    const title = (await page.getByTestId("session-detail-title").innerText().catch(() => "")).trim();
    report.journey.title = title;
    check("detail_title", Boolean(title), title);
    check("stito_hero", Boolean(await page.getByTestId("stito-outing-hero").count()), "hero");
    check("stito_logistics", Boolean(await page.getByTestId("stito-logistics-card").count()), "logistics");
    check("stito_host", Boolean(await page.getByTestId("stito-host-card").count()), "host");
    check("stito_purpose", Boolean(await page.getByTestId("stito-purpose-section").count()), "purpose");
    check("stito_participants", Boolean(await page.getByTestId("stito-participants-card").count()), "participants");
    check("stito_sticky", Boolean(await page.getByTestId("stito-sticky-join").count()), "sticky");
    check(
      "no_fake_map_modal_chrome",
      !/Ouvrir dans Maps|Point de rassemblement GPS|Anfa Park Casablanca \(33/i.test(
        await page.locator("body").innerText(),
      ),
      "no fake map UI",
    );
    check(
      "no_vip_verified_badge",
      !/verified|VIP|Édition crépuscule/i.test(await page.locator("body").innerText()),
      "no invented badges",
    );
    await shot(page, "current-outing-detail-393.png");

    // Join
    const joinCta = page.getByTestId("stito-join-cta");
    await joinCta.click({ force: true });
    await page.waitForTimeout(1800);
    // Pace-group path may need InterGroup panel — try classic join text too
    if (!(await page.getByText(/inscrit|Place réservée|Se désister/i).count())) {
      const alt = page.getByText(/M'inscrire à cette sortie|Rejoindre/i);
      if (await alt.count()) {
        await alt.last().click({ force: true });
        await page.waitForTimeout(1500);
      }
    }
    // Confirm join via sticky label or leave modal available path
    const bodyAfterJoin = await page.locator("body").innerText();
    const joinedUi =
      /Se désister|Place réservée|Tu es inscrit|Inscription enregistrée|Confirmé/i.test(
        bodyAfterJoin,
      );
    check("joined_on_detail", joinedUi, "joined UI");
    report.journey.joinedOnDetail = joinedUi;
    await shot(page, "current-outing-detail-joined-393.png");

    // Mes sorties — confirmed card for same id
    await page.goto(`${BASE}/my-sessions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    check("mes_sorties_screen", Boolean(await page.getByTestId("mes-sorties").count()), "mes");
    const confirmed = page.getByTestId(`mes-sorties-confirmed-${sessionId}`);
    check(
      "mes_sorties_same_outing",
      (await confirmed.count()) > 0,
      `confirmed-${sessionId}`,
    );
    await shot(page, "current-mes-sorties-confirmed-393.png");

    // Cancel from Mes sorties
    if (await confirmed.count()) {
      await page.getByTestId(`mes-sorties-desist-${sessionId}`).click({ force: true });
      await page.waitForTimeout(500);
      check(
        "cancel_modal",
        Boolean(await page.getByTestId("mes-sorties-cancel-modal").count()),
        "modal",
      );
      await page.getByTestId("mes-sorties-cancel-confirm").click({ force: true });
      await page.waitForTimeout(1500);
      check(
        "cancelled_removed_from_confirmed",
        (await page.getByTestId(`mes-sorties-confirmed-${sessionId}`).count()) === 0,
        "gone from confirmed",
      );
    }

    // Reload detail — must not show joined state for same identity
    await page.goto(`${BASE}/session/${sessionId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const titleReload = (
      await page.getByTestId("session-detail-title").innerText().catch(() => "")
    ).trim();
    check("reload_same_title", titleReload === title, `${titleReload} === ${title}`);
    check(
      "reload_same_url",
      new RegExp(`/session/${sessionId}`).test(page.url()),
      page.url(),
    );
    const bodyReload = await page.locator("body").innerText();
    const stillJoined =
      /Se désister|Place réservée · tu peux/i.test(bodyReload) &&
      !/M'inscrire à cette sortie|Rejoindre la sortie/i.test(bodyReload);
    // After cancel sticky should offer join again
    const joinAgain = /M'inscrire à cette sortie/i.test(bodyReload);
    check("reload_not_joined", joinAgain || !stillJoined, `joinAgain=${joinAgain}`);
    await shot(page, "current-outing-detail-after-cancel-393.png");

    // Narrow 320
    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(400);
    await shot(page, "current-outing-detail-320.png");
    check("narrow_320_hero", Boolean(await page.getByTestId("stito-outing-hero").count()), "320");

    // Large text (approximate via zoom)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "22px";
      document.body.style.zoom = "1.25";
    });
    await page.waitForTimeout(400);
    await shot(page, "current-outing-detail-large-text.png");
    check(
      "large_text_title",
      Boolean(await page.getByTestId("session-detail-title").count()),
      "large text",
    );

    // Side-by-side note: reference already in OUT from earlier copy
    check(
      "reference_stitch_present",
      fs.existsSync(path.join(OUT, "reference-stitch-outing-detail-phone.png")),
      "stitch ref",
    );
  } catch (e) {
    check("uncaught", false, String(e));
    await shot(page, "outing-detail-journey-error.png", { fullPage: true }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    const json = JSON.stringify(report, null, 2);
    fs.writeFileSync(path.join(OUT, "outing-detail-stito-journey-smoke.json"), json);
    fs.writeFileSync(path.join(REPO_EV, "evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
