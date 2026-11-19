/**
 * Batch D — invitation create → pending → approval + private visibility (demo).
 * Same browser profile, switch identities (shared mock AsyncStorage).
 * Does not claim hosted. Does not invent approval.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const HOST = "0611111111";
const APPLICANT = "0633333333";
const OUTSIDER = "0699999999";
const STRUCTURE = `D-STRUCT-${Date.now().toString(36).slice(-6)}`;
const SPOT = `SPOT-D-${Date.now().toString(36).slice(-5).toUpperCase()}`;
const TITLE = `Privée D ${Date.now().toString(36).slice(-5)}`;

const report = {
  batch: "D",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  hosted_claim: false,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
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
  await page.waitForTimeout(500);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 10 });
  }
  await page.waitForTimeout(400);
}

async function clearAuthKeepWorld(page) {
  await page.evaluate(() => {
    const keep = {};
    for (const k of Object.keys(localStorage)) {
      if (
        /mock:|grpd_club_admin|grpd_focused/i.test(
          k,
        )
      ) {
        keep[k] = localStorage.getItem(k);
      }
    }
    localStorage.clear();
    sessionStorage.clear();
    for (const [k, v] of Object.entries(keep)) {
      if (v != null) localStorage.setItem(k, v);
    }
  });
}

async function login(page, phone, { wipeAll = false } = {}) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  if (wipeAll) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  } else {
    await clearAuthKeepWorld(page);
  }
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill(phone);
  await clickText(page, /Continuer|Suivant|Envoyer|Recevoir/i);
  await page.waitForURL(/verify/i, { timeout: 20000 });
  await enterOtp(page, "000000");
  try {
    await clickText(page, /^Vérifier$/i);
  } catch {}
  await page.waitForFunction(
    () => /Découvrir|Mes sorties|Clubs|Profil/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {}
  });

  let clubName = "";
  let outingId = null;
  let inviteCode = null;

  try {
    // --- Host creates club + invite code ---
    await login(page, HOST, { wipeAll: true });
    clubName = `BatchD Club ${Date.now().toString(36).slice(-4)}`;
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(700);
    await page.getByTestId("club-name-input").fill(clubName);
    await page.getByTestId("club-city-input").fill("Rabat");
    await page.getByTestId("club-purpose-input").fill("Invitations Batch D");
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2500);
    check("host_club_created", (await page.locator("body").innerText()).includes(clubName) || /Quitter/i.test(await page.locator("body").innerText()), clubName);

    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByTestId("club-generate-invite").click({ force: true });
    await page.waitForTimeout(1200);
    const codeEl = page.getByTestId("club-invite-code");
    inviteCode = (await codeEl.count()) ? (await codeEl.innerText()).trim() : null;
    check("invite_code_created", Boolean(inviteCode && inviteCode.length >= 4), inviteCode);
    await page.screenshot({ path: path.join(OUT, "batch-d-01-invite.png"), fullPage: true });

    // --- Applicant: name request → pending (not invite-code skip) ---
    await login(page, APPLICANT);
    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByTestId("club-request-name-input").fill(clubName);
    await page.getByTestId("club-request-submit").click({ force: true });
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const pendingUi =
      Boolean(await page.getByTestId("club-pending-panel").count()) ||
      /EN ATTENTE/i.test(await page.locator("body").innerText());
    check("applicant_pending", pendingUi, clubName);
    await page.screenshot({ path: path.join(OUT, "batch-d-02-pending.png"), fullPage: true });

    // --- Host approves ---
    await login(page, HOST);
    await page.goto(`${BASE}/club/admin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const approveBtn = page.getByTestId(/approve|club-approve/i).first();
    let approved = false;
    if (await approveBtn.count()) {
      await approveBtn.click({ force: true });
      await page.waitForTimeout(1500);
      approved = true;
    } else {
      // Fallback: click text Approuver
      const byText = page.getByText(/^Approuver$/i);
      if (await byText.count()) {
        await byText.first().click({ force: true });
        await page.waitForTimeout(1500);
        approved = true;
      }
    }
    check("host_approved_applicant", approved, page.url());
    await page.screenshot({ path: path.join(OUT, "batch-d-03-approve.png"), fullPage: true });

    // --- Host publishes members-only outing with Structure ---
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const organise = page.getByTestId("club-organise-outing-cta");
    if (await organise.count()) {
      await organise.click({ force: true });
    } else {
      await page.goto(`${BASE}/session/create?audience=club`, { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(1000);
    await clickText(page, /^Marche$/i);
    await page.getByTestId("session-title-input").fill(TITLE);
    await page.getByTestId("session-purpose-input").fill("Privée après approval D");
    await page.getByTestId("session-structure-input").fill(STRUCTURE);
    try {
      await page.getByTestId("session-spot-field").click({ force: true });
      await page.waitForTimeout(300);
      if (await page.getByTestId("session-spot-custom-input").count()) {
        await page.getByTestId("session-spot-custom-input").fill(SPOT);
        await page.getByTestId("session-spot-custom-add").click({ force: true });
      }
    } catch {}
    await page.getByTestId("session-audience-club").click({ force: true }).catch(() => {});
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2800);
    let url = page.url();
    if (/published/i.test(url)) {
      outingId = new URL(url).searchParams.get("id");
      if (outingId) {
        await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
      }
    } else {
      const m = url.match(/\/session\/([^/?]+)/);
      outingId = m && m[1] !== "create" ? m[1] : null;
    }
    check("private_outing_created", Boolean(outingId), outingId || url);
    const hostDetail = await page.locator("body").innerText();
    check(
      "host_sees_structure",
      hostDetail.includes(STRUCTURE) || Boolean(await page.getByTestId("session-structure-text").count()),
      STRUCTURE,
    );

    // --- Approved applicant sees logistics ---
    await login(page, APPLICANT);
    await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const memberText = await page.locator("body").innerText();
    const memberOk =
      !/n'est pas accessible|introuvable/i.test(memberText) &&
      (memberText.includes(STRUCTURE) || memberText.includes(SPOT) || memberText.includes(TITLE));
    check("approved_member_sees_private", memberOk, memberText.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, "batch-d-04-member-sees.png"), fullPage: true });

    // --- Outsider gated ---
    await login(page, OUTSIDER);
    await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const outText = await page.locator("body").innerText();
    const gated =
      Boolean(await page.getByTestId("session-inaccessible").count()) ||
      /n'est pas accessible|introuvable/i.test(outText);
    const leaked = outText.includes(STRUCTURE) || outText.includes(SPOT);
    check("outsider_gated", gated && !leaked, gated ? "gated" : outText.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, "batch-d-05-outsider.png"), fullPage: true });

    // --- Invite-code path (second applicant) joins approved ---
    if (inviteCode) {
      const JOINER = "0644444444";
      await login(page, JOINER);
      await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      const codeInput = page.getByTestId("club-invite-code-input");
      if (await codeInput.count()) {
        await codeInput.fill(inviteCode);
        await page.getByTestId("club-join-by-code").click({ force: true });
        await page.waitForTimeout(2000);
        await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        const joinedText = await page.locator("body").innerText();
        check(
          "invite_code_join_approved",
          /Quitter le club/i.test(joinedText) && !/EN ATTENTE/i.test(joinedText),
          joinedText.slice(0, 100),
        );
      } else {
        check("invite_code_join_approved", false, "join code input missing");
      }
    }
  } catch (e) {
    check("batch_d_uncaught", false, String(e));
    await page.screenshot({ path: path.join(OUT, "batch-d-error.png"), fullPage: true }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(path.join(OUT, "batch-d-invite-journey-smoke.json"), JSON.stringify(report, null, 2));
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
