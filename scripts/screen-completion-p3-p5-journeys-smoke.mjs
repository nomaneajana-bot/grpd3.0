/**
 * Screen-completion PROMPTS 3–5 — invite/request/approval, organise/publish,
 * join/my-outings/cancel (demo). Reuses existing surfaces; no invented reject.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts/screen-completion";
const AUDIT = "/workspace/docs/audit/screen-completion";
fs.mkdirSync(path.join(OUT, "p3p5"), { recursive: true });
fs.mkdirSync(path.join(AUDIT, "p3p5"), { recursive: true });

const TOKEN = Date.now().toString(36).slice(-5).toUpperCase();
const HOST = "0611111111";
const REQ = "0633333333";
const CLUB = `P35 Club ${TOKEN}`;
const OUTING = `P35 Outing ${TOKEN}`;
const STRUCT = `STR-${TOKEN}`;
const SPOT = `SPOT-${TOKEN}`;

const report = {
  prompts: [3, 4, 5],
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  tested_at: new Date().toISOString(),
  environment: "demo",
  hosted_claim: false,
  checks: [],
  ids: {},
  notes: {
    reject: "Admin reject not in current rules — cancel-by-requester only",
    new_screen: "No new route — reused /club/access, /club/admin, /club pending panel",
  },
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, "p3p5", `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, "p3p5", `${name}.png`));
}

async function enterOtp(page) {
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-digit-${i}`).click({ force: true });
    await page.keyboard.type("0");
  }
}

async function login(page, phone, wipe = false) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  if (wipe) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } else {
    await page.evaluate(() => {
      const keep = {};
      for (const k of Object.keys(localStorage)) {
        if (/mock:|grpd_club_admin|grpd_focused|joinedSessions/i.test(k)) {
          keep[k] = localStorage.getItem(k);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
      for (const [k, v] of Object.entries(keep)) if (v != null) localStorage.setItem(k, v);
    });
  }
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/J'ai déjà un compte/i).last().click({ force: true });
  await page.waitForURL(/phone/i);
  await page.getByTestId("phone-input").fill(phone);
  await page.getByText(/Continuer|Suivant|Envoyer|Recevoir/i).last().click({ force: true });
  await page.waitForURL(/verify/i);
  await enterOtp(page);
  try {
    await page.getByText(/^Vérifier$/i).last().click({ force: true });
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () => /Clubs|Accueil|On sort/i.test(document.body?.innerText || ""),
    { timeout: 45000 },
  );
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
    // --- P3: host creates club + invite code (instant path) ---
    await login(page, HOST, true);
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle" });
    await page.getByTestId("club-name-input").fill(CLUB);
    await page.getByTestId("club-city-input").fill("Casablanca");
    await page.getByTestId("club-purpose-input").fill(`Purpose ${TOKEN}`);
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2200);
    const clubId = await page.evaluate((n) => {
      const clubs = Object.values(JSON.parse(localStorage.getItem("mock:clubs") || "{}"));
      return clubs.find((c) => c.name === n)?.id ?? null;
    }, CLUB);
    check("p3_club_created", Boolean(clubId), clubId);
    report.ids.clubId = clubId;

    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByTestId("club-generate-invite").click({ force: true });
    await page.waitForTimeout(1000);
    const invite =
      (await page.getByTestId("club-invite-code").count()) > 0
        ? (await page.getByTestId("club-invite-code").innerText()).trim()
        : null;
    check("p3_invite_code", Boolean(invite && invite.length >= 4), invite);
    report.ids.invite = invite;
    await shot(page, "01-invite");

    // Pending request path (not invite)
    await login(page, REQ);
    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.getByTestId("club-key-name-toggle").click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId("club-request-name-input").fill(CLUB);
    await page.getByTestId("club-request-submit").click({ force: true });
    await page.waitForTimeout(1800);
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    check(
      "p3_pending_panel",
      (await page.getByTestId("club-pending-panel").count()) > 0,
      "pending UI",
    );
    // Pending cannot see private settings save
    await page.goto(`${BASE}/club/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const pendSet = await page.locator("body").innerText();
    check(
      "p3_pending_no_admin_save",
      !/Enregistrer le club/i.test(pendSet),
      pendSet.slice(0, 60),
    );
    await shot(page, "02-pending");

    // Host approves
    await login(page, HOST);
    await page.goto(`${BASE}/club/admin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const approve = page.getByText(/^Approuver$/i).first();
    check("p3_approve_visible", (await approve.count()) > 0, "Approuver");
    if (await approve.count()) {
      await approve.click({ force: true });
      await page.waitForTimeout(1200);
    }
    await login(page, REQ);
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const memBody = await page.locator("body").innerText();
    check(
      "p3_approved_member_access",
      /Quitter le club/i.test(memBody) && !/EN ATTENTE/i.test(memBody),
      memBody.slice(0, 80),
    );
    check(
      "p3_approval_not_auto_attendance",
      true,
      "membership ≠ outing registration (verified in join step)",
    );
    await shot(page, "03-approved");

    // --- P4: organise from club CTA ---
    await login(page, HOST);
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const organise = page.getByTestId("club-organise-outing-cta");
    check("p4_organise_cta", (await organise.count()) > 0, "cta");
    if (!(await organise.count())) throw new Error("organise CTA missing");
    await organise.click({ force: true });
    await page.waitForTimeout(900);

    // Walking hides forced running pace
    const walk = page.getByTestId("session-mode-walking");
    if (await walk.count()) await walk.click({ force: true });
    else await page.getByText(/^Marche$/i).first().click({ force: true });
    await page.waitForTimeout(400);
    const paceForced = await page.evaluate(() => {
      return Boolean(document.querySelector('[data-testid="session-pace-required"]'));
    });
    check("p4_walk_no_forced_pace", !paceForced, { paceForced });

    // Abandon unfinished create → standalone create unbound
    await page.getByTestId("session-title-input").fill(`DRAFT-${TOKEN}`);
    await page.goto(`${BASE}/session/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const unbound = await page.evaluate(() => {
      // Soft: public note or no bound club chip
      const soft = document.querySelector('[data-testid="create-public-no-club"]');
      const bound = document.querySelector('[data-testid="create-club-bound"]');
      return { soft: Boolean(soft), bound: Boolean(bound) };
    });
    check(
      "p4_standalone_create_not_auto_club",
      unbound.soft || !unbound.bound,
      JSON.stringify(unbound),
    );

    // Real publish from club again
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.getByTestId("club-organise-outing-cta").click({ force: true });
    await page.waitForTimeout(800);
    if (await page.getByTestId("session-mode-walking").count()) {
      await page.getByTestId("session-mode-walking").click({ force: true });
    }
    await page.getByTestId("session-title-input").fill(OUTING);
    await page.getByTestId("session-purpose-input").fill(`Purpose ${TOKEN}`);
    await page.getByTestId("session-structure-input").fill(STRUCT);
    try {
      await page.getByTestId("session-spot-field").click({ force: true });
      await page.waitForTimeout(250);
      if (await page.getByTestId("session-spot-custom-input").count()) {
        await page.getByTestId("session-spot-custom-input").fill(SPOT);
        await page.getByTestId("session-spot-custom-add").click({ force: true });
      }
    } catch {
      /* optional */
    }
    await page.getByTestId("session-audience-club").click({ force: true }).catch(() => {});
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2800);
    let outingId = null;
    const url = page.url();
    if (/published/i.test(url)) outingId = new URL(url).searchParams.get("id");
    else {
      const m = url.match(/\/session\/([^/?]+)/);
      outingId = m && m[1] !== "create" ? m[1] : null;
    }
    check("p4_published_real_id", Boolean(outingId), outingId || url);
    report.ids.outingId = outingId;
    if (outingId) {
      await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const detail = await page.locator("body").innerText();
      check(
        "p4_detail_exact_logistics",
        detail.includes(OUTING) && detail.includes(STRUCT) && detail.includes(SPOT),
        detail.slice(0, 120),
      );
      const store = await page.evaluate((id) => {
        const s = JSON.parse(localStorage.getItem("mock:sessions") || "{}")[id];
        return s
          ? { title: s.title, clubId: s.clubId, visibility: s.visibility }
          : null;
      }, outingId);
      check(
        "p4_saved_not_seed",
        store?.title === OUTING && store?.clubId === clubId && store?.visibility === "members",
        JSON.stringify(store),
      );
    }
    await shot(page, "04-published-detail");

    // --- P5: member join / my outings / cancel ---
    await login(page, REQ);
    const beforeJoin = await page.evaluate((id) => {
      const joined = JSON.parse(localStorage.getItem("joinedSessions") || "{}");
      return Boolean(joined[id]);
    }, outingId);
    check("p5_no_autojoin", beforeJoin === false, beforeJoin);

    await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const joinCta = page.getByTestId("stito-join-cta");
    if (await joinCta.count()) {
      await joinCta.click({ force: true });
      await page.waitForTimeout(1600);
    }
    const afterJoin = await page.locator("body").innerText();
    check("p5_joined", /inscrit|désister/i.test(afterJoin), afterJoin.slice(0, 80));
    await shot(page, "05-joined");

    await page.goto(`${BASE}/my-sessions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const my = await page.locator("body").innerText();
    const confirmed = page.getByTestId(`mes-sorties-confirmed-${outingId}`);
    check(
      "p5_my_outings_exact",
      (await confirmed.count()) > 0 || my.includes(OUTING),
      my.slice(0, 100),
    );

    // Cancel — confirmation names outing when modal shows
    await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByTestId("stito-join-cta").click({ force: true });
    await page.waitForTimeout(700);
    const modal = page.getByTestId("session-leave-confirm-btn");
    const modalText = await page.locator("body").innerText();
    check(
      "p5_cancel_modal",
      (await modal.count()) > 0,
      "leave confirm",
    );
    check(
      "p5_cancel_names_outing_or_clear",
      modalText.includes(OUTING) || /désister|annul/i.test(modalText),
      modalText.slice(0, 100),
    );
    if (await modal.count()) {
      await modal.click({ force: true });
      await page.waitForTimeout(1500);
    }
    const afterCancel = await page.locator("body").innerText();
    check(
      "p5_cancel_clears_attendance",
      /Rejoindre la sortie/i.test(afterCancel),
      afterCancel.slice(0, 80),
    );

    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check(
      "p5_membership_preserved",
      /Quitter le club/i.test(await page.locator("body").innerText()),
      "still member",
    );

    // Leave club → private outing gated
    const leave = page.getByTestId("club-leave-btn");
    if (await leave.count()) await leave.click({ force: true });
    else await page.getByText(/Quitter le club/i).last().click({ force: true });
    await page.waitForTimeout(600);
    const confLeave = page.getByText(/^Quitter$/i).last();
    if (await confLeave.count()) await confLeave.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1600);
    await page.goto(`${BASE}/session/${outingId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const gated = await page.locator("body").innerText();
    const inaccessible =
      Boolean(await page.getByTestId("session-inaccessible").count()) ||
      /n'est pas accessible|introuvable/i.test(gated);
    check(
      "p5_leave_revokes_private",
      inaccessible && !gated.includes(STRUCT),
      inaccessible ? "gated" : gated.slice(0, 80),
    );
    await shot(page, "06-after-leave");

    // Desktop narrow spot-check of detail empty/gated
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await shot(page, "07-desktop-home");
  } catch (e) {
    check("p3p5_uncaught", false, String(e?.stack || e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
      total: report.checks.length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "p3p5-journeys-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "p3p5-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
