/**
 * Club settings Stito light — demo coach reaches real Paramètres form.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8081";
const OUT = "/opt/cursor/artifacts/club-settings-light";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  feature: "club-settings-light",
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
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {
      /* ignore */
    }
  });

  try {
    await page.goto(`${BASE}/demo`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForFunction(
      () =>
        /On sort|Découvrir|Mes sorties|Clubs|Profil|ACCUEIL/i.test(
          document.body?.innerText || "",
        ),
      { timeout: 45000 },
    );
    await shot(page, "01-demo-home");

    // Clubs tab
    const clubsTab = page.getByText(/^CLUBS$/i).last();
    if (await clubsTab.isVisible().catch(() => false)) {
      await clubsTab.click({ force: true });
      await page.waitForTimeout(1200);
    } else {
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
    }

    // Scroll RN hub until Paramètres nav is in view
    await page.evaluate(() => {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        if (/Paramètres du club/i.test(n.textContent || "")) {
          const el = n.parentElement;
          let p = el;
          while (p) {
            if (p.scrollHeight > p.clientHeight + 20) p.scrollTop = p.scrollHeight;
            p = p.parentElement;
          }
          el?.scrollIntoView({ block: "center", behavior: "instant" });
          break;
        }
      }
    });
    await page.waitForTimeout(400);

    const settingsNav = page.getByTestId("club-settings-nav");
    const adminVisible = await settingsNav.isVisible().catch(() => false);
    check("admin_section_visible", adminVisible, "club-settings-nav");
    await shot(page, "02-club-hub-admin");

    if (adminVisible) {
      await settingsNav.click({ force: true });
      await page.waitForTimeout(1500);
    } else {
      await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
    }

    await page.waitForSelector('[data-testid="club-settings-form"], [data-testid="club-settings-denied"]', {
      timeout: 20000,
    });

    const formVisible = await page
      .getByTestId("club-settings-form")
      .isVisible()
      .catch(() => false);
    const deniedVisible = await page
      .getByTestId("club-settings-denied")
      .isVisible()
      .catch(() => false);
    const body = await page.locator("body").innerText();

    check("settings_form_visible", formVisible, body.slice(0, 160));
    check("settings_not_denied", !deniedVisible, `denied=${deniedVisible}`);
    check(
      "settings_has_identity_fields",
      formVisible &&
        /MODIFIER LE CLUB/i.test(body) &&
        /Enregistrer le club/i.test(body),
      body.slice(0, 200),
    );
    check(
      "settings_has_member_org",
      formVisible && /ORGANISER LES MEMBRES|Groupes couleur/i.test(body),
      body.slice(0, 160),
    );
    check(
      "settings_not_empty_dark_shell",
      formVisible &&
        !/^[\s\S]*Paramètres du club\s+Espace réservé[\s\S]*CLUBS[\s\S]*$/.test(
          body.replace(/\n+/g, " "),
        ),
      "form present instead of empty reserved shell",
    );

    // Light canvas check via computed style on root settings view
    const bg = await page.evaluate(() => {
      const el =
        document.querySelector('[data-testid="club-settings-form"]')?.parentElement ||
        document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    // Stito canvas is light (#F8F7F4-ish) — not dark navy
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    check(
      "settings_light_canvas",
      luminance > 0.55,
      `bg=${bg} luminance=${luminance.toFixed(2)}`,
    );

    await shot(page, "03-settings-form");

    // Scroll to member org + screenshot
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);
    await shot(page, "04-settings-member-org");

    // Direct deep link still works after wipe? Re-enter demo clears — skip wipe.
    // Confirm name field editable
    const nameInput = page.getByTestId("club-settings-name");
    if (await nameInput.isVisible().catch(() => false)) {
      const before = await nameInput.inputValue();
      check("settings_name_prefilled", before.trim().length > 0, before);
    }
  } finally {
    await browser.close();
  }

  report.summary = {
    pass: report.checks.filter((c) => c.ok).length,
    fail: report.checks.filter((c) => !c.ok).length,
  };
  fs.writeFileSync(
    path.join(OUT, "smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("SUMMARY", report.summary);
  if (report.summary.fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
