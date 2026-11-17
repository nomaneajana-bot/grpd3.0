/**
 * Web: login → assert tokens in localStorage → reload → still Accueil (not onboarding).
 *
 * SMOKE_URL=https://… node scripts/auth-persist-refresh-smoke.mjs
 * Optional: VERCEL_SHARE=… appended as ?_vercel_share=
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = (process.env.SMOKE_URL || "").replace(/\/$/, "");
const SHARE = process.env.VERCEL_SHARE || "";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

if (!BASE) {
  console.error("SMOKE_URL required");
  process.exit(2);
}

function withShare(url) {
  if (!SHARE) return url;
  const u = new URL(url);
  u.searchParams.set("_vercel_share", SHARE);
  return u.toString();
}

const report = {
  batch: "auth-persist-refresh",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 400) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

const email = `persist.${Date.now()}@example.com`;
const password = "Persist99!";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(withShare(`${BASE}/email`), {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  // If protection bounced to SSO, fail clearly
  const bootText = await page.locator("body").innerText().catch(() => "");
  if (/Vercel Authentication|Login – Vercel/i.test(bootText)) {
    check("preview_accessible", false, bootText.slice(0, 120));
    throw new Error("Preview protected without share access");
  }
  check("preview_accessible", true, page.url());

  // Prefer signup so we know the account exists
  const createLink = page.getByText(/Créer un compte|Créer mon compte|J'ai déjà/i).first();
  // Go to signup if on login
  if (await page.getByTestId("email-login-email").count()) {
    const secondary = page.getByText(/Créer un compte/i).first();
    if (await secondary.count()) await secondary.click();
  }
  await page.goto(withShare(`${BASE}/email-signup`), {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.getByTestId("email-signup-email").fill(email);
  await page.getByTestId("email-signup-password").fill(password);
  const name = page.getByTestId("email-signup-name");
  if (await name.count()) await name.fill("Persist");
  await page.getByText(/Créer mon compte/i).first().click();

  await page.waitForFunction(
    () =>
      /On sort|ACCUEIL|Mes sorties|Découvrir/i.test(document.body?.innerText || "") &&
      !/Créer mon compte|Crée ton compte/i.test(document.body?.innerText || ""),
    { timeout: 60000 },
  );
  check("signup_reached_accueil", true, page.url());

  const tokens = await page.evaluate(() => {
    const raw = window.localStorage.getItem("grpd_auth_tokens_v1");
    return raw ? JSON.parse(raw) : null;
  });
  check(
    "tokens_in_localStorage",
    Boolean(tokens?.accessToken && tokens?.refreshToken),
    tokens ? "access+refresh present" : "missing",
  );

  await page.screenshot({
    path: path.join(OUT, "auth-persist-before-refresh.png"),
    fullPage: true,
  });

  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);

  const afterText = await page.locator("body").innerText();
  const afterUrl = page.url();
  const stillAuthed =
    /On sort|ACCUEIL|Mes sorties|Découvrir/i.test(afterText) &&
    !/Crée ton compte|Créer un compte[\s\S]{0,80}Gratuit|Sors\.\s*Avec les tiens/i.test(
      afterText,
    );
  // Welcome brand "Sors. Avec les tiens." is the failure mode
  const bouncedToWelcome = /G R P D[\s\S]{0,40}Sors\./i.test(afterText);
  check(
    "refresh_stays_logged_in",
    stillAuthed && !bouncedToWelcome,
    afterUrl + " · " + afterText.slice(0, 160),
  );

  await page.screenshot({
    path: path.join(OUT, "auth-persist-after-refresh.png"),
    fullPage: true,
  });
} catch (err) {
  check("smoke_error", false, err?.message || String(err));
  await page.screenshot({
    path: path.join(OUT, "auth-persist-error.png"),
    fullPage: true,
  }).catch(() => undefined);
} finally {
  await browser.close();
  const outPath = path.join(OUT, "auth-persist-refresh-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log("Wrote", outPath);
  const failed = report.checks.some((c) => !c.ok);
  process.exit(failed ? 1 : 0);
}
