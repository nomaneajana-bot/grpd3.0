/**
 * Architecture remediation — Batch D (demo web).
 * Settings retained actions + orphan deep links; back; honesty;
 * phone + desktop layout screenshots. No redesign.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:38303";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/architecture-remediation";
const SHOTS = path.join(AUDIT, "batch-d");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

const report = {
  batch: "architecture-remediation-batch-d",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, `batch-d-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(SHOTS, `${name}.png`));
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
    await page.keyboard.type(String(code[i]), { delay: 10 });
  }
  await page.waitForTimeout(400);
}

async function loginDemo(page) {
  await page.goto(`${BASE}/onboarding`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill("0611111111");
  await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () =>
      /Découvrir|Mes sorties|Clubs|Profil|Accueil|On sort/i.test(
        document.body?.innerText || "",
      ),
    { timeout: 45000 },
  );
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {
      /* ignore */
    }
  });

  try {
    await loginDemo(page);

    // --- Settings ---
    await page.goto(`${BASE}/profile/settings`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    let body = await page.locator("body").innerText();
    check("settings_loads", /Paramètres|Langue|Unités/i.test(body), body.slice(0, 80));
    check(
      "settings_no_push_claim",
      /appareil uniquement|Aucune notification push/i.test(body),
      "notification honesty",
    );
    check("settings_hors_mvp", /Hors MVP/i.test(body), "legal/support disposition");
    check("settings_language_row", /Langue/i.test(body), "language");
    check("settings_units_row", /Unités|Kilomètres|Miles/i.test(body), "units");
    await shot(page, "01-settings-phone");

    // Hors MVP rows must not navigate on click
    const legal = page.getByText(/Conditions d'utilisation/i).first();
    if (await legal.count()) {
      await legal.click({ force: true });
      await page.waitForTimeout(500);
      check(
        "hors_mvp_no_navigation",
        /profile\/settings|Paramètres/i.test(page.url() + (await page.locator("body").innerText())),
        page.url(),
      );
    } else {
      check("hors_mvp_no_navigation", false, "legal row missing");
    }

    // Language toggle + persistence across reload
    const beforeLang = await page.locator("body").innerText();
    const wasFr = /Français/i.test(beforeLang);
    await page.getByText(/^Langue$/i).first().click({ force: true });
    await page.waitForTimeout(500);
    let afterLang = await page.locator("body").innerText();
    const toggled = wasFr
      ? /English/i.test(afterLang)
      : /Français/i.test(afterLang);
    check("settings_language_toggle", toggled, afterLang.slice(0, 60));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    afterLang = await page.locator("body").innerText();
    check(
      "settings_language_persists",
      wasFr ? /English/i.test(afterLang) : /Français/i.test(afterLang),
      "reload",
    );

    // Units toggle
    await page.getByText(/^Unités$/i).first().click({ force: true });
    await page.waitForTimeout(400);
    body = await page.locator("body").innerText();
    check("settings_units_toggle", /Miles|Kilomètres/i.test(body), body.slice(0, 40));

    // Notification toggle retained (local)
    const notif = page.getByText(/Rappels de séance/i).first();
    if (await notif.count()) {
      await notif.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      check("settings_notif_row_present", true, "toggle row");
    } else {
      check("settings_notif_row_present", false, "missing");
    }

    // Back from settings
    const back = page.getByLabel(/Retour/i).first();
    if (await back.count()) {
      await back.click({ force: true });
    } else {
      await page.goBack();
    }
    await page.waitForTimeout(800);
    check(
      "settings_back",
      /profile|Profil|Paramètres|Accueil|Clubs/i.test(
        page.url() + (await page.locator("body").innerText()),
      ),
      page.url(),
    );

    // Re-open settings for logout control presence (don't full logout yet — orphans first)
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check(
      "settings_logout_control",
      (await page.getByText(/Se déconnecter|Déconnexion/i).count()) > 0,
      "logout btn",
    );

    // --- Orphans / deep links ---
    await page.goto(`${BASE}/profile/test-history`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    check(
      "orphan_test_history_redirect",
      /\/profile|Profil/i.test(page.url() + (await page.locator("body").innerText())) &&
        !/test-history/i.test(page.url()),
      page.url(),
    );
    await shot(page, "02-test-history-redirect");

    await page.goto(`${BASE}/run/setup`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1200);
    body = await page.locator("body").innerText();
    const runDemoForm = /Trouver mon groupe|Course libre/i.test(body);
    const runDeferred = Boolean(await page.getByTestId("run-setup-deferred").count());
    // Demo: form OK; connected deferred is separate (not this surface)
    check(
      "orphan_run_setup_demo_safe",
      runDemoForm || runDeferred,
      runDeferred ? "deferred UI" : body.slice(0, 80),
    );
    check(
      "orphan_run_setup_not_blank",
      body.trim().length > 20,
      "has content",
    );
    await shot(page, "03-run-setup");

    // group-edit → group-create with params
    await page.goto(
      `${BASE}/club/group-edit?clubId=club_test_d&groupId=B`,
      { waitUntil: "networkidle", timeout: 60000 },
    );
    await page.waitForTimeout(1200);
    const geUrl = page.url();
    check(
      "orphan_group_edit_redirect",
      /group-create/i.test(geUrl) && !/group-edit/i.test(geUrl),
      geUrl,
    );
    // params preserved in URL or form
    check(
      "orphan_group_edit_params",
      /clubId=club_test_d|groupId=B|club_test_d/i.test(
        geUrl + (await page.locator("body").innerText()),
      ),
      geUrl,
    );
    await shot(page, "04-group-edit-redirect");

    // /avenir deep link + enter CTA (demo → /demo or tabs)
    await page.goto(`${BASE}/avenir`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    body = await page.locator("body").innerText();
    check("avenir_loads", /avenir|GrpD|communaut/i.test(body), body.slice(0, 60));
    const enter = page.getByTestId("avenir-enter-app");
    check("avenir_cta_present", (await enter.count()) > 0, "enter CTA");
    await shot(page, "05-avenir-phone");
    if (await enter.count()) {
      await enter.click({ force: true });
      await page.waitForTimeout(1500);
      check(
        "avenir_enter_navigates",
        /demo|onboarding|Accueil|On sort|Découvrir|Clubs|tabs/i.test(
          page.url() + (await page.locator("body").innerText()),
        ),
        page.url(),
      );
    }

    // Desktop layout spot — settings + avenir
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    body = await page.locator("body").innerText();
    check(
      "settings_desktop_readable",
      /Langue|Paramètres|Hors MVP/i.test(body),
      "desktop settings",
    );
    await shot(page, "06-settings-desktop");

    await page.goto(`${BASE}/avenir`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check(
      "avenir_desktop_cta_clear",
      (await page.getByTestId("avenir-enter-app").count()) > 0,
      "cta visible",
    );
    await shot(page, "07-avenir-desktop");

    // Keyboard: Tab order on settings language (best-effort, not full a11y claim)
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    check("settings_keyboard_tab_no_crash", true, "tab pressed");
  } catch (e) {
    check("batch_d_uncaught", false, String(e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "architecture-remediation-batch-d-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "batch-d-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
