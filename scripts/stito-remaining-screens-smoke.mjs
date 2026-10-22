/**
 * Stito remaining screens smoke — Clubs / Create / Organise / Invitations / Profile.
 * Demo web only — not native/hosted/UAT.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8083";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/stito-remaining-screens";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(AUDIT, { recursive: true });
fs.mkdirSync(path.join(AUDIT, "screenshots"), { recursive: true });

const report = {
  batch: "stito-remaining-screens",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  data_mode: "demo",
  base: BASE,
  checks: [],
  screenshots: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
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

async function shot(page, name) {
  const file = `${name}.png`;
  const abs = path.join(OUT, file);
  const auditAbs = path.join(AUDIT, "screenshots", file);
  await page.screenshot({ path: abs, fullPage: false });
  fs.copyFileSync(abs, auditAbs);
  report.screenshots.push(`docs/audit/stito-remaining-screens/screenshots/${file}`);
  console.log("SHOT", abs);
}

async function canvasIsLight(page) {
  // RN Web often omits solid backgrounds from getComputedStyle; sample pixels.
  const buf = await page.screenshot({ type: "png" });
  // PNG: read a few pixels via sharp-less decode — use page.evaluate on canvas draw.
  return page.evaluate(async (b64) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/png" });
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const points = [
      [40, 40],
      [Math.floor(bmp.width / 2), 80],
      [Math.floor(bmp.width / 2), Math.floor(bmp.height / 3)],
      [20, Math.floor(bmp.height / 2)],
    ];
    let light = 0;
    const samples = [];
    for (const [x, y] of points) {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      samples.push({ x, y, r, g, b, luminance });
      if (luminance > 0.75) light += 1;
    }
    return { ok: light >= 2, light, samples };
  }, buf.toString("base64"));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  try {
    await login(page, "0708060337");

    // Clubs
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    const clubsText = await page.locator("body").innerText();
    check("clubs_title", /Clubs/i.test(clubsText), "header");
    check(
      "clubs_no_actif_aujourdhui",
      !/Actif aujourd.?hui/i.test(clubsText),
      "handoff exclusion",
    );
    const clubsLight = await canvasIsLight(page);
    check("clubs_light_canvas", clubsLight.ok, JSON.stringify(clubsLight));
    await shot(page, "stito-clubs-393");

    // Create club
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const createText = await page.locator("body").innerText();
    check(
      "create_heading",
      /Fonder un club|Créer un club/i.test(createText),
      "create title",
    );
    check(
      "create_no_valide_badge",
      !/\bValide\b/i.test(createText),
      "handoff exclusion",
    );
    check(
      "create_visibility_two_only",
      /Sur invitation/i.test(createText) &&
        /Public/i.test(createText) &&
        !/Sur demande & validation|Privé sur invitation/i.test(createText),
      "supported enums only",
    );
    check(
      "create_membership_note",
      /ne t.?inscrit à aucune sortie/i.test(createText),
      "membership ≠ outing",
    );
    const createLight = await canvasIsLight(page);
    check("create_light_canvas", createLight.ok, JSON.stringify(createLight));
    await shot(page, "stito-create-club-393");

    // Organise outing
    await page.goto(`${BASE}/session/create`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);
    const orgText = await page.locator("body").innerText();
    check(
      "organise_title",
      /Organiser une sortie|Modifier la sortie/i.test(orgText),
      "FR title",
    );
    check(
      "organise_no_club_officiel",
      !/Club officiel/i.test(orgText),
      "handoff exclusion",
    );
    check(
      "organise_no_gps_valide",
      !/Point GPS valid/i.test(orgText),
      "handoff exclusion",
    );
    const orgLight = await canvasIsLight(page);
    check("organise_light_canvas", orgLight.ok, JSON.stringify(orgLight));
    await shot(page, "stito-organise-393");

    // Invitations (access)
    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const invText = await page.locator("body").innerText();
    check("invitations_title", /Invitations/i.test(invText), "title");
    check(
      "invitations_no_vip",
      !/\bVIP\b/i.test(invText),
      "handoff exclusion",
    );
    check(
      "invitations_membership_note",
      /ne t.?inscrit à aucune sortie/i.test(invText),
      "membership ≠ outing",
    );
    const invLight = await canvasIsLight(page);
    check("invitations_light_canvas", invLight.ok, JSON.stringify(invLight));
    await shot(page, "stito-invitations-393");

    // Inbox
    await page.goto(`${BASE}/inbox`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const inboxText = await page.locator("body").innerText();
    check("inbox_title", /Invitations/i.test(inboxText), "inbox title");
    const inboxLight = await canvasIsLight(page);
    check("inbox_light_canvas", inboxLight.ok, JSON.stringify(inboxLight));
    await shot(page, "stito-inbox-393");

    // Profile
    await page.goto(`${BASE}/profile`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);
    const profText = await page.locator("body").innerText();
    check("profile_title", /Profil/i.test(profText), "title");
    check(
      "profile_no_fake_km_strip",
      !/Parcourus/i.test(profText) && !/\b68\s*km\b/i.test(profText),
      "no prototype telemetry",
    );
    check(
      "profile_prefs_or_clubs",
      /Préférences|CLUBS|collectifs|Langue/i.test(profText),
      "sections",
    );
    const profLight = await canvasIsLight(page);
    check("profile_light_canvas", profLight.ok, JSON.stringify(profLight));
    await shot(page, "stito-profile-393");
  } catch (e) {
    check("smoke_exception", false, e?.stack || String(e));
    try {
      await shot(page, "stito-remaining-error");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail, total: report.checks.length };
    const jsonPath = path.join(OUT, "stito-remaining-screens-smoke.json");
    const auditJson = path.join(AUDIT, "stito-remaining-screens-smoke.json");
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(auditJson, JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary);
    await browser.close();
    if (fail > 0) process.exitCode = 1;
  }
}

main();
