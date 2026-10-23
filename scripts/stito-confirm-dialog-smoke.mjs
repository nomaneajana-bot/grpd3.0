/**
 * Stito confirm dialog — organise club→public audience switch must show
 * branded modal (not window.confirm).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "stito-confirm-dialog",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
  screenshots: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

async function shot(page, name) {
  const file = `${name}.png`;
  const abs = path.join(OUT, file);
  await page.screenshot({ path: abs, fullPage: false });
  report.screenshots.push(abs);
  return abs;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let nativeConfirmFired = false;
  page.on("dialog", async (dialog) => {
    nativeConfirmFired = true;
    await dialog.dismiss();
  });

  try {
    await page.goto(`${BASE}/demo`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForFunction(
      () => /On sort|Accueil|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
      { timeout: 45000 },
    );
    check("demo_home", true, page.url());

    await page.goto(`${BASE}/session/create`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1200);
    await shot(page, "confirm-01-create");

    await page.getByTestId("session-audience-club").click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, "confirm-02-club");

    await page.getByTestId("session-audience-public").click({ force: true });
    await page.waitForTimeout(700);

    const modal = page.getByTestId("stito-confirm-modal");
    const modalVisible = await modal.isVisible().catch(() => false);
    check("stito_modal_visible", modalVisible, "stito-confirm-modal");

    const body = await page.locator("body").innerText();
    check(
      "title_rendre_ouverte",
      /Rendre ouverte à tous/i.test(body),
      body.slice(0, 240),
    );
    check(
      "message_associated",
      /Tout le monde pourra voir|restera associée/i.test(body),
      body.slice(0, 240),
    );
    check(
      "no_native_window_confirm",
      !nativeConfirmFired,
      nativeConfirmFired ? "window.confirm fired" : "ok",
    );

    await shot(page, "confirm-03-modal");

    // Cancel keeps flow usable
    if (modalVisible) {
      await page.getByTestId("stito-confirm-cancel").click({ force: true });
      await page.waitForTimeout(400);
      check(
        "cancel_dismisses",
        !(await modal.isVisible().catch(() => false)),
        "modal hidden",
      );

      // Re-open and confirm
      await page.getByTestId("session-audience-public").click({ force: true });
      await page.waitForTimeout(500);
      await page.getByTestId("stito-confirm-ok").click({ force: true });
      await page.waitForTimeout(500);
      check(
        "confirm_dismisses",
        !(await page.getByTestId("stito-confirm-modal").isVisible().catch(() => false)),
        "modal hidden after ok",
      );
      await shot(page, "confirm-04-after-ok");
    }
  } catch (e) {
    check("smoke_error", false, e?.message || String(e));
    await shot(page, "confirm-error").catch(() => {});
  } finally {
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = fail === 0 ? "pass" : "fail";
    fs.writeFileSync(
      path.join(OUT, "stito-confirm-dialog-report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary, `fails=${fail}`);
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
