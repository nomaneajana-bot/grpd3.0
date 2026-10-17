/**
 * ISSUE-015 visual fix regression — detail→join→Mes sorties→cancel→reload
 * + light contrast / compact hero / pace cohesion checks.
 * Demo web only.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8090";
const OUT = "/opt/cursor/artifacts/outing-detail-light-fix";
const REPO_EV = "docs/audit/outing-detail-stito";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REPO_EV, { recursive: true });

const report = {
  batch: "outing-detail-light-fix",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  data_mode: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  viewport: "393x852",
  reference: {
    light_primary:
      "docs/design-reference/noa-stito/src/screens/OutingDetailScreen.tsx",
    light_tokens: "docs/design-reference/noa-stito/src/index.css",
    stitch_homepage_six_file_pack:
      "docs/design-reference/stitch-homepage-2026-10-17/",
    rejected_dark_mislabeled:
      "docs/design-reference/renders/11-outing-detail-phone.png (was incorrectly copied as reference-stitch-outing-detail-phone.png)",
    light_capture: "reference-stitch-light-outing-detail.png",
  },
  checks: [],
  journey: {},
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 180));
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
  console.log("SHOT", p, fullPage ? "(full)" : "");
  return p;
}

/** Sample computed color of Infos tab — must not be near-white on light canvas. */
async function assertAccessibleInfos(page) {
  const sample = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("div,span,p,button"));
    const infos = nodes.find(
      (n) => (n.textContent || "").trim() === "Infos" && n.children.length === 0,
    );
    if (!infos) return null;
    const cs = getComputedStyle(infos);
    const color = cs.color;
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return { color, ok: false };
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Near-white text (~0.95+) on white canvas fails; ink should be dark (<0.55).
    return { color, r, g, b, luminance, ok: luminance < 0.55 };
  });
  check(
    "infos_accessible_contrast",
    Boolean(sample?.ok),
    sample ? JSON.stringify(sample) : "Infos node missing",
  );
}

async function assertHeroCompact(page) {
  const box = await page.getByTestId("stito-outing-hero").boundingBox();
  const ok = box && box.height <= 220 && box.height >= 100;
  check(
    "hero_compact",
    Boolean(ok),
    box ? `h=${Math.round(box.height)} w=${Math.round(box.width)}` : "missing",
  );
  const ctx = await page.getByTestId("stito-outing-hero").innerText();
  check(
    "public_label_not_truncated",
    /Session publique/i.test(ctx) && !/SESSION PUBLIQUE\s*·\s*CORNIC\.\.\./i.test(ctx),
    ctx.slice(0, 120),
  );
}

async function assertPaceCoherent(page) {
  const text = await page.locator("body").innerText();
  // Fail if we see a bare "/km" line or split like "5:30–" alone near metrics.
  const badDetached = /(^|\n)\s*\/km\s*(\n|$)/m.test(text);
  const hasPace =
    /\d[:']\d{2}\s*[–\-]\s*\d[:']\d{2}\s*\/km/i.test(text) ||
    /Allure libre|km\/h/i.test(text);
  check("pace_not_detached_unit", !badDetached && hasPace, hasPace ? "coherent" : "missing pace");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  try {
    await login(page, "0708060337");

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    check("homepage_on_sort", Boolean(await page.getByTestId("home-title").count()), "On sort ?");
    await shot(page, "current-homepage-393.png");

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

    await assertAccessibleInfos(page);
    await assertHeroCompact(page);
    await assertPaceCoherent(page);

    check(
      "no_fake_map_modal_chrome",
      !/Ouvrir dans Maps|Point de rassemblement GPS|Anfa Park Casablanca \(33/i.test(
        await page.locator("body").innerText(),
      ),
      "no fake map UI",
    );
    check(
      "no_vip_verified_badge",
      !/\bVIP\b|Édition crépuscule/i.test(await page.locator("body").innerText()),
      "no invented badges",
    );

    await shot(page, "current-outing-detail-393.png");
    await shot(page, "current-outing-detail-393-full.png", { fullPage: true });

    const joinCta = page.getByTestId("stito-join-cta");
    await joinCta.click({ force: true });
    await page.waitForTimeout(1800);
    if (!(await page.getByText(/inscrit|Place réservée|Se désister/i).count())) {
      const alt = page.getByText(/M'inscrire à cette sortie|Rejoindre/i);
      if (await alt.count()) {
        await alt.last().click({ force: true });
        await page.waitForTimeout(1500);
      }
    }
    const bodyAfterJoin = await page.locator("body").innerText();
    const joinedUi =
      /Se désister|Place réservée|Tu es inscrit|Inscription enregistrée|Confirmé/i.test(
        bodyAfterJoin,
      );
    check("joined_on_detail", joinedUi, "joined UI");
    report.journey.joinedOnDetail = joinedUi;
    await assertAccessibleInfos(page);
    await shot(page, "current-outing-detail-joined-393.png");
    await shot(page, "current-outing-detail-joined-393-full.png", { fullPage: true });

    // Toast should not sit over logistics if present; placement top
    if (await page.getByTestId("app-toast").count()) {
      const toastBox = await page.getByTestId("app-toast").boundingBox();
      const logistics = await page.getByTestId("stito-logistics-card").boundingBox();
      const sticky = await page.getByTestId("stito-sticky-join").boundingBox();
      const clearOfCta =
        toastBox && sticky ? toastBox.y + toastBox.height < sticky.y - 8 : true;
      const clearOfLogistics =
        toastBox && logistics
          ? toastBox.y + toastBox.height < logistics.y || toastBox.y > logistics.y + logistics.height
          : true;
      check(
        "toast_clear_of_cta_content",
        clearOfCta && clearOfLogistics,
        JSON.stringify({ toastBox, logisticsY: logistics?.y, stickyY: sticky?.y }),
      );
    } else {
      check("toast_clear_of_cta_content", true, "toast already dismissed — ok");
    }

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
    const joinAgain = /M'inscrire à cette sortie/i.test(bodyReload);
    check("reload_not_joined", joinAgain || !stillJoined, `joinAgain=${joinAgain}`);
    await assertAccessibleInfos(page);
    await shot(page, "current-outing-detail-after-cancel-393.png");
    await shot(page, "current-outing-detail-after-cancel-393-full.png", { fullPage: true });

    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(400);
    await assertHeroCompact(page);
    await assertPaceCoherent(page);
    await shot(page, "current-outing-detail-320.png");
    check("narrow_320_hero", Boolean(await page.getByTestId("stito-outing-hero").count()), "320");

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

    check(
      "reference_light_identified",
      fs.existsSync("docs/design-reference/noa-stito/src/screens/OutingDetailScreen.tsx") &&
        fs.existsSync(
          "docs/design-reference/stitch-homepage-2026-10-17/references/grpd_accueil_membre_actif_version_peaufin_e/screen.png",
        ),
      "Noa-Stito OutingDetail + Stitch homepage six-file pack",
    );
  } catch (e) {
    check("uncaught", false, String(e));
    await shot(page, "outing-detail-light-fix-error.png", { fullPage: true }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    const json = JSON.stringify(report, null, 2);
    fs.writeFileSync(path.join(OUT, "outing-detail-light-fix-smoke.json"), json);
    fs.writeFileSync(path.join(REPO_EV, "evidence.json"), json);
    fs.writeFileSync(path.join(REPO_EV, "outing-detail-light-fix-smoke.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
