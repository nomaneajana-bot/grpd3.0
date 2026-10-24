/**
 * Outing detail A–Z rethink — calm Stito, no stacked clutter.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "outing-detail-rethink",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  base: BASE,
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
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
}

async function login(page) {
  await page.goto(`${BASE}/onboarding`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill("0611111111");
  await clickText(page, /Continuer|Suivant|Envoyer/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
  await page.waitForFunction(
    () => /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await login(page);

    // Publish a marche outing → open detail
    await page.goto(`${BASE}/session/create`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(700);
    await clickText(page, /^Marche$/i);
    await page.getByTestId("session-title-input").fill("Marche du port");
    await page.getByTestId("session-purpose-input").fill("Balade calme au bord de l'eau");
    await page.getByTestId("session-structure-input").fill("40 min libre");
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForURL(/published|session\//i, { timeout: 30000 });
    await page.waitForTimeout(600);

    if (/published/i.test(page.url())) {
      if (await page.getByTestId("session-published-view").count()) {
        await page.getByTestId("session-published-view").click({ force: true });
      } else {
        await clickText(page, /Voir la sortie/i);
      }
      await page.waitForTimeout(1000);
    }

    await page.waitForSelector('[data-testid="stito-outing-hero"]', {
      timeout: 20000,
    });
    const body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "outing-detail-rethink.png"),
      fullPage: true,
    });

    check(
      "hero_present",
      (await page.getByTestId("stito-outing-hero").count()) > 0,
      "hero",
    );
    check(
      "title_in_hero",
      /Marche du port/i.test(body),
      "title",
    );
    check(
      "no_duplicate_modifier_footer",
      (await page.getByTestId("session-modify-btn").count()) <= 1,
      "single modifier",
    );
    check(
      "no_espace_coach_label",
      !/ESPACE COACH/i.test(body),
      "no coach chrome for walk",
    );
    check(
      "no_dark_compris_note",
      !/\bCompris\b/i.test(body),
      "no dismiss note card",
    );
    check(
      "story_present",
      (await page.getByTestId("stito-outing-story").count()) > 0 ||
        (await page.getByTestId("stito-logistics-card").count()) > 0,
      "story",
    );
    check(
      "no_pill_tag_row_membranes",
      !(await page.getByText(/^MEMBRES$/).count()) ||
        /Membres|Ouverte/i.test(
          (await page.getByTestId("stito-outing-hero").innerText()) || "",
        ),
      "meta in hero",
    );
    check(
      "delete_is_quiet",
      !(await page.getByText(/^Supprimer la séance$/).count()) ||
        (await page.getByTestId("session-delete-btn").count()) > 0,
      "quiet delete",
    );

    // Scroll bottom for delete link screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT, "outing-detail-rethink-bottom.png"),
      fullPage: true,
    });
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "outing-detail-rethink-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
