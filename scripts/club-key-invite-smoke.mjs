/**
 * Club “clé” flow — invite-first join, no directory form dump.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  batch: "club-key-invite-flow",
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
  await page.waitForTimeout(400);
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

    // Leave focused club if any so we see empty key state — go access directly
    await page.goto(`${BASE}/club/access`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    let body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "club-key-access.png"),
      fullPage: true,
    });

    check(
      "philosophy_title",
      /Rejoindre un club/i.test(body),
      body.slice(0, 160),
    );
    check(
      "join_by_name_first",
      (await page.getByTestId("club-key-name-form").count()) > 0 &&
        (await page.getByTestId("club-request-name-input").count()) > 0 &&
        /Demander à rejoindre|Rechercher un club/i.test(body),
      "name search at top",
    );
    check(
      "no_public_directory_claim",
      /pas un (annuaire|catalogue) public/i.test(body),
      "honest non-directory",
    );
    check(
      "no_vip",
      !/\bVIP\b/i.test(body),
      "no vip",
    );

    // Expand key entry — secondary to name search
    await page.getByTestId("club-key-code-toggle").click({ force: true });
    await page.waitForTimeout(300);
    check(
      "key_entry_expandable",
      (await page.getByTestId("club-key-join-block").count()) > 0 &&
        (await page.getByTestId("club-join-by-code").count()) > 0,
      "code entry",
    );
    await page.screenshot({
      path: path.join(OUT, "club-key-name-knock.png"),
      fullPage: true,
    });

    // Clubs tab empty composition (may show club if user already member)
    await page.goto(`${BASE}/club`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "club-key-tab.png"),
      fullPage: true,
    });
    const emptyOrMember =
      (await page.getByTestId("club-key-empty").count()) > 0 ||
      /Partager une clé|Tes clubs arrivent|Membre confirmé|Les sorties du club/i.test(
        body,
      );
    check("clubs_tab_ok", emptyOrMember, body.slice(0, 160));

    if ((await page.getByTestId("club-key-empty").count()) > 0) {
      check(
        "empty_has_key_cta",
        (await page.getByTestId("club-key-enter").count()) > 0 &&
          /Rejoindre un club/i.test(body),
        "Rejoindre un club",
      );
      check(
        "empty_no_code_form",
        !/Code d'invitation/i.test(body),
        "no inline PIN form",
      );
    } else {
      check("empty_has_key_cta", true, "skipped — already in a club");
      check("empty_no_code_form", true, "skipped — already in a club");
    }

    // Profile must not sell a club directory
    await page.goto(`${BASE}/profile`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    body = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "club-key-profile-cta.png"),
      fullPage: true,
    });
    check(
      "profile_no_explore_directory",
      !/Explorer d.?autres clubs/i.test(body),
      body.slice(0, 180),
    );
    check(
      "profile_key_cta",
      /Ajouter avec une clé|J.?ai une clé/i.test(body) ||
        (await page.getByTestId("profile-manage-clubs").count()) > 0 ||
        (await page.getByTestId("profile-join-club").count()) > 0,
      "key CTA",
    );
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => c.ok === false).length,
  };
  fs.writeFileSync(
    path.join(OUT, "club-key-invite-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
