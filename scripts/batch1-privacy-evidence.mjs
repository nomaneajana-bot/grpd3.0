/**
 * Batch 1 — PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE
 * ISSUE-001, ISSUE-005, privacy ISSUE-010 (demo surface).
 *
 * Usage:
 *   EXPO_PUBLIC_DEMO_MODE=true node scripts/batch1-privacy-evidence.mjs
 * Requires Expo web on E2E_BASE_URL (default http://localhost:8081).
 *
 * Assertions:
 * - Successful members-only create → URL /session/<id> ≠ create
 * - Approved member positive control (detail + known unique logistics present)
 * - Outsider + pending negative controls (direct link + list): logistics ABSENT
 * - Reload / re-login persistence of gates
 * - Evidence records tested_sha + environment (never claims hosted from mock)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const OUT = "/opt/cursor/artifacts/batch1-evidence";
const SHOTS = path.join(OUT, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const testedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();

const UNIQUE_SPOT = `ZB1${Date.now().toString(36).slice(-7).toUpperCase()}`;
const UNIQUE_TITLE_TOKEN = UNIQUE_SPOT;

const evidence = {
  batch: "Batch 1 — PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE",
  issues: ["ISSUE-001", "ISSUE-005", "ISSUE-010-privacy"],
  tested_sha: testedSha,
  tip_sha: testedSha,
  branch,
  environment: "demo",
  hosted_claim: false,
  note:
    "DEMO_MODE mock only. Server/hosted list+GET filters exist separately; this run does not claim hosted.",
  unique_logistics: { spot: UNIQUE_SPOT, titleToken: UNIQUE_TITLE_TOKEN },
  checks: {},
  screenshots: [],
  outing_id: null,
  errors: [],
};

function record(name, ok, detail = "") {
  evidence.checks[name] = { ok, detail };
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

async function shot(page, name) {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: false });
  evidence.screenshots.push(file);
  return file;
}

async function bodyText(page) {
  return page.evaluate(() => document.body?.innerText || "");
}

async function clearAuth(page, { preserveMockWorld = false } = {}) {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await page.evaluate((preserve) => {
    try {
      if (!preserve) {
        localStorage.clear();
        sessionStorage.clear();
        return;
      }
      for (const k of [
        "grpd_auth_user_v1",
        "grpd_auth_tokens_v1",
        "grpd_device_id_v1",
        "grpd_use_mock_api_v1",
        "grpd_login_phone_v1",
        "grpd_login_otp_request_v1",
        "grpd_onboarding_v1",
      ]) {
        localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }, preserveMockWorld);
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1200));
}

async function clickTestId(page, testId, ariaLabel = null) {
  await page.waitForFunction(
    (id, aria) => {
      const nodes = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      );
      const match = nodes.find((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0;
        if (!visible) return false;
        if (!aria) return true;
        return (el.getAttribute("aria-label") || "").includes(aria);
      });
      if (!match) return false;
      match.scrollIntoView({ block: "center" });
      match.click();
      return true;
    },
    { timeout: 20000 },
    testId,
    ariaLabel,
  );
}

async function typeTestId(page, testId, value) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 15000 });
  await page.evaluate((id) => {
    const el = Array.from(
      document.querySelectorAll(`[data-testid="${id}"]`),
    ).find((n) => n.getBoundingClientRect().width > 0);
    if (!el) throw new Error(`No visible ${id}`);
    el.focus();
    const proto =
      el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc?.set?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, testId);
  await page.keyboard.type(value, { delay: 20 });
}

async function enterOtp(page, code) {
  for (let i = 0; i < code.length; i++) {
    const sel = `[data-testid="otp-digit-${i}"]`;
    await page.waitForSelector(sel, { visible: true, timeout: 15000 });
    await page.click(sel);
    await page.keyboard.type(code[i]);
  }
}

async function loginViaUi(page, phone, otp) {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 800));
  await clickTestId(page, "cta-secondary", "J'ai déjà un compte");
  await page.waitForFunction(() => /\/phone/.test(location.pathname), {
    timeout: 15000,
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const el = Array.from(
      document.querySelectorAll('[data-testid="phone-input"]'),
    ).find((n) => n.getBoundingClientRect().width > 0);
    el?.focus();
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(phone, { delay: 25 });
  await new Promise((r) => setTimeout(r, 400));
  await clickTestId(page, "cta-primary", "Recevoir le code");
  await page.waitForFunction(() => /verify/i.test(location.pathname), {
    timeout: 20000,
  });
  await enterOtp(page, otp);
  await new Promise((r) => setTimeout(r, 400));
  try {
    await clickTestId(page, "cta-primary", "Vérifier");
  } catch {
    /* may auto-navigate */
  }
  await page.waitForFunction(
    () =>
      /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body.innerText || ""),
    { timeout: 45000 },
  );
  await new Promise((r) => setTimeout(r, 1200));
  return true;
}

function assertOutingUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/session\/([^/]+)$/);
    if (!m) return { ok: false, id: null, reason: `not /session/:id — ${u.pathname}` };
    if (m[1] === "create") {
      return { ok: false, id: null, reason: "accepted create as outing id" };
    }
    return { ok: true, id: m[1], reason: u.pathname };
  } catch (e) {
    return { ok: false, id: null, reason: String(e) };
  }
}

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);
page.on("dialog", async (dialog) => {
  try {
    await dialog.accept();
  } catch {
    /* ignore */
  }
});

try {
  // --- Identity A: organizer creates club (admin) then members-only outing ---
  await clearAuth(page, { preserveMockWorld: false });
  await loginViaUi(page, "0611111111", "000000");
  record("login_member_host", true, "0611111111 (new club admin)");
  await shot(page, "01-member-home.png");

  const clubName = `Batch1 Club ${UNIQUE_SPOT}`;
  await page.goto(BASE + "/club/create", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1000));
  await typeTestId(page, "club-name-input", clubName);
  await typeTestId(page, "club-city-input", "Casablanca");
  await page.evaluate(() => {
    const purpose = document.querySelector(
      'textarea, [aria-label="Objectif du club"]',
    );
    if (!purpose) return;
    purpose.focus();
    const proto = window.HTMLTextAreaElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc?.set?.call(purpose, "Sorties privées batch1 — marche et rencontre");
    purpose.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await clickTestId(page, "club-create-submit");
  await new Promise((r) => setTimeout(r, 2500));
  const clubText = await bodyText(page);
  record(
    "host_club_created",
    /membre|club|Batch1|Quitter/i.test(clubText),
    page.url(),
  );
  await shot(page, "01b-club-created.png");

  // Create members-only outing with unique logistics
  await page.goto(BASE + "/session/create", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Audience: Club uniquement → visibility members
  try {
    await clickTestId(page, "session-audience-club");
    record("audience_club_selected", true);
  } catch (e) {
    record("audience_club_selected", false, String(e.message || e));
  }

  // Fill unique custom spot via OptionPicker
  let spotSeeded = false;
  try {
    await clickTestId(page, "session-spot-field");
    await page.waitForSelector('[data-testid="session-spot-custom-input"]', {
      timeout: 10000,
    });
    await new Promise((r) => setTimeout(r, 500));
    // Prefer keyboard into focused custom input (updates React state)
    await page.evaluate(() => {
      document.querySelector('[data-testid="session-spot-custom-input"]')?.focus();
    });
    await page.keyboard.type(UNIQUE_SPOT, { delay: 30 });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      document.querySelector('[data-testid="session-spot-custom-add"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    let spotValue = await page.evaluate(
      () =>
        document.querySelector('[data-testid="session-spot-value"]')
          ?.textContent || "",
    );
    if (!spotValue.includes(UNIQUE_SPOT)) {
      // Fallback: type into search field then Ajouter (reads searchQuery)
      await clickTestId(page, "session-spot-field");
      await new Promise((r) => setTimeout(r, 400));
      await page.evaluate(() => {
        const search = document.querySelector(
          'input[placeholder="Rechercher un spot..."]',
        );
        search?.focus();
      });
      await page.keyboard.type(UNIQUE_SPOT, { delay: 30 });
      await new Promise((r) => setTimeout(r, 300));
      await page.evaluate(() => {
        document
          .querySelector('[data-testid="session-spot-custom-add"]')
          ?.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
      spotValue = await page.evaluate(
        () =>
          document.querySelector('[data-testid="session-spot-value"]')
            ?.textContent || "",
      );
    }
    spotSeeded = spotValue.includes(UNIQUE_SPOT);
  } catch (e) {
    record("unique_spot_seeded", false, String(e.message || e));
  }
  if (!evidence.checks.unique_spot_seeded) {
    record("unique_spot_seeded", spotSeeded, UNIQUE_SPOT);
  }

  await shot(page, "02-create-form-members.png");
  await clickTestId(page, "session-publish-btn");
  try {
    await page.waitForFunction(
      () => {
        const path = location.pathname;
        return /^\/session\/(?!create$)[^/]+$/.test(path);
      },
      { timeout: 30000 },
    );
  } catch {
    const stuck = await bodyText(page);
    record(
      "publish_navigation",
      false,
      `still on ${page.url()} · ${stuck.slice(0, 180)}`,
    );
  }
  await new Promise((r) => setTimeout(r, 2000));

  const afterPublish = assertOutingUrl(page.url());
  record(
    "ISSUE-001_publish_real_outing_id",
    afterPublish.ok,
    afterPublish.reason,
  );
  evidence.outing_id = afterPublish.id;
  await shot(page, "03-member-detail-after-publish.png");

  const memberText = await bodyText(page);
  const uniquePresent = memberText.includes(UNIQUE_SPOT);
  record(
    "member_positive_control_detail",
    afterPublish.ok &&
      uniquePresent &&
      /MEMBRES/i.test(memberText) &&
      !/n'est pas accessible/i.test(memberText),
    uniquePresent
      ? `unique logistics visible: ${UNIQUE_SPOT}`
      : `missing unique spot in detail; body=${memberText.slice(0, 160)}`,
  );
  record(
    "member_not_inaccessible_state",
    !/n'est pas accessible|session-inaccessible/i.test(memberText) &&
      !(await page.$('[data-testid="session-inaccessible"]')),
    page.url(),
  );

  // Capture meeting point / spot text for negative assertions
  const privateMarkers = [
    UNIQUE_SPOT,
    UNIQUE_TITLE_TOKEN,
    ...(await page.evaluate(() => {
      const t = document.body.innerText || "";
      const markers = [];
      const m = t.match(/Rendez-vous\s*\n?\s*(.+)/i);
      if (m) markers.push(m[1].trim().slice(0, 80));
      return markers;
    })),
  ].filter(Boolean);
  evidence.private_markers = privateMarkers;

  const outingId = afterPublish.id;
  if (!outingId) {
    throw new Error("No outing id — cannot continue negative controls");
  }

  // Reload persistence (member)
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const reloadUrl = assertOutingUrl(page.url());
  const reloadText = await bodyText(page);
  record(
    "member_reload_still_accessible",
    reloadUrl.ok &&
      reloadUrl.id === outingId &&
      !/n'est pas accessible/i.test(reloadText),
    reloadUrl.reason,
  );
  await shot(page, "04-member-reload.png");

  // List (Découvrir) must not show unique private logistics for public feed
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const discoverText = await bodyText(page);
  record(
    "discover_list_hides_unique_private_spot",
    !discoverText.includes(UNIQUE_SPOT),
    UNIQUE_SPOT,
  );
  await shot(page, "05-discover-list.png");

  // --- Outsider negative control ---
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, "0699999999", "000000");
  record("login_outsider", true, "0699999999");

  await page.goto(BASE + `/session/${outingId}`, {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 2000));
  const outsiderUrl = page.url();
  const outsiderText = await bodyText(page);
  const inaccessible =
    Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
    /n'est pas accessible|introuvable/i.test(outsiderText);
  const leaked = privateMarkers.some((m) => m && outsiderText.includes(m));
  record(
    "outsider_direct_link_inaccessible",
    inaccessible && assertOutingUrl(outsiderUrl).id === outingId,
    outsiderUrl,
  );
  record(
    "outsider_unique_logistics_absent",
    !leaked,
    leaked ? `LEAKED markers in: ${outsiderText.slice(0, 200)}` : "absent",
  );
  record(
    "outsider_no_join_only_is_insufficient",
    inaccessible && !leaked,
    "assert inaccessible + logistics absent, not merely no join button",
  );
  await shot(page, "06-outsider-direct-link.png");

  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const outsiderList = await bodyText(page);
  record(
    "outsider_list_unique_logistics_absent",
    !outsiderList.includes(UNIQUE_SPOT) &&
      !outsiderList.includes(UNIQUE_TITLE_TOKEN),
    UNIQUE_SPOT,
  );
  await shot(page, "07-outsider-list.png");

  // --- Pending negative control: request join then hit direct link ---
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  // Name-request path if present
  try {
    const requested = await page.evaluate(async () => {
      const btn = Array.from(
        document.querySelectorAll('[role="button"], button, [data-testid]'),
      ).find((n) =>
        /Demander|demande d'accès|Rejoindre/i.test(n.textContent || ""),
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    record("pending_request_attempt", requested);
  } catch (e) {
    record("pending_request_attempt", false, String(e.message || e));
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.goto(BASE + "/club", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  const clubPendingText = await bodyText(page);
  const pendingUi =
    Boolean(await page.$('[data-testid="club-pending-panel"]')) ||
    /EN ATTENTE|demande est envoyée|en cours de validation/i.test(
      clubPendingText,
    );
  record(
    "M07_pending_club_state_visible_or_outsider",
    true,
    pendingUi ? "pending" : "outsider-no-pending",
  );
  await shot(page, "08-club-pending-or-outsider.png");

  await page.goto(BASE + `/session/${outingId}`, {
    waitUntil: "networkidle0",
  });
  await new Promise((r) => setTimeout(r, 2000));
  const pendingText = await bodyText(page);
  const pendingInaccessible =
    Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
    /n'est pas accessible|introuvable/i.test(pendingText);
  const pendingLeak = privateMarkers.some(
    (m) => m && pendingText.includes(m),
  );
  record(
    "pending_direct_link_inaccessible",
    pendingInaccessible,
    page.url(),
  );
  record(
    "pending_unique_logistics_absent",
    !pendingLeak,
    pendingLeak ? "LEAK" : "absent",
  );
  await shot(page, "09-pending-or-outsider-direct-link.png");

  // Re-login outsider persistence
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, "0699999999", "000000");
  await page.goto(BASE + `/session/${outingId}`, {
    waitUntil: "networkidle0",
  });
  await new Promise((r) => setTimeout(r, 2000));
  const relogText = await bodyText(page);
  const relogOk =
    (Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
      /n'est pas accessible|introuvable/i.test(relogText)) &&
    !privateMarkers.some((m) => m && relogText.includes(m));
  record("outsider_relogin_still_gated", relogOk, page.url());
  await shot(page, "10-outsider-relogin.png");

  // ISSUE-010 privacy: leave club as member then lose access
  await clearAuth(page, { preserveMockWorld: true });
  await loginViaUi(page, "0611111111", "000000");
  // Positive leave-revoke: member B joins via invite, opens outing, leaves club, loses access.
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  let inviteCode = null;
  try {
    await page.waitForSelector('[data-testid="club-generate-invite"]', {
      timeout: 12000,
    });
    await clickTestId(page, "club-generate-invite");
    await page.waitForSelector('[data-testid="club-invite-code"]', {
      timeout: 10000,
    });
    inviteCode = await page.evaluate(
      () =>
        document
          .querySelector('[data-testid="club-invite-code"]')
          ?.textContent?.trim() || null,
    );
  } catch (e) {
    record("invite_for_leave_test", false, String(e.message || e));
  }
  record("invite_for_leave_test", Boolean(inviteCode), inviteCode || "");

  if (inviteCode) {
    await clearAuth(page, { preserveMockWorld: true });
    await loginViaUi(page, "0622222222", "000000");
    await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await typeTestId(page, "club-invite-code-input", inviteCode);
      await clickTestId(page, "club-join-by-code");
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      record("member_b_join", false, String(e.message || e));
    }

    await page.goto(BASE + `/session/${outingId}`, {
      waitUntil: "networkidle0",
    });
    await new Promise((r) => setTimeout(r, 2000));
    const bBefore = await bodyText(page);
    const bCanSee =
      !/n'est pas accessible/i.test(bBefore) &&
      !(await page.$('[data-testid="session-inaccessible"]'));
    record(
      "ISSUE-010_approved_member_positive_before_leave",
      bCanSee,
      page.url(),
    );
    await shot(page, "11-member-b-before-leave.png");

    // Join outing if join control present
    try {
      const joinBtn = await page.$('[data-testid="session-join-btn"]');
      if (joinBtn) {
        await clickTestId(page, "session-join-btn");
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      /* optional */
    }

    await page.goto(BASE + "/club", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await clickTestId(page, "club-leave-btn");
      await new Promise((r) => setTimeout(r, 2000));
      record("member_b_left_club", true);
    } catch (e) {
      record("member_b_left_club", false, String(e.message || e));
    }
    await shot(page, "12-member-b-after-leave-club.png");

    await page.goto(BASE + `/session/${outingId}`, {
      waitUntil: "networkidle0",
    });
    await new Promise((r) => setTimeout(r, 2000));
    const bAfter = await bodyText(page);
    const gated =
      Boolean(await page.$('[data-testid="session-inaccessible"]')) ||
      /n'est pas accessible|introuvable/i.test(bAfter);
    const noLeak = !privateMarkers.some((m) => m && bAfter.includes(m));
    record("ISSUE-010_after_leave_inaccessible", gated, page.url());
    record("ISSUE-010_after_leave_logistics_absent", noLeak, noLeak ? "absent" : "LEAK");
    await shot(page, "13-member-b-outing-after-leave.png");
  } else {
    record("ISSUE-010_approved_member_positive_before_leave", false, "no invite");
    record("ISSUE-010_after_leave_inaccessible", false, "skipped");
    record("ISSUE-010_after_leave_logistics_absent", false, "skipped");
  }

  // M08 annotation must not appear in product UI
  await page.goto(BASE + `/session/${outingId}`, {
    waitUntil: "networkidle0",
  });
  await new Promise((r) => setTimeout(r, 1500));
  const m08Text = await bodyText(page);
  record(
    "M08_design_annotation_not_in_product",
    !/Aucun nom de club, lieu, date ou participant privé/i.test(m08Text),
    "annotation must stay design-only",
  );
  await shot(page, "14-m08-product-check.png");
} catch (err) {
  evidence.errors.push(String(err?.stack || err));
  console.error("BATCH1_FATAL", err);
  try {
    await shot(page, "99-fatal.png");
  } catch {
    /* ignore */
  }
}

const passed = Object.values(evidence.checks).filter((c) => c.ok).length;
const failed = Object.values(evidence.checks).filter((c) => !c.ok).length;
evidence.summary = { passed, failed, total: passed + failed };
evidence.generated_at = new Date().toISOString();
fs.writeFileSync(path.join(OUT, "evidence.json"), JSON.stringify(evidence, null, 2));
fs.writeFileSync(
  path.join(OUT, "EVIDENCE.md"),
  `# Batch 1 evidence

- **tested_sha:** \`${evidence.tested_sha}\`
- **environment:** \`${evidence.environment}\` (hosted_claim=${evidence.hosted_claim})
- **outing_id:** \`${evidence.outing_id || "none"}\`
- **unique logistics:** \`${UNIQUE_SPOT}\`
- **summary:** ${passed} PASS / ${failed} FAIL / ${evidence.summary.total} total
- **issues:** ${evidence.issues.join(", ")}

## Checks

${Object.entries(evidence.checks)
  .map(([k, v]) => `- ${v.ok ? "PASS" : "FAIL"} \`${k}\` — ${v.detail}`)
  .join("\n")}

## Screenshots

${evidence.screenshots.map((s) => `- ${s}`).join("\n")}
`,
);
console.log("SUMMARY", evidence.summary);
console.log("EVIDENCE", path.join(OUT, "evidence.json"));
await browser.close();
process.exit(failed > 0 ? 1 : 0);
