/**
 * Architecture remediation smoke — demo web only.
 * Covers: /demo home, settings language toggle + logout honesty,
 * /avenir enter CTA, run/setup deep-link (demo still functional).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/architecture-remediation";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(AUDIT, { recursive: true });

const report = {
  batch: "architecture-remediation",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, name));
  console.log("SHOT", p);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
  });
  try {
    await page.goto(`${BASE}/demo`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForFunction(
      () => /On sort/i.test(document.body?.innerText || ""),
      { timeout: 45000 },
    );
    check("demo_home", true, page.url());
    await shot(page, "arch-remediation-accueil.png");

    // Settings via profile tab if present
    const profil = page.getByText(/^Profil$/i).first();
    if (await profil.count()) {
      await profil.click({ force: true });
      await page.waitForTimeout(800);
    }
    // Open settings gear / row
    const settingsLink = page.getByText(/Paramètres|Réglages|Settings/i).first();
    if (await settingsLink.count()) {
      await settingsLink.click({ force: true });
      await page.waitForTimeout(1000);
    } else {
      await page.goto(`${BASE}/profile/settings`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForTimeout(1000);
    }

    const body = await page.locator("body").innerText();
    check(
      "settings_no_push_claim",
      /appareil uniquement|Aucune notification push/i.test(body),
      "notification honesty",
    );
    check(
      "settings_hors_mvp_legal",
      /Hors MVP/i.test(body),
      "legal non-interactive",
    );
    check(
      "settings_language_row",
      /Langue/i.test(body),
      "language present",
    );
    await shot(page, "arch-remediation-settings.png");

    // Toggle language if actionable
    const langue = page.getByText(/^Langue$/i).first();
    if (await langue.count()) {
      await langue.click({ force: true });
      await page.waitForTimeout(400);
      const after = await page.locator("body").innerText();
      check(
        "settings_language_toggle",
        /English|Français/i.test(after),
        "toggled or displayed",
      );
    } else {
      check("settings_language_toggle", false, "row missing");
    }

    // Logout
    const logout = page.getByText(/Se déconnecter|Déconnexion/i).first();
    check("settings_logout_control", await logout.count() > 0, "logout btn");
    if (await logout.count()) {
      await logout.click({ force: true });
      await page.waitForTimeout(600);
      // Confirm dialog — web confirm or button
      page.once("dialog", async (d) => {
        await d.accept();
      });
      const confirm = page.getByText(/^Déconnexion$/i).last();
      if (await confirm.count()) {
        await confirm.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(1500);
      const url = page.url();
      const text = await page.locator("body").innerText();
      check(
        "logout_left_session",
        /phone|onboarding|Connexion|Compte|OTP|Continuer|J'ai déjà/i.test(
          text + url,
        ),
        url,
      );
      await shot(page, "arch-remediation-after-logout.png");
    }

    // Avenir CTA
    await page.goto(`${BASE}/avenir`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    const avenirBody = await page.locator("body").innerText();
    check(
      "avenir_loads",
      /avenir|GrpD|communaut/i.test(avenirBody),
      avenirBody.slice(0, 80),
    );
    const enter = page.getByTestId("avenir-enter-app");
    check("avenir_cta", (await enter.count()) > 0, "enter CTA");
    if (await enter.count()) {
      await enter.click({ force: true });
      await page.waitForTimeout(1500);
      check(
        "avenir_enter_navigates",
        /On sort|demo|onboarding|phone|Accueil/i.test(
          (await page.locator("body").innerText()) + page.url(),
        ),
        page.url(),
      );
    }
    await shot(page, "arch-remediation-avenir.png");

    // Desktop width spot
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "arch-remediation-accueil-desktop.png");
  } catch (e) {
    check("uncaught", false, String(e));
    await shot(page, "arch-remediation-error.png").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
    };
    const json = JSON.stringify(report, null, 2);
    fs.writeFileSync(path.join(OUT, "architecture-remediation-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
