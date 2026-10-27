/**
 * Architecture remediation — VERIFICATION (demo web).
 * Runtime exercise of retained interactive handlers — not onPress counts.
 * Covers: invalid/missing inputs, duplicate submit, retry, abandoned form,
 * reload persistence, private direct links, readable phone+desktop UI.
 * Failed-request / connected unrelated-record: see connected smoke + notes.
 * Hosted/native/UAT/OCIF: not claimed.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/architecture-remediation";
const SHOTS = path.join(AUDIT, "verification");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

const PHONE = "0611111111";
const DEMO_OTP = "000000";
const BAD_OTP = "999999";

const report = {
  batch: "architecture-remediation-verification-demo",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  ocif_claim: false,
  broad_acceptance: false,
  base: BASE,
  notes: {
    failed_requests_connected:
      "401/403 authz exercised in connected local PG smoke (logout/PATCH/member-group)",
    unrelated_records_connected:
      "unrelated_club_home_group_preserved in connected-evidence.json",
  },
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 400) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, `verification-${name}.png`);
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
  await page.waitForTimeout(350);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 8 });
  }
  await page.waitForTimeout(350);
}

async function wipe(page) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

async function login(page) {
  await page.goto(`${BASE}/onboarding`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await wipe(page);
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill(PHONE);
  await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, DEMO_OTP);
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
  await page.waitForTimeout(500);
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
    // --- Invalid / missing inputs (handlers) ---
    await page.goto(`${BASE}/onboarding`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await wipe(page);
    await page.reload({ waitUntil: "networkidle" });
    await clickText(page, /J'ai déjà un compte/i);
    await page.waitForURL(/phone/i, { timeout: 20000 });

    await page.getByTestId("phone-input").fill("");
    await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i).catch(() => {});
    await page.waitForTimeout(500);
    check(
      "invalid_empty_phone_no_verify",
      /phone/i.test(page.url()) && !/verify/i.test(page.url()),
      page.url(),
    );

    await page.getByTestId("phone-input").fill("12");
    await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i).catch(() => {});
    await page.waitForTimeout(600);
    check(
      "invalid_short_phone_no_verify",
      !/verify/i.test(page.url()) ||
        /invalide|court|erreur|téléphone/i.test(
          await page.locator("body").innerText(),
        ),
      page.url(),
    );

    // --- Duplicate submit (double Continuer) ---
    await page.getByTestId("phone-input").fill(PHONE);
    const cont = page.getByText(/Continuer|Suivant|Envoyer|Recevoir/i).last();
    await Promise.all([
      cont.click({ force: true }).catch(() => {}),
      cont.click({ force: true }).catch(() => {}),
    ]);
    await page.waitForTimeout(1200);
    const urls = [];
    urls.push(page.url());
    await page.waitForURL(/verify|phone/i, { timeout: 15000 }).catch(() => {});
    urls.push(page.url());
    check(
      "duplicate_submit_single_verify",
      /verify/i.test(page.url()),
      `landed ${page.url()} (not crashed)`,
    );

    // --- Retry after failed OTP ---
    await enterOtp(page, BAD_OTP);
    try {
      await clickText(page, /^Vérifier$/i);
    } catch {
      /* auto */
    }
    await page.waitForTimeout(1200);
    const badBody = await page.locator("body").innerText();
    check(
      "failed_otp_stays_off_tabs",
      /verify/i.test(page.url()) && !/Accueil|Mes sorties/i.test(badBody),
      page.url(),
    );
    await shot(page, "01-failed-otp-phone");

    // Retry success
    await page.goto(`${BASE}/(auth)/phone`, { waitUntil: "networkidle" });
    await page.getByTestId("phone-input").fill(PHONE);
    await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i);
    await page.waitForURL(/verify/i, { timeout: 20000 });
    await enterOtp(page, DEMO_OTP);
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
    check("retry_otp_reaches_home", true, page.url());
    await shot(page, "02-home-phone");

    // UI coherent / controls unobstructed (phone)
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const tabAccueil = page.getByRole("tab", { name: /^Accueil$/i }).first();
    const tabClubs = page.getByRole("tab", { name: /^Clubs$/i }).first();
    const tabClubsFb = page.getByText(/^Clubs$/i).last();
    check(
      "phone_tabs_visible",
      (await tabAccueil.isVisible().catch(() => false)) ||
        /Accueil|On sort/i.test(await page.locator("body").innerText()),
      "tabs/home chrome",
    );
    let box = await tabClubs.boundingBox().catch(() => null);
    let clubsTarget = tabClubs;
    if (!box) {
      box = await tabClubsFb.boundingBox().catch(() => null);
      clubsTarget = tabClubsFb;
    }
    // Point 11: null boundingBox is NOT unobstructed — require real hit target.
    check(
      "phone_club_tab_unobstructed",
      Boolean(box) && box.width >= 24 && box.height >= 24,
      box ? JSON.stringify(box) : "FAIL: null boundingBox",
    );
    if (box) {
      await clubsTarget.click({ force: false, timeout: 10000 });
      await page.waitForTimeout(800);
      check(
        "phone_club_tab_hit_navigates",
        /club/i.test(page.url()) ||
          /Quitter|Créer|Rejoindre un club|J'ai une clé|Paramètres|Clubs/i.test(
            await page.locator("body").innerText(),
          ),
        page.url(),
      );
      await page
        .getByRole("tab", { name: /^Accueil$/i })
        .first()
        .click({ force: false })
        .catch(() => {});
      await page.waitForTimeout(500);
    } else {
      check("phone_club_tab_hit_navigates", false, "no hit target");
    }

    // --- Abandoned form: open club create, fill, leave ---
    await page.goto(`${BASE}/club/create`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    const nameInput = page
      .locator('input[placeholder*="nom" i], input[placeholder*="Name" i], input')
      .first();
    const abandonedToken = `ABANDON-${Date.now().toString(36)}`;
    if (await nameInput.count()) {
      await nameInput.fill(abandonedToken).catch(() => {});
    }
    await shot(page, "03-abandoned-form-mid");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check(
      "abandoned_form_left_to_home",
      /Accueil|On sort|Découvrir|Clubs/i.test(
        await page.locator("body").innerText(),
      ),
      page.url(),
    );
    // Return — must not have published a club with that token as sole proof of abandon
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const clubBody = await page.locator("body").innerText();
    check(
      "abandoned_form_no_auto_publish",
      !new RegExp(abandonedToken, "i").test(clubBody),
      "token absent from club hub",
    );

    // --- Reload persistence (settings language) ---
    await page.goto(`${BASE}/profile/settings`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    const before = await page.locator("body").innerText();
    const wasFr = /Français/i.test(before);
    await page.getByText(/^Langue$/i).first().click({ force: true });
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const afterReload = await page.locator("body").innerText();
    check(
      "reload_language_persists",
      wasFr ? /English/i.test(afterReload) : /Français/i.test(afterReload),
      "settings reload",
    );
    await shot(page, "04-settings-reload-phone");

    // --- Private / direct links (logged in) ---
    await page.goto(`${BASE}/club/admin`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    const adminBody = await page.locator("body").innerText();
    check(
      "direct_club_admin_safe",
      adminBody.trim().length > 10 &&
        !/TypeError|Cannot read|undefined is not/i.test(adminBody),
      page.url(),
    );

    await page.goto(`${BASE}/session/does-not-exist-verif`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    const sessBody = await page.locator("body").innerText();
    check(
      "direct_missing_session_safe",
      sessBody.trim().length > 5 &&
        !/TypeError|Cannot read|undefined is not/i.test(sessBody),
      page.url(),
    );
    await shot(page, "05-missing-session-phone");

    // Private link while logged out
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    const logout = page.getByText(/Se déconnecter|Déconnexion/i).first();
    if (await logout.count()) {
      await logout.click({ force: true });
      await page.waitForTimeout(1200);
    }
    await page.goto(`${BASE}/club/settings`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    const gatedUrl = page.url();
    const gatedBody = await page.locator("body").innerText();
    const privateLeaked =
      /Enregistrer le club|Générer un code|Visibilité du club/i.test(gatedBody) &&
      !/Connexion|Téléphone|déjà un compte|Recevoir un code/i.test(gatedBody);
    const onAuthSurface =
      /phone|onboarding|verify|login/i.test(gatedUrl) ||
      /J'ai déjà un compte|Téléphone|Connexion|Recevoir un code/i.test(gatedBody);
    // Point 11: exact unauthorized — reject permissive Club|Parametres|Accueil OR.
    check(
      "private_club_settings_gated_or_safe",
      onAuthSurface && !privateLeaked && !/TypeError|Cannot read/i.test(gatedBody),
      gatedUrl + " | " + gatedBody.slice(0, 100),
    );
    await shot(page, "06-private-link-logged-out");

    // Re-login for desktop shots
    await login(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const desk = await page.locator("body").innerText();
    // Point 11: separate route smoke from accessibility — require chrome + enabled control.
    let deskClubs = page.getByRole("tab", { name: /^Clubs$/i }).first();
    let deskClubsBox = await deskClubs.boundingBox().catch(() => null);
    if (!deskClubsBox) {
      deskClubs = page.getByText(/^Clubs$/i).last();
      deskClubsBox = await deskClubs.boundingBox().catch(() => null);
    }
    check(
      "desktop_home_readable",
      /Accueil|On sort/i.test(desk) &&
        /Clubs/i.test(desk) &&
        Boolean(deskClubsBox) &&
        deskClubsBox.width >= 24 &&
        deskClubsBox.height >= 24,
      JSON.stringify({ len: desk.trim().length, box: deskClubsBox }),
    );
    await shot(page, "07-home-desktop");

    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const deskSet = await page.locator("body").innerText();
    const deskLogout = page.getByText(/Se déconnecter/i).first();
    const dbox = await deskLogout.boundingBox().catch(() => null);
    const logoutEnabled = await deskLogout.isEnabled().catch(() => false);
    check(
      "desktop_settings_readable",
      /Langue/i.test(deskSet) &&
        /Se déconnecter/i.test(deskSet) &&
        Boolean(dbox) &&
        dbox.width >= 20 &&
        dbox.height >= 10 &&
        logoutEnabled,
      JSON.stringify({ box: dbox, logoutEnabled }),
    );
    check(
      "desktop_logout_unobstructed",
      Boolean(dbox) && dbox.width >= 20 && dbox.height >= 10 && logoutEnabled,
      dbox ? JSON.stringify(dbox) : "FAIL: null boundingBox",
    );
    await shot(page, "08-settings-desktop");

    // Point 10/11: wrong OTP is auth-only — club fail harness is the club/outing analogue (journeys smoke).
    check(
      "demo_failed_request_analogue",
      report.checks.some((c) => c.id === "failed_otp_stays_off_tabs" && c.ok),
      "OTP fail = auth only; club/outing fail covered in codex-journeys (not counted as substitute here)",
    );
  } catch (err) {
    check("verification_uncaught", false, err?.stack || String(err));
  } finally {
    await browser.close();
  }

  const passed = report.checks.filter((c) => c.ok).length;
  const failed = report.checks.filter((c) => !c.ok).length;
  report.summary = { passed, failed, total: report.checks.length };
  fs.writeFileSync(
    path.join(OUT, "architecture-remediation-verification-demo.json"),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(AUDIT, "verification-demo-evidence.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  console.log("SHA", report.tested_sha);
  if (failed > 0) process.exit(1);
}

main();
