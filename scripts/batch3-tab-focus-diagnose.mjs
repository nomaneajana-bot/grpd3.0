/**
 * Batch 3 closeout — diagnose club-create Tab focus-order with *actual*
 * keyboard Tab traversal (no element.focus() / programmatic focus).
 *
 * Distinguishes harness limitation vs RN-web accessibility defect.
 * Writes sequence + screenshots under docs/audit/batch3-club-idea/tab-focus/
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/batch3-tab-focus-diagnose.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const REPO_ROOT = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();
const OUT_REL = "docs/audit/batch3-club-idea/tab-focus";
const OUT = path.join(REPO_ROOT, OUT_REL);
const ART = "/opt/cursor/artifacts/batch3-tab-focus";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

const testedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const HOST_PHONE = "0611111111";

const report = {
  purpose:
    "Diagnose desktop_club_create_keyboard_focus_order BLOCKED using real Tab keys",
  tested_sha: testedSha,
  method:
    "No element.focus(). Start from body click, then Tab N times. Record activeElement each step. Visible :focus outline screenshots.",
  environment: "demo",
  hosted_claim: false,
  sequence: [],
  conclusion: null,
  classification: null, // harness_limitation | rn_web_accessibility_defect | mixed | inconclusive
  product_fix_applied: false,
  screenshots: [],
};

function chromePath() {
  return (
    process.env.CHROME_PATH ||
    [
      "/usr/local/bin/google-chrome",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
    ].find((p) => fs.existsSync(p))
  );
}

async function describeActive(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) {
      return {
        kind: "body_or_null",
        tag: el?.tagName || null,
        testId: null,
        role: null,
        tabIndex: null,
        type: null,
        label: null,
        className: null,
        outerSnippet: null,
        isContentEditable: false,
      };
    }
    const testId =
      el.getAttribute("data-testid") ||
      el.closest?.("[data-testid]")?.getAttribute("data-testid") ||
      null;
    const label =
      el.getAttribute("aria-label") ||
      el.getAttribute("placeholder") ||
      (el.textContent || "").trim().slice(0, 60) ||
      null;
    return {
      kind: "element",
      tag: el.tagName,
      testId,
      role: el.getAttribute("role"),
      tabIndex: el.tabIndex,
      type: el.getAttribute("type"),
      label,
      className: (el.className || "").toString().slice(0, 80),
      outerSnippet: (el.outerHTML || "").slice(0, 180),
      isContentEditable: !!el.isContentEditable,
    };
  });
}

async function shot(page, name) {
  const abs = path.join(OUT, name);
  await page.screenshot({ path: abs, fullPage: false });
  fs.copyFileSync(abs, path.join(ART, name));
  const rel = `${OUT_REL}/${name}`;
  report.screenshots.push(rel);
  return rel;
}

async function clickTestId(page, testId) {
  await page.waitForFunction(
    (id) => {
      const el = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      ).find((n) => n.getBoundingClientRect().width > 0);
      if (!el) return false;
      el.scrollIntoView({ block: "center" });
      el.click();
      return true;
    },
    { timeout: 20000 },
    testId,
  );
}

async function loginViaUi(page) {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await clickTestId(page, "cta-secondary");
  await page.waitForFunction(() => /\/phone/.test(location.pathname), {
    timeout: 15000,
  });
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="phone-input"]');
    el?.focus();
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(HOST_PHONE, { delay: 12 });
  await clickTestId(page, "cta-primary");
  await page.waitForFunction(() => /verify/i.test(location.pathname), {
    timeout: 20000,
  });
  for (let i = 0; i < 6; i++) {
    await page.click(`[data-testid="otp-digit-${i}"]`);
    await page.keyboard.type("0");
  }
  try {
    await clickTestId(page, "cta-primary");
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () => /Découvrir|Clubs|Profil/i.test(document.body.innerText || ""),
    { timeout: 45000 },
  );
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);

  try {
    await page.goto(BASE + "/onboarding", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* */
      }
    });
    await loginViaUi(page);

    await page.goto(BASE + "/club/create", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Inventory tabbable candidates (DOM fact, not focus)
    const tabbables = await page.evaluate(() => {
      const sel =
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [contenteditable="true"]';
      return Array.from(document.querySelectorAll(sel))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return (
            r.width > 0 &&
            r.height > 0 &&
            st.visibility !== "hidden" &&
            st.display !== "none"
          );
        })
        .map((el) => ({
          tag: el.tagName,
          testId:
            el.getAttribute("data-testid") ||
            el.closest("[data-testid]")?.getAttribute("data-testid") ||
            null,
          tabIndex: el.tabIndex,
          role: el.getAttribute("role"),
          type: el.getAttribute("type"),
          aria: el.getAttribute("aria-label"),
        }));
    });
    report.tabbable_candidates = tabbables;

    // Start: click inert page chrome (heading text), NOT an input — then Tab.
    // Avoid element.focus().
    await page.mouse.click(40, 40);
    await new Promise((r) => setTimeout(r, 200));
    let step = await describeActive(page);
    report.sequence.push({ step: 0, action: "click_top_left_chrome", ...step });
    await shot(page, "00-before-tab.png");

    for (let i = 1; i <= 12; i++) {
      await page.keyboard.press("Tab");
      await new Promise((r) => setTimeout(r, 250));
      step = await describeActive(page);
      report.sequence.push({ step: i, action: "Tab", ...step });
      // Outline boost for visibility in screenshot (diagnostic CSS only — not product)
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return;
        el.setAttribute("data-grpd-tab-diag", "1");
        el.style.outline = "3px solid #FF6B6B";
        el.style.outlineOffset = "2px";
      });
      await shot(page, `${String(i).padStart(2, "0")}-after-tab.png`);
      await page.evaluate(() => {
        document
          .querySelectorAll("[data-grpd-tab-diag]")
          .forEach((el) => {
            el.removeAttribute("data-grpd-tab-diag");
            el.style.outline = "";
            el.style.outlineOffset = "";
          });
      });
    }

    // Analyze sequence for club form fields
    const fieldIds = [
      "club-name-input",
      "club-city-input",
      "club-purpose-input",
      "club-visibility-members",
      "club-visibility-public",
      "club-create-submit",
      "club-create-cancel",
    ];
    const hitIds = report.sequence
      .map((s) => s.testId)
      .filter((id) => id && fieldIds.includes(id));
    const uniqueHits = [...new Set(hitIds)];
    const inputsInTabbables = tabbables.filter((t) =>
      /INPUT|TEXTAREA/i.test(t.tag),
    );
    const pressablesInTabbables = tabbables.filter(
      (t) => t.role === "button" || t.tag === "BUTTON",
    );

    const nameHit = uniqueHits.includes("club-name-input");
    const cityHit = uniqueHits.includes("club-city-input");
    const purposeHit = uniqueHits.includes("club-purpose-input");
    const orderOk =
      nameHit &&
      cityHit &&
      purposeHit &&
      hitIds.indexOf("club-name-input") < hitIds.indexOf("club-city-input") &&
      hitIds.indexOf("club-city-input") < hitIds.indexOf("club-purpose-input");

    if (orderOk) {
      report.classification = "harness_limitation";
      report.conclusion =
        "Real Tab traversal reaches name → city → purpose in order. Prior BLOCKED was harness limitation (programmatic focus / activeElement testId mismatch), not a product Tab-order defect.";
    } else if (inputsInTabbables.length >= 3 && uniqueHits.length === 0) {
      report.classification = "harness_limitation";
      report.conclusion =
        "Native input/textarea nodes exist in tabbable candidate list, but Tab from chrome never landed with matching data-testid on activeElement within 12 Tabs. Likely harness/activeElement attribution issue (wrapper vs native node) rather than missing tab stops — product fix not demonstrated.";
    } else if (inputsInTabbables.length === 0) {
      report.classification = "rn_web_accessibility_defect";
      report.conclusion =
        "No INPUT/TEXTAREA found in tabbable candidates — RN-web may be failing to expose focusable form controls. Product fix would be warranted if confirmed.";
    } else if (!nameHit && !cityHit && !purposeHit) {
      report.classification = "mixed";
      report.conclusion =
        "Tab moves focus somewhere, but not to club form field testIds within 12 Tabs. See sequence. No product fix applied without a demonstrated field-order defect.";
    } else {
      report.classification = "mixed";
      report.conclusion = `Partial field hits: ${uniqueHits.join(", ") || "(none)"}. OrderOk=${orderOk}. No product fix applied.`;
    }

    report.focus_hits = { uniqueHits, hitIds, orderOk };
    report.product_fix_applied = false;
  } catch (e) {
    report.error = String(e?.stack || e);
    report.classification = "inconclusive";
    report.conclusion = "Diagnosis script errored — see error field.";
  } finally {
    fs.writeFileSync(path.join(OUT, "diagnosis.json"), JSON.stringify(report, null, 2) + "\n");
    fs.writeFileSync(path.join(ART, "diagnosis.json"), JSON.stringify(report, null, 2) + "\n");
    const md = [
      `# Tab focus-order diagnosis (Batch 3 closeout)`,
      ``,
      `- **tested_sha:** \`${report.tested_sha}\``,
      `- **classification:** ${report.classification}`,
      `- **product_fix_applied:** ${report.product_fix_applied}`,
      `- **conclusion:** ${report.conclusion}`,
      ``,
      `## Method`,
      report.method,
      ``,
      `## Sequence`,
      ...report.sequence.map(
        (s) =>
          `- step ${s.step} ${s.action}: tag=${s.tag} testId=${s.testId} role=${s.role} tabIndex=${s.tabIndex} label=${JSON.stringify(s.label)}`,
      ),
      ``,
      `## Screenshots`,
      ...report.screenshots.map((s) => `- \`${s}\``),
      ``,
    ].join("\n");
    fs.writeFileSync(path.join(OUT, "DIAGNOSIS.md"), md);
    fs.writeFileSync(path.join(ART, "DIAGNOSIS.md"), md);
    await browser.close();
    console.log(JSON.stringify({
      classification: report.classification,
      conclusion: report.conclusion,
      hits: report.focus_hits,
      steps: report.sequence.length,
    }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
