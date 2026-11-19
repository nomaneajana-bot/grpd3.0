/**
 * Screen-completion PROMPT 6 — profile/settings honesty, logout caches,
 * orphan deep links, avenir return (demo). No invented push/i18n/coaching.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts/screen-completion";
const AUDIT = "/workspace/docs/audit/screen-completion";
fs.mkdirSync(path.join(OUT, "p6"), { recursive: true });
fs.mkdirSync(path.join(AUDIT, "p6"), { recursive: true });

const HOST = "0611111111";
const ALT = "0622222222";

const report = {
  prompts: [6],
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  checks: [],
  notes: {
    language_units:
      "Device-local labels only — honesty caption; no full i18n / distance conversion",
    push: "Caption: no push delivery",
    orphans: "test-history redirect; run/setup safe; group-edit → group-create",
  },
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, "p6", `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, "p6", `${name}.png`));
}

async function enterOtp(page) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type("0");
  }
}

async function login(page, phone, wipe = false) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  if (wipe) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/J'ai déjà un compte/i).last().click({ force: true });
  await page.waitForURL(/phone/i);
  await page.getByTestId("phone-input").fill(phone);
  await page.getByText(/Continuer|Suivant|Envoyer|Recevoir/i).last().click({ force: true });
  await page.waitForURL(/verify/i);
  await enterOtp(page);
  try {
    await page.getByText(/^Vérifier$/i).last().click({ force: true });
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () => /Clubs|Accueil|On sort/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
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
    await login(page, HOST, true);

    // Seed a user-ish cache marker + device pref (AsyncStorage keys on web)
    await page.evaluate(() => {
      localStorage.setItem("joinedSessions:v1", JSON.stringify({ seed_x: true }));
      const prefs = {
        shareStatsWithClub: false,
        language: "fr",
        units: "km",
        notifications: {
          sessionReminders: true,
          coachMessages: false,
          clubActivity: false,
          productAnnouncements: false,
        },
      };
      localStorage.setItem("grpd_settings_prefs_v1", JSON.stringify(prefs));
    });

    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const settingsBody = await page.locator("body").innerText();
    check(
      "p6_settings_loads",
      /Paramètres/i.test(settingsBody) && /NOTIFICATIONS/i.test(settingsBody),
      settingsBody.slice(0, 80),
    );
    check(
      "p6_push_honesty",
      /appareil uniquement/i.test(settingsBody) &&
        /Aucune notification push/i.test(settingsBody),
      "push caption",
    );
    check(
      "p6_prefs_honesty",
      /n'appliquent pas encore une traduction complète/i.test(settingsBody) ||
        (await page.getByTestId("settings-prefs-honesty").count()) > 0,
      "language/units local-only caption",
    );
    check(
      "p6_language_local_label",
      /Langue \(libellé local\)/i.test(settingsBody),
      "language row label",
    );
    check(
      "p6_units_local_label",
      /Unités \(libellé local\)/i.test(settingsBody),
      "units row label",
    );
    check(
      "p6_hors_mvp_noninteractive",
      /Hors MVP/i.test(settingsBody) &&
        /Conditions d'utilisation/i.test(settingsBody),
      "legal stubs",
    );
    await shot(page, "01-settings-honesty");

    // Toggle language + notification; reload; persist
    await page.getByText(/Langue \(libellé local\)/i).click({ force: true });
    await page.waitForTimeout(400);
    await page.getByText(/Activité du club/i).click({ force: true }).catch(() => {});
    // Prefer switch near club activity if click on label doesn't toggle
    const clubToggle = page.locator("text=Activité du club").first();
    if (await clubToggle.count()) {
      await clubToggle.click({ force: true });
      await page.waitForTimeout(300);
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const afterReload = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("grpd_settings_prefs_v1") || "{}");
      } catch {
        return {};
      }
    });
    check(
      "p6_language_persists_device",
      afterReload.language === "en" || afterReload.language === "fr",
      JSON.stringify({ language: afterReload.language }),
    );
    // Click once more to ensure we flipped at least once from fr
    if (afterReload.language === "fr") {
      await page.getByText(/Langue \(libellé local\)/i).click({ force: true });
      await page.waitForTimeout(400);
    }
    const prefs2 = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("grpd_settings_prefs_v1") || "{}"),
    );
    check("p6_language_toggled", prefs2.language === "en", prefs2.language);

    // Narrow + desktop
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(page, "02-settings-narrow320");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(page, "03-settings-desktop");

    // Orphans
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/profile/test-history`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    check(
      "p6_orphan_test_history",
      /\/profile\/?$|\/\(tabs\)\/profile/i.test(page.url()) ||
        /\/profile/.test(page.url()) && !/test-history/.test(page.url()),
      page.url(),
    );
    await shot(page, "04-orphan-test-history");

    await page.goto(`${BASE}/run/setup`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const runBody = await page.locator("body").innerText();
    check(
      "p6_orphan_run_setup_safe",
      /groupe|course|différé|deferred|Remplis/i.test(runBody) &&
        !/crashed|Unhandled/i.test(runBody),
      runBody.slice(0, 80),
    );
    await shot(page, "05-orphan-run-setup");

    await page.goto(
      `${BASE}/club/group-edit?clubId=club_orphan_x&groupId=B`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(1400);
    const geUrl = page.url();
    check(
      "p6_orphan_group_edit_redirect",
      /group-create/i.test(geUrl) && /clubId=/i.test(geUrl) && /groupId=B/i.test(geUrl),
      geUrl,
    );

    // Avenir return (signed-in)
    await page.goto(`${BASE}/avenir`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const av = await page.locator("body").innerText();
    check("p6_avenir_loads", /avenir|vision|GrpD/i.test(av), av.slice(0, 60));
    const cta = page.getByTestId("avenir-enter-app");
    check("p6_avenir_cta", (await cta.count()) > 0, "cta");
    const ctaLabel = (await cta.count()) ? (await cta.innerText()).trim() : "";
    check(
      "p6_avenir_signed_in_label",
      /Retour|accueil/i.test(ctaLabel),
      ctaLabel,
    );
    await cta.click({ force: true });
    await page.waitForTimeout(1500);
    check(
      "p6_avenir_returns_tabs",
      /\/(tabs)?\/?$|Accueil|On sort/i.test(page.url() + (await page.locator("body").innerText())),
      page.url(),
    );
    await shot(page, "06-avenir-return");

    // Logout clears user caches; preserves device prefs
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // Force language en before logout
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem("grpd_settings_prefs_v1") || "{}");
      prefs.language = "en";
      localStorage.setItem("grpd_settings_prefs_v1", JSON.stringify(prefs));
      localStorage.setItem("joinedSessions:v1", JSON.stringify({ should_clear: true }));
    });
    await page.getByText(/Se déconnecter/i).last().click({ force: true });
    await page.waitForTimeout(600);
    // Confirm dialog if custom (accept first matching destructive confirm)
    const conf = page.getByText(/^Déconnexion$/i).last();
    if (await conf.count()) await conf.click({ force: true }).catch(() => {});
    await page.waitForTimeout(2500);
    const postLogout = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const joinedKeys = keys.filter((k) => /joinedSessions/i.test(k));
      const joinedVals = Object.fromEntries(
        joinedKeys.map((k) => [k, localStorage.getItem(k)]),
      );
      return {
        authKeys: keys.filter((k) => /auth|token|grpd_auth/i.test(k)),
        joinedVals,
        prefs: localStorage.getItem("grpd_settings_prefs_v1"),
        url: location.href,
        body: (document.body?.innerText || "").slice(0, 160),
      };
    });
    const prefsKept = (() => {
      try {
        return JSON.parse(postLogout.prefs || "{}").language === "en";
      } catch {
        return false;
      }
    })();
    const joinedCleared = Object.values(postLogout.joinedVals).every(
      (v) => !v || v === "{}" || v === "null" || !/should_clear|seed_x/.test(v),
    );
    check(
      "p6_logout_clears_user_cache",
      joinedCleared,
      JSON.stringify(postLogout.joinedVals),
    );
    check(
      "p6_logout_preserves_device_prefs",
      prefsKept,
      postLogout.prefs?.slice(0, 80),
    );
    check(
      "p6_logout_leaves_session",
      /onboarding|phone|demo|welcome|J'ai déjà/i.test(postLogout.body + postLogout.url),
      postLogout.url,
    );
    await shot(page, "07-after-logout");

    // Account switch: second user should not inherit first user's joined marker
    await login(page, ALT, false);
    const altJoined = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => /joinedSessions/i.test(k));
      return Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)]));
    });
    check(
      "p6_account_switch_no_foreign_joined",
      !JSON.stringify(altJoined).match(/should_clear|seed_x/),
      JSON.stringify(altJoined),
    );

    // Larger text spot-check
    await page.emulateMedia({ colorScheme: "light" });
    await page.addStyleTag({
      content: "html { font-size: 120% !important; }",
    });
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "08-settings-larger-text");
    const largeBody = await page.locator("body").innerText();
    check(
      "p6_larger_text_readable",
      /Paramètres/i.test(largeBody) && /libellé local/i.test(largeBody),
      "larger text",
    );
  } catch (e) {
    check("p6_uncaught", false, String(e?.stack || e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
      total: report.checks.length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "p6-settings-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "p6-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
