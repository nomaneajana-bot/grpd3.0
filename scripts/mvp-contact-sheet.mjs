/**
 * Capture reference green home + core screens (phone + desktop) and build a contact sheet.
 * Persists under docs/design-reference/renders/ and /opt/cursor/artifacts/contact-sheet/
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const OUT_REPO = path.resolve("docs/design-reference/renders");
const OUT_ART = "/opt/cursor/artifacts/contact-sheet";
fs.mkdirSync(OUT_REPO, { recursive: true });
fs.mkdirSync(OUT_ART, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();

async function seedAuth() {
  await page.goto(BASE + "/onboarding", { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate(() => {
    localStorage.clear();
    const user = {
      id: "user_demo_qa",
      phone: "+212611111111",
      profileComplete: true,
    };
    const tokens = {
      accessToken: "access_demo_qa",
      expiresInSeconds: 3600,
      refreshToken: "refresh_demo_qa",
      refreshExpiresInSeconds: 86400,
    };
    localStorage.setItem("grpd_auth_user_v1", JSON.stringify(user));
    localStorage.setItem("grpd_auth_tokens_v1", JSON.stringify(tokens));
    localStorage.setItem("grpd_device_id_v1", "device_demo_qa");
    localStorage.setItem(
      "grpd_profile_v1",
      JSON.stringify({ name: "Camille Dupont", firstName: "Camille", mainGoal: "10k" }),
    );
    localStorage.setItem("grpd_use_mock_api_v1", "true");
  });
}

async function shot(name, route, viewport) {
  await page.setViewport(viewport);
  await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1600));
  const file = `${name}.png`;
  const p1 = path.join(OUT_REPO, file);
  const p2 = path.join(OUT_ART, file);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log("SHOT", file);
}

const phone = { width: 390, height: 844, deviceScaleFactor: 2 };
const desktop = { width: 1280, height: 800, deviceScaleFactor: 1 };

// Reference (public)
await page.setViewport(phone);
await page.goto(BASE + "/reference/green-home", {
  waitUntil: "networkidle0",
  timeout: 90000,
});
await new Promise((r) => setTimeout(r, 1500));
{
  const file = "00-REFERENCE-green-home-phone.png";
  await page.screenshot({ path: path.join(OUT_REPO, file), fullPage: false });
  fs.copyFileSync(path.join(OUT_REPO, file), path.join(OUT_ART, file));
  console.log("SHOT", file);
}
await page.setViewport(desktop);
await page.goto(BASE + "/reference/green-home", {
  waitUntil: "networkidle0",
  timeout: 90000,
});
await new Promise((r) => setTimeout(r, 1200));
{
  const file = "00-REFERENCE-green-home-desktop.png";
  await page.screenshot({ path: path.join(OUT_REPO, file), fullPage: false });
  fs.copyFileSync(path.join(OUT_REPO, file), path.join(OUT_ART, file));
  console.log("SHOT", file);
}

await seedAuth();

const phoneRoutes = [
  ["01-discover-phone", "/"],
  ["02-onboarding-phone", "/onboarding"],
  ["03-clubs-phone", "/club"],
  ["04-club-create-phone", "/club/create"],
  ["05-club-access-phone", "/club/access"],
  ["06-my-outings-phone", "/my-sessions"],
  ["07-outing-create-phone", "/session/create"],
  ["08-profile-phone", "/profile"],
  ["09-settings-phone", "/profile/settings"],
  ["10-training-phone", "/profile/training"],
];

for (const [name, route] of phoneRoutes) {
  await shot(name, route, phone);
}

// Session detail if a card exists
await page.setViewport(phone);
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
const sid = await page.evaluate(() => {
  const el = document.querySelector('[data-testid^="session-card-"]');
  return el?.getAttribute("data-testid")?.replace("session-card-", "") || null;
});
if (sid) {
  await shot("11-outing-detail-phone", `/session/${sid}`, phone);
}

const desktopRoutes = [
  ["01-discover-desktop", "/"],
  ["03-clubs-desktop", "/club"],
  ["06-my-outings-desktop", "/my-sessions"],
  ["08-profile-desktop", "/profile"],
];
for (const [name, route] of desktopRoutes) {
  await shot(name, route, desktop);
}

await browser.close();

// Build labeled contact sheet with ImageMagick if available
const sheetPhone = path.join(OUT_ART, "CONTACT-SHEET-phone.png");
const sheetDesk = path.join(OUT_ART, "CONTACT-SHEET-desktop.png");
const sheetRepoPhone = path.join(OUT_REPO, "CONTACT-SHEET-phone.png");
const sheetRepoDesk = path.join(OUT_REPO, "CONTACT-SHEET-desktop.png");

try {
  const phoneFiles = [
    "00-REFERENCE-green-home-phone.png",
    "01-discover-phone.png",
    "02-onboarding-phone.png",
    "03-clubs-phone.png",
    "04-club-create-phone.png",
    "05-club-access-phone.png",
    "06-my-outings-phone.png",
    "07-outing-create-phone.png",
    "08-profile-phone.png",
    "09-settings-phone.png",
    "10-training-phone.png",
    ...(sid ? ["11-outing-detail-phone.png"] : []),
  ].map((f) => path.join(OUT_ART, f));

  execSync(
    `convert ${phoneFiles.map((f) => `"${f}"`).join(" ")} -resize 280x -bordercolor '#111214' -border 8 -background '#0a0b0c' -fill '#C3D5B3' -pointsize 14 -gravity north -set caption '%t' -polaroid 0 +append -border 16 "${sheetPhone}"`,
    { stdio: "inherit" },
  );
} catch {
  // Fallback: montage without polaroid captions
  try {
    execSync(
      `cd "${OUT_ART}" && montage 00-REFERENCE-green-home-phone.png 01-discover-phone.png 02-onboarding-phone.png 03-clubs-phone.png 04-club-create-phone.png 05-club-access-phone.png 06-my-outings-phone.png 07-outing-create-phone.png 08-profile-phone.png 09-settings-phone.png 10-training-phone.png ${sid ? "11-outing-detail-phone.png" : ""} -tile 4x -geometry 240x520+8+8 -background '#111214' -label '%f' "${sheetPhone}"`,
      { stdio: "inherit" },
    );
  } catch (e) {
    console.warn("montage phone failed", e.message);
  }
}

try {
  execSync(
    `cd "${OUT_ART}" && montage 00-REFERENCE-green-home-desktop.png 01-discover-desktop.png 03-clubs-desktop.png 06-my-outings-desktop.png 08-profile-desktop.png -tile 3x -geometry 360x220+8+8 -background '#111214' -label '%f' "${sheetDesk}"`,
    { stdio: "inherit" },
  );
} catch (e) {
  console.warn("montage desktop failed", e.message);
}

if (fs.existsSync(sheetPhone)) fs.copyFileSync(sheetPhone, sheetRepoPhone);
if (fs.existsSync(sheetDesk)) fs.copyFileSync(sheetDesk, sheetRepoDesk);

fs.writeFileSync(
  path.join(OUT_ART, "manifest.json"),
  JSON.stringify(
    {
      sha: execSync("git rev-parse HEAD").toString().trim(),
      referenceRoute: "/reference/green-home",
      liveDiscover: "/",
      tokenSource: "components/experiences/ExperienceUI.tsx",
      branchSource: "origin/cursor/d03-mobile-mvp",
      phoneSheet: sheetPhone,
      desktopSheet: sheetDesk,
    },
    null,
    2,
  ),
);
fs.copyFileSync(
  path.join(OUT_ART, "manifest.json"),
  path.join(OUT_REPO, "manifest.json"),
);
console.log("DONE contact sheet");
