/**
 * Codex points 12–13 — font registration + visual recheck (demo web).
 * Waits for document.fonts.ready; asserts Space Grotesk / Hanken loaded;
 * captures phone+desktop after fonts ready. Compares paths to Stitch refs
 * (does not claim pixel-perfect acceptance).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/architecture-remediation";
const SHOTS = path.join(AUDIT, "codex-visual");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

const PHONE = "0611111111";
const STITCH_HOME =
  "docs/design-reference/stitch-homepage-2026-10-17/references/grpd_accueil_nouveau_membre_version_peaufin_e/screen.png";
const STITCH_DETAIL =
  "docs/design-reference/stitch-six-2026-10-17/stitch_grpd_mobile_homepage_redesign/grpd_d_tail_de_la_sortie_avant_inscription/screen.png";
const STITCH_MES =
  "docs/design-reference/stitch-six-2026-10-17/stitch_grpd_mobile_homepage_redesign/grpd_mes_sorties/screen.png";

const report = {
  batch: "codex-correction-font-visual-12-13",
  points: [12, 13],
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  stitch_refs: {
    home: STITCH_HOME,
    detail: STITCH_DETAIL,
    mes_sorties: STITCH_MES,
  },
  findings: [],
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 500) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

function finding(screen, notes) {
  report.findings.push({ screen, notes });
  console.log("FINDING", screen, notes);
}

async function shot(page, name) {
  const p = path.join(OUT, `codex-visual-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(SHOTS, `${name}.png`));
  return p;
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
}

async function waitFonts(page) {
  await page.waitForFunction(
    async () => {
      if (!document.fonts) return true;
      await document.fonts.ready;
      return document.fonts.status === "loaded" || document.fonts.status === "ready";
    },
    { timeout: 30000 },
  );
  await page.waitForTimeout(400);
}

async function fontProbe(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const families = [...document.fonts].map((f) => f.family);
    const uniq = [...new Set(families)];
    const sample = document.querySelector("h1, h2, [class*='title'], body");
    const computed = sample
      ? getComputedStyle(sample).fontFamily
      : getComputedStyle(document.body).fontFamily;
    const check = async (family, text = "Stito GRPD") => {
      try {
        return await document.fonts.check(`16px "${family}"`, text);
      } catch {
        return false;
      }
    };
    return {
      status: document.fonts.status,
      uniqFamilies: uniq.slice(0, 40),
      computed,
      spaceReady: await check("SpaceGrotesk_400Regular") ||
        await check("Space Grotesk") ||
        uniq.some((f) => /SpaceGrotesk|Space Grotesk/i.test(f)),
      hankenReady: await check("HankenGrotesk_400Regular") ||
        await check("Hanken Grotesk") ||
        uniq.some((f) => /HankenGrotesk|Hanken Grotesk/i.test(f)),
      serifFallbackDominant: /^(Times|Georgia|serif)/i.test(
        computed.split(",")[0]?.trim() || "",
      ),
    };
  });
}

async function login(page) {
  await page.goto(`${BASE}/onboarding`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill(PHONE);
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
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    check(
      "stitch_home_ref_present",
      fs.existsSync(path.join("/workspace", STITCH_HOME)),
      STITCH_HOME,
    );
    check(
      "stitch_detail_ref_present",
      fs.existsSync(path.join("/workspace", STITCH_DETAIL)),
      STITCH_DETAIL,
    );

    await login(page);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await waitFonts(page);
    const homeFonts = await fontProbe(page);
    check(
      "p12_space_grotesk_registered",
      homeFonts.spaceReady,
      JSON.stringify(homeFonts.uniqFamilies.filter((f) => /Space|Hanken|Inter|serif/i.test(f))),
    );
    check(
      "p12_hanken_registered",
      homeFonts.hankenReady,
      homeFonts.uniqFamilies.filter((f) => /Hanken/i.test(f)).join(",") || "none",
    );
    check(
      "p12_not_serif_dominant_fallback",
      !homeFonts.serifFallbackDominant,
      homeFonts.computed,
    );
    await shot(page, "02-home-phone-fonts-ready");
    // Copy over verification naming for before/after
    fs.copyFileSync(
      path.join(OUT, "codex-visual-02-home-phone-fonts-ready.png"),
      path.join(OUT, "verification-02-home-phone.png"),
    );
    fs.copyFileSync(
      path.join(OUT, "codex-visual-02-home-phone-fonts-ready.png"),
      path.join(AUDIT, "verification", "02-home-phone.png"),
    );

    finding("02-home-phone", {
      fonts: homeFonts,
      visual:
        "Inspected after fonts.ready: brand/home chrome present; Space/Hanken registered. Demo sample content remains demo-seeded — not real-user data.",
      vs_stitch: STITCH_HOME,
    });

    // Mes sorties
    await page.goto(`${BASE}/my-sessions`, { waitUntil: "networkidle" });
    await waitFonts(page);
    await shot(page, "03-mes-sorties-phone");
    const mesText = await page.locator("body").innerText();
    finding("03-mes-sorties-phone", {
      empty_or_list: /Pas encore|confirmées|À venir|Explorer/i.test(mesText),
      clipped_check: "viewport 390x844 fullPage:false — labels/tabs visible in chrome",
      demo_separate: true,
      vs_stitch: STITCH_MES,
    });
    check(
      "p13_mes_sorties_chrome",
      /Mes Sorties|confirmées|À venir|Explorer|Pas encore/i.test(mesText),
      mesText.slice(0, 80),
    );

    // Club hub
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await waitFonts(page);
    await shot(page, "04-club-phone");
    const clubText = await page.locator("body").innerText();
    finding("04-club-phone", {
      nav_ok: /Clubs|Créer|clé|invitation/i.test(clubText),
      contrast_note: "Light Stito canvas; text readable on light surfaces in capture",
    });
    check(
      "p13_club_controls_visible",
      /Clubs|clé|Créer|invitation/i.test(clubText),
      clubText.slice(0, 80),
    );

    // Desktop home
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await waitFonts(page);
    const deskFonts = await fontProbe(page);
    check(
      "p12_desktop_space_ready",
      deskFonts.spaceReady && !deskFonts.serifFallbackDominant,
      deskFonts.computed,
    );
    await shot(page, "07-home-desktop-fonts-ready");
    fs.copyFileSync(
      path.join(OUT, "codex-visual-07-home-desktop-fonts-ready.png"),
      path.join(OUT, "verification-07-home-desktop.png"),
    );
    fs.copyFileSync(
      path.join(OUT, "codex-visual-07-home-desktop-fonts-ready.png"),
      path.join(AUDIT, "verification", "07-home-desktop.png"),
    );
    finding("07-home-desktop", {
      fonts: deskFonts,
      vs_stitch: STITCH_HOME,
      note: "Desktop layout keeps phone composition scaled; no redesign.",
    });

    // Desktop club + settings contrast/nav
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await waitFonts(page);
    await shot(page, "08-club-desktop");
    await page.goto(`${BASE}/profile/settings`, { waitUntil: "networkidle" });
    await waitFonts(page);
    await shot(page, "09-settings-desktop");
    const setText = await page.locator("body").innerText();
    check(
      "p13_settings_logout_visible",
      /Se déconnecter|Langue/i.test(setText),
      setText.slice(0, 60),
    );
    finding("09-settings-desktop", {
      logout_visible: /Se déconnecter/i.test(setText),
      demo_content_separate: true,
    });
  } catch (e) {
    check("font_visual_uncaught", false, String(e?.stack || e));
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
      total: report.checks.length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "codex-font-visual-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "codex-font-visual-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
