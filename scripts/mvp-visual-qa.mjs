/**
 * Offline DEMO_MODE visual QA — seeds auth via localStorage and captures screenshots.
 * Usage: node scripts/mvp-visual-qa.mjs
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const OUT = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
const base = "http://localhost:8081";

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("SHOT", file);
}

// Seed auth before app boot
await page.goto(base + "/onboarding", { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => {
  const user = {
    id: "user_demo_qa",
    phone: "+212612345678",
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
});

await page.goto(base + "/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
await shot("mvp-home-decouvrir.png");

const tabText = await page.evaluate(() => document.body.innerText);
console.log("--- BODY SNIPPET ---\n", tabText.slice(0, 1200));

// Click first session-like link/card if present
const clicked = await page.evaluate(() => {
  const nodes = Array.from(document.querySelectorAll("[role='button'], a, div"));
  const card = nodes.find((n) =>
    /FOOTING|FARTLEK|SERIES|CORNICHE|Ain Diab|Marina/i.test(n.textContent || ""),
  );
  if (card) {
    card.click();
    return card.textContent?.slice(0, 120) || "clicked";
  }
  return null;
});
console.log("SESSION_CLICK", clicked);
await new Promise((r) => setTimeout(r, 2000));
await shot("mvp-session-detail.png");

await page.goto(base + "/club", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
await shot("mvp-clubs.png");

await page.goto(base + "/profile", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
await shot("mvp-profil.png");

await page.goto(base + "/profile/settings", {
  waitUntil: "networkidle0",
  timeout: 60000,
});
await new Promise((r) => setTimeout(r, 2000));
await shot("mvp-settings.png");

// Desktop width
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(base + "/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
await shot("mvp-home-desktop.png");

const finalText = await page.evaluate(() => document.body.innerText);
const checks = {
  decouvrir: /Découvrir/i.test(finalText),
  mesSorties: /Mes sorties/i.test(finalText),
  clubs: /Clubs/i.test(finalText),
  profil: /Profil/i.test(finalText),
  workoutsTabAbsent: !/\bWorkouts\b/.test(finalText),
  homeEn: !/\bHome\b/.test(finalText),
};
console.log("CHECKS", JSON.stringify(checks, null, 2));

fs.writeFileSync(
  path.join(OUT, "mvp-qa-checks.json"),
  JSON.stringify({ checks, clicked, tabSnippet: tabText.slice(0, 2000) }, null, 2),
);

await browser.close();
console.log("DONE");
