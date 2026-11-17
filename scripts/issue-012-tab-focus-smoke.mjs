/**
 * ISSUE-012 — real Tab traversal on /club/create (no element.focus()).
 * Demo keyboard order only — not full a11y UAT.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  issue: "ISSUE-012",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  method: "real Tab keys from body; no element.focus()",
  hosted_claim: false,
  full_a11y_claim: false,
  sequence: [],
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 240) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

async function describeActive(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) {
      return { kind: "body", testId: null, tag: el?.tagName || null };
    }
    const testId =
      el.getAttribute("data-testid") ||
      el.closest?.("[data-testid]")?.getAttribute("data-testid") ||
      null;
    return {
      kind: "element",
      testId,
      tag: el.tagName,
      label: el.getAttribute("aria-label") || el.getAttribute("placeholder"),
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  try {
    await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    // Lightweight auth so create screen is reachable if gated — try direct
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);

    // If redirected to auth, login quickly
    if (/phone|onboarding|verify/i.test(page.url())) {
      await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
      await page.getByText(/J'ai déjà un compte/i).last().click({ force: true });
      await page.waitForTimeout(600);
      await page.getByTestId("phone-input").fill("0611111111");
      await page.getByText(/Recevoir|Continuer|Envoyer/i).last().click({ force: true });
      await page.waitForTimeout(800);
      for (let i = 0; i < 6; i++) {
        await page.getByTestId(`otp-digit-${i}`).click({ force: true });
        await page.keyboard.type("0");
      }
      try {
        await page.getByText(/^Vérifier$/i).last().click({ force: true });
      } catch {}
      await page.waitForTimeout(1500);
      await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
    }

    check(
      "club_create_screen",
      Boolean(await page.getByTestId("club-create-screen").count()) ||
        Boolean(await page.getByTestId("club-name-input").count()),
      page.url(),
    );

    await page.locator("body").click({ position: { x: 8, y: 8 } });
    await page.waitForTimeout(200);

    const expectedOrder = [
      "club-name-input",
      "club-city-input",
      "club-purpose-input",
    ];
    const seen = [];
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(80);
      const active = await describeActive(page);
      report.sequence.push(active);
      if (active.testId && expectedOrder.includes(active.testId) && !seen.includes(active.testId)) {
        seen.push(active.testId);
      }
    }

    check(
      "tab_reaches_name_city_purpose_in_order",
      seen[0] === "club-name-input" &&
        seen[1] === "club-city-input" &&
        seen[2] === "club-purpose-input",
      JSON.stringify(seen),
    );

    // Labels present
    const nameLabel = await page.getByTestId("club-name-input").getAttribute("aria-label");
    check("name_has_accessible_label", /nom/i.test(nameLabel || ""), nameLabel);

    await page.screenshot({
      path: path.join(OUT, "issue-012-tab-focus.png"),
      fullPage: true,
    });
  } catch (e) {
    check("issue_012_uncaught", false, String(e));
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(path.join(OUT, "issue-012-tab-focus-smoke.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
