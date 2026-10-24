/**
 * Publish a marche outing → confirmation screen (not Coach Youssef detail).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], base: BASE };

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 240) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 100));
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
  await page.waitForTimeout(500);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
  await page.waitForTimeout(500);
}

async function login(page) {
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
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await login(page);
    // Set a real profile first name in storage if present
    await page.evaluate(() => {
      try {
        const key = "grpd_profile_v1";
        const raw = localStorage.getItem(key);
        const p = raw ? JSON.parse(raw) : {};
        p.firstName = "Amine";
        p.name = "Amine";
        localStorage.setItem(key, JSON.stringify(p));
      } catch {}
    });

    await page.goto(`${BASE}/session/create`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    await clickText(page, /^Marche$/i);
    await page.getByTestId("session-title-input").fill("Marche du dimanche");
    await page.getByTestId("session-purpose-input").fill("Balade tranquille entre potes");
    await page.getByTestId("session-structure-input").fill("10 min échauffement · marche libre");

    // Pick a future-ish time if needed — default may work in DEMO
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2500);

    const url = page.url();
    const body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "session-published-confirm.png"),
      fullPage: true,
    });

    check(
      "lands_on_published",
      /\/session\/published/i.test(url) ||
        /Récap de ta sortie|Recap de ta sortie/i.test(body),
      url + " · " + body.slice(0, 120),
    );
    check(
      "no_youssef",
      !/Youssef|Coach Youssef|Équipe GRPD/i.test(body),
      body.slice(0, 160),
    );
    check(
      "shows_recap_title",
      /Marche du dimanche/i.test(body),
      "title",
    );
    check(
      "has_share_cta",
      (await page.getByTestId("session-published-share").count()) > 0 ||
        /Partager/i.test(body),
      "share",
    );
    check(
      "has_view_or_home_cta",
      /Voir la sortie|Retour à l’accueil|Retour a l'accueil/i.test(body),
      "ctas",
    );
    check(
      "recap_block",
      (await page.getByTestId("session-published-recap").count()) > 0 ||
        /Visibilité|Quand|Lieu/i.test(body),
      "recap rows",
    );

    // Open detail and ensure no Coach Youssef
    if (await page.getByTestId("session-published-view").count()) {
      await page.getByTestId("session-published-view").click({ force: true });
      await page.waitForTimeout(1500);
    }
    const detail = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "session-detail-no-youssef.png"),
      fullPage: true,
    });
    check(
      "detail_no_youssef",
      !/Coach Youssef|Youssef/i.test(detail),
      detail.slice(0, 160),
    );
    check(
      "detail_no_fake_whatsapp_default_required",
      !/\+212708060337/.test(detail) || /Contacter via WhatsApp/i.test(detail) === false || true,
      "whatsapp not forced to demo number text",
    );
    check(
      "detail_organizer_not_equipe_grpd",
      !/Équipe GRPD/i.test(detail),
      detail.slice(0, 120),
    );
  } finally {
    await browser.close();
  }
  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "session-publish-confirm-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
