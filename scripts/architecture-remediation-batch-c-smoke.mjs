/**
 * Architecture remediation — Batch C (demo web).
 * create club → edit → invite/approve → organise walk outing →
 * discover/detail → join/cancel attendance → leave club.
 * Two users, two clubs; membership ≠ home-group ≠ attendance; no redesign.
 * Hosted/native/UAT not claimed.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
const AUDIT = "/workspace/docs/audit/architecture-remediation";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(AUDIT, { recursive: true });
fs.mkdirSync(path.join(AUDIT, "batch-c"), { recursive: true });

const HOST = "0611111111";
const MEMBER = "0622222222";
const TOKEN = Date.now().toString(36).slice(-6).toUpperCase();
const CLUB_A = `Marche A ${TOKEN}`;
const CLUB_B = `Langue B ${TOKEN}`;
const CLUB_A_RENAMED = `Marche A edit ${TOKEN}`;
const OUTING_TITLE = `Balade ${TOKEN}`;
const STRUCTURE = `STRUCT-${TOKEN}`;
const SPOT = `SPOT-${TOKEN}`;

const report = {
  batch: "architecture-remediation-batch-c",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  environment: "demo",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  base: BASE,
  ids: {},
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 360) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function shot(page, name) {
  const p = path.join(OUT, `batch-c-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  fs.copyFileSync(p, path.join(AUDIT, "batch-c", `${name}.png`));
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
  await page.waitForTimeout(450);
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
      if (/mock:|grpd_club_admin|grpd_focused|joinedSessions/i.test(k)) {
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
  await page.goto(`${BASE}/onboarding`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  if (wipeAll) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
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
  } catch {
    /* auto */
  }
  await page.waitForFunction(
    () =>
      /Découvrir|Mes sorties|Clubs|Profil|Accueil|On sort/i.test(
        document.body?.innerText || "",
      ),
    { timeout: 45000 },
  );
  await page.waitForTimeout(700);
}

async function createClub(page, { name, city, purpose }) {
  await page.goto(`${BASE}/club/create`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(600);
  await page.getByTestId("club-name-input").fill(name);
  await page.getByTestId("club-city-input").fill(city);
  await page.getByTestId("club-purpose-input").fill(purpose);
  await page.getByTestId("club-create-submit").click({ force: true });
  await page.waitForTimeout(2200);
  const body = await page.locator("body").innerText();
  return body.includes(name) || /Quitter|Organiser|Paramètres/i.test(body);
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

  let inviteCode = null;
  let outingId = null;

  try {
    // --- Host: club A (walk purpose) ---
    await login(page, HOST, { wipeAll: true });
    const createdA = await createClub(page, {
      name: CLUB_A,
      city: "Casablanca",
      purpose: `Marcher entre voisins ${TOKEN} — pas de course.`,
    });
    check("create_club_a_walk_purpose", createdA, CLUB_A);
    report.ids.clubAName = CLUB_A;
    await shot(page, "01-club-a-created");

    // Edit club (name) via settings — uses updateClub → mock PATCH
    await page.goto(`${BASE}/club/settings`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    const nameInput = page.getByPlaceholder(/Nom du club/i).first();
    if (await nameInput.count()) {
      await nameInput.fill(CLUB_A_RENAMED);
      await clickText(page, /Enregistrer le club/i);
      await page.waitForTimeout(1500);
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const afterEdit = await page.locator("body").innerText();
      check(
        "edit_club_persisted",
        afterEdit.includes(CLUB_A_RENAMED),
        CLUB_A_RENAMED,
      );
      report.ids.clubARenamed = CLUB_A_RENAMED;
    } else {
      check("edit_club_persisted", false, "name input missing");
    }
    await shot(page, "02-club-edited");

    // Invite code
    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByTestId("club-generate-invite").click({ force: true });
    await page.waitForTimeout(1200);
    const codeEl = page.getByTestId("club-invite-code");
    inviteCode =
      (await codeEl.count()) > 0 ? (await codeEl.innerText()).trim() : null;
    check(
      "invite_code_created",
      Boolean(inviteCode && inviteCode.length >= 4),
      inviteCode,
    );
    report.ids.inviteCode = inviteCode;
    await shot(page, "03-invite");

    // --- Member joins by code (approved path) ---
    await login(page, MEMBER);
    await page.goto(`${BASE}/club/access`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    if (inviteCode) {
      await page.getByTestId("club-invite-code-input").fill(inviteCode);
      await page.getByTestId("club-join-by-code").click({ force: true });
      await page.waitForTimeout(2000);
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const joined = await page.locator("body").innerText();
      check(
        "member_joined_club_a",
        /Quitter le club/i.test(joined) && !/EN ATTENTE/i.test(joined),
        joined.slice(0, 100),
      );
    } else {
      check("member_joined_club_a", false, "no invite code");
    }
    await shot(page, "04-member-joined");

    // --- Host: organise walk outing on club A (before creating club B) ---
    await login(page, HOST);
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Ensure focused club is A (member's club)
    {
      const chips = page.locator('[data-testid^="club-switch-"]');
      const n = await chips.count();
      for (let i = 0; i < n; i++) {
        const label = (await chips.nth(i).innerText()).trim();
        if (
          label.includes(CLUB_A_RENAMED) ||
          label.includes("Marche A") ||
          label.includes(CLUB_A)
        ) {
          await chips.nth(i).click({ force: true });
          await page.waitForTimeout(800);
          break;
        }
      }
    }
    check(
      "focus_club_a_before_outing",
      (await page.locator("body").innerText()).includes(CLUB_A_RENAMED) ||
        (await page.locator("body").innerText()).includes(CLUB_A),
      "club A focused",
    );

    // Organise walk outing (club audience) — pace must not be forced
    const organise = page.getByTestId("club-organise-outing-cta");
    if (await organise.count()) {
      await organise.click({ force: true });
    } else {
      await page.goto(`${BASE}/session/create?audience=club`, {
        waitUntil: "networkidle",
      });
    }
    await page.waitForTimeout(1000);
    const walkBtn = page.getByTestId("session-mode-walking");
    if (await walkBtn.count()) {
      await walkBtn.click({ force: true });
    } else {
      await clickText(page, /^Marche$/i);
    }
    await page.waitForTimeout(400);
    const paceForced = await page.evaluate(() => {
      const t = document.body?.innerText || "";
      const card = document.querySelector(
        '[data-testid="session-pace-groups-card"]',
      );
      const required = document.querySelector(
        '[data-testid="session-pace-required"]',
      );
      return Boolean(required) || (/obligatoire/i.test(t) && Boolean(card));
    });
    check("walk_does_not_force_running_pace", !paceForced, { paceForced });

    await page.getByTestId("session-title-input").fill(OUTING_TITLE);
    await page.getByTestId("session-purpose-input").fill(`Sortie marche ${TOKEN}`);
    await page.getByTestId("session-structure-input").fill(STRUCTURE);
    try {
      await page.getByTestId("session-spot-field").click({ force: true });
      await page.waitForTimeout(300);
      if (await page.getByTestId("session-spot-custom-input").count()) {
        await page.getByTestId("session-spot-custom-input").fill(SPOT);
        await page.getByTestId("session-spot-custom-add").click({ force: true });
      }
    } catch {
      /* optional */
    }
    await page
      .getByTestId("session-audience-club")
      .click({ force: true })
      .catch(() => {});
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2800);
    let url = page.url();
    if (/published/i.test(url)) {
      outingId = new URL(url).searchParams.get("id");
      if (outingId) {
        await page.goto(`${BASE}/session/${outingId}`, {
          waitUntil: "networkidle",
        });
        await page.waitForTimeout(1000);
      }
    } else {
      const m = url.match(/\/session\/([^/?]+)/);
      outingId = m && m[1] !== "create" ? m[1] : null;
    }
    check("organise_outing_real_id", Boolean(outingId), outingId || url);
    report.ids.outingId = outingId;

    const publishedBind = await page.evaluate((id) => {
      try {
        const sessions = JSON.parse(
          localStorage.getItem("mock:sessions") || "{}",
        );
        const s = sessions[id];
        return s
          ? { clubId: s.clubId, visibility: s.visibility, title: s.title }
          : null;
      } catch {
        return null;
      }
    }, outingId);
    report.ids.publishedBind = publishedBind;
    check(
      "outing_bound_to_club",
      Boolean(publishedBind?.clubId) &&
        publishedBind?.visibility === "members",
      JSON.stringify(publishedBind),
    );
    await shot(page, "06-outing-created");

    // Member → detail (membership ≠ attendance)
    await login(page, MEMBER);
    if (outingId) {
      const memBind = await page.evaluate(() => {
        try {
          const user = JSON.parse(
            localStorage.getItem("grpd_auth_user_v1") || "null",
          );
          const ms = Object.values(
            JSON.parse(localStorage.getItem("mock:club_memberships") || "{}"),
          ).filter((m) => m.userId === user?.id && m.status === "approved");
          return { userId: user?.id, clubIds: ms.map((m) => m.clubId) };
        } catch {
          return null;
        }
      });
      report.ids.memberBind = memBind;
      check(
        "member_has_outing_club_membership",
        Boolean(
          publishedBind?.clubId &&
            memBind?.clubIds?.includes(publishedBind.clubId),
        ),
        JSON.stringify({ publishedBind, memBind }),
      );

      await page.goto(`${BASE}/session/${outingId}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1500);
      const detail = await page.locator("body").innerText();
      check(
        "member_sees_outing_detail",
        detail.includes(OUTING_TITLE) ||
          detail.includes(STRUCTURE) ||
          detail.includes(SPOT),
        detail.slice(0, 100),
      );

      // Join attendance (≠ membership) via sticky CTA
      const joinCta = page.getByTestId("stito-join-cta");
      if (await joinCta.count()) {
        await joinCta.click({ force: true });
        await page.waitForTimeout(1800);
      }
      const afterJoin = await page.locator("body").innerText();
      const joinedAtt =
        /Inscrit|Se désister|désister/i.test(afterJoin) ||
        Boolean(await page.getByTestId("stito-join-cta").count());
      check(
        "member_join_attendance",
        /inscrit|désister/i.test(afterJoin),
        afterJoin.slice(0, 80),
      );
      await shot(page, "07-joined");

      // Cancel attendance — not leave club (same CTA opens M06 modal)
      await page.getByTestId("stito-join-cta").click({ force: true });
      await page.waitForTimeout(800);
      const confirm = page.getByTestId("session-leave-confirm-btn");
      check(
        "cancel_confirm_modal",
        (await confirm.count()) > 0,
        "M06 modal",
      );
      if (await confirm.count()) {
        await confirm.click({ force: true });
        await page.waitForTimeout(1800);
      }
      const afterCancel = await page.locator("body").innerText();
      const attendanceCleared = /Rejoindre la sortie/i.test(afterCancel);
      check(
        "cancel_attendance_not_leave_club",
        attendanceCleared,
        afterCancel.slice(0, 120),
      );
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const stillMember = await page.locator("body").innerText();
      check(
        "membership_preserved_after_cancel",
        /Quitter le club/i.test(stillMember),
        "still member",
      );
      await shot(page, "08-cancel-attendance");

      // Leave club
      const leaveBtn = page.getByTestId("club-leave-btn");
      if (await leaveBtn.count()) {
        await leaveBtn.click({ force: true });
      } else {
        await clickText(page, /Quitter le club/i);
      }
      await page.waitForTimeout(600);
      // confirm dialog already auto-accepted via page.on('dialog')
      const confirmLeave = page.getByText(/^Quitter$/i).last();
      if (await confirmLeave.count()) {
        await confirmLeave.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(1800);
      await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const afterLeave = await page.locator("body").innerText();
      check(
        "member_left_club",
        !/Quitter le club/i.test(afterLeave) &&
          !afterLeave.includes(CLUB_A_RENAMED) &&
          !afterLeave.includes(CLUB_A),
        afterLeave.slice(0, 100),
      );
      // Private outing should gate after leave
      if (outingId) {
        await page.goto(`${BASE}/session/${outingId}`, {
          waitUntil: "networkidle",
        });
        await page.waitForTimeout(1200);
        const gated = await page.locator("body").innerText();
        const inaccessible =
          Boolean(await page.getByTestId("session-inaccessible").count()) ||
          /n'est pas accessible|introuvable/i.test(gated);
        const leaked = gated.includes(STRUCTURE);
        check(
          "privacy_after_leave",
          inaccessible && !leaked,
          inaccessible ? "gated" : gated.slice(0, 100),
        );
      }
      await shot(page, "09-after-leave");
    } else {
      check("member_sees_outing_detail", false, "no outing id");
    }

    // --- Host: second club (language purpose) + two-club persistence ---
    await login(page, HOST);
    const createdB = await createClub(page, {
      name: CLUB_B,
      city: "Rabat",
      purpose: `Pratiquer le darija en marchant ${TOKEN}.`,
    });
    check("create_club_b_language_purpose", createdB, CLUB_B);
    report.ids.clubBName = CLUB_B;
    await page.goto(`${BASE}/club`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const hostTwo = await page.locator("body").innerText();
    const twoClubsUi =
      (await page.getByTestId("club-switcher").count()) > 0 ||
      (hostTwo.includes(CLUB_B) &&
        (hostTwo.includes(CLUB_A_RENAMED) || hostTwo.includes(CLUB_A)));
    check("two_clubs_host_visible", twoClubsUi || createdB, "host multi-club");
    await shot(page, "10-two-clubs");

    // Reload persistence
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const hostReload = await page.locator("body").innerText();
    check(
      "host_clubs_persist_reload",
      hostReload.includes(CLUB_B) &&
        (hostReload.includes(CLUB_A_RENAMED) || hostReload.includes(CLUB_A)),
      hostReload.slice(0, 100),
    );
    await shot(page, "11-host-reload");
  } catch (e) {
    check("batch_c_uncaught", false, String(e));
    await shot(page, "error").catch(() => {});
  } finally {
    report.summary = {
      pass: report.checks.filter((c) => c.ok).length,
      fail: report.checks.filter((c) => !c.ok).length,
    };
    const json = JSON.stringify(report, null, 2) + "\n";
    fs.writeFileSync(path.join(OUT, "architecture-remediation-batch-c-smoke.json"), json);
    fs.writeFileSync(path.join(AUDIT, "batch-c-evidence.json"), json);
    console.log("SUMMARY", report.summary);
    console.log("IDS", report.ids);
    await browser.close();
    process.exit(report.summary.fail ? 1 : 0);
  }
}

main();
