/**
 * Club settings: section segments, group rename, one-time invite codes.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts/club-settings-pills-otc";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  feature: "club-settings-pills-otc",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  base: BASE,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 160));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.goto(`${BASE}/demo`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForFunction(
      () => /On sort|ACCUEIL|Clubs/i.test(document.body?.innerText || ""),
      { timeout: 45000 },
    );

    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="club-settings-form"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    check(
      "segments_visible",
      (await page.getByTestId("club-settings-segments").count()) > 0,
      "Club / Groupes / Affecter",
    );
    check(
      "club_section_default",
      /MODIFIER LE CLUB|Clé à usage unique/i.test(await page.locator("body").innerText()),
      "club section",
    );
    await shot(page, "01-club-section");

    // OTC generate
    await page.getByTestId("club-settings-regen-code").click({ force: true });
    await page.waitForTimeout(900);
    const code1 = await page.getByTestId("club-settings-access-code").inputValue();
    check("otc_generated", code1.trim().length >= 4, code1);
    await page.getByTestId("club-settings-regen-code").click({ force: true });
    await page.waitForTimeout(900);
    const code2 = await page.getByTestId("club-settings-access-code").inputValue();
    check("otc_rotates", code2.trim().length >= 4 && code2 !== code1, `${code1} → ${code2}`);
    await shot(page, "02-otc-generated");

    // Groupes segment
    await page.getByTestId("club-settings-segments-groupes").click({ force: true });
    await page.waitForTimeout(500);
    check(
      "groupes_section",
      /Groupes couleur|Rouge/i.test(await page.locator("body").innerText()),
      "groupes",
    );
    await shot(page, "03-groupes-section");

    // Open Rouge group detail + rename
    const rouge = page.getByTestId("member-org-group-g_casa_rouge");
    if ((await rouge.count()) > 0) {
      await rouge.click({ force: true });
    } else {
      await page.goto(
        `${BASE}/club/group-detail?clubId=club_casa_running&groupId=g_casa_rouge`,
        { waitUntil: "networkidle" },
      );
    }
    await page.waitForSelector('[data-testid="club-group-edit-name"]', { timeout: 20000 });
    const nameInput = page.getByTestId("club-group-edit-name");
    await nameInput.fill("Rouge élite");
    await page.getByTestId("club-group-save").click({ force: true });
    await page.waitForTimeout(900);
    check(
      "group_renamed",
      /Rouge élite/i.test(await page.locator("body").innerText()),
      "title updated",
    );
    await shot(page, "04-group-renamed");

    // Affecter segment
    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="club-settings-segments"]');
    await page.getByTestId("club-settings-segments-affecter").click({ force: true });
    await page.waitForTimeout(600);
    check(
      "affecter_section",
      /AFFECTER LES MEMBRES|Sélectionner|Sans groupe/i.test(
        await page.locator("body").innerText(),
      ),
      "affecter",
    );
    await shot(page, "05-affecter-section");
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(path.join(OUT, "smoke.json"), JSON.stringify(report, null, 2));
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
