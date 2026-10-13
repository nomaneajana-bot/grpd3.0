/**
 * Semantic / product-logic audit — real UI journeys (no auth injection).
 * DEMO_MODE Expo web. Records persona scenarios with screenshots.
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/semantic-product-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const OUT = "/opt/cursor/artifacts/semantic-audit";
const SHOTS = path.join(OUT, "screenshots");
const REPO = path.resolve("docs/audit/semantic-audit");
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(path.join(REPO, "screenshots"), { recursive: true });

const sha = execSync("git rev-parse HEAD").toString().trim();
const scenarios = [];
const contradictions = [];

function recordScenario(s) {
  scenarios.push(s);
  const mark =
    s.result === "PASS" ? "PASS" : s.result === "BLOCKED" ? "BLOCKED" : "FAIL";
  console.log(`${mark} [${s.id}] ${s.title}`);
}

function flagContradiction(c) {
  contradictions.push(c);
  console.log(`CONTRADICTION #${contradictions.length} [${c.severity}] ${c.title}`);
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
page.on("dialog", async (d) => {
  try {
    await d.accept();
  } catch {
    /* ignore */
  }
});

async function shot(name) {
  const file = `${name}.png`;
  const p1 = path.join(SHOTS, file);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, path.join(REPO, "screenshots", file));
  return `screenshots/${file}`;
}

async function bodyText() {
  return page.evaluate(() => document.body.innerText || "");
}

async function clearStorage() {
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1000));
}

async function clickTestId(testId, aria = null) {
  await page.waitForFunction(
    (id, a) => {
      const nodes = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      );
      return nodes.some((el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0) return false;
        if (a && el.getAttribute("aria-label") !== a) return false;
        return true;
      });
    },
    { timeout: 20000 },
    testId,
    aria,
  );
  await page.evaluate(
    (id, a) => {
      const nodes = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      );
      const el = nodes.find((n) => {
        if (n.getBoundingClientRect().width <= 0) return false;
        if (a && n.getAttribute("aria-label") !== a) return false;
        return true;
      });
      el?.scrollIntoView({ block: "center" });
      el?.click();
    },
    testId,
    aria,
  );
}

async function typeTestId(testId, value) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 20000 });
  await page.evaluate((id) => {
    const el = Array.from(
      document.querySelectorAll(`[data-testid="${id}"]`),
    ).find((n) => n.getBoundingClientRect().width > 0);
    el?.focus();
    const desc = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    );
    desc?.set?.call(el, "");
    el?.dispatchEvent(new Event("input", { bubbles: true }));
  }, testId);
  await page.keyboard.type(value, { delay: 20 });
}

async function enterOtp(code = "000000") {
  for (let i = 0; i < code.length; i++) {
    const sel = `[data-testid="otp-digit-${i}"]`;
    await page.waitForSelector(sel, { visible: true });
    await page.click(sel);
    await page.keyboard.type(code[i]);
  }
}

/** Real UI login — no auth injection. Optionally preserve mock clubs/invites. */
async function loginViaUi(
  phoneDigits,
  { label = "", preserveMockWorld = false } = {},
) {
  if (preserveMockWorld) {
    await page.goto(BASE + "/onboarding", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await page.evaluate(() => {
      const authKeys = [
        "grpd_auth_user_v1",
        "grpd_auth_tokens_v1",
        "grpd_device_id_v1",
        "grpd_use_mock_api_v1",
        "grpd_login_phone_v1",
        "grpd_login_otp_request_v1",
        "grpd_onboarding_v1",
        "grpd_profile_v1",
        "joinedSessions:v1",
      ];
      for (const k of authKeys) localStorage.removeItem(k);
    });
    await page.goto(BASE + "/onboarding", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 800));
  } else {
    await clearStorage();
  }
  await clickTestId("cta-secondary", "J'ai déjà un compte");
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
  await page.keyboard.type(phoneDigits, { delay: 25 });
  await clickTestId("cta-primary", "Recevoir le code");
  await page.waitForFunction(() => /verify/i.test(location.pathname), {
    timeout: 15000,
  });
  await enterOtp("000000");
  try {
    await clickTestId("cta-primary", "Vérifier");
  } catch {
    /* auto */
  }
  await new Promise((r) => setTimeout(r, 2500));
  const text = await bodyText();
  const ok =
    /Découvrir|Mes sorties|Clubs|Profil/i.test(text) &&
    !/Bon retour|Code reçu/i.test(text);
  if (!ok) {
    await shot(`login-fail-${label || phoneDigits}`);
  }
  return ok;
}

async function goto(route) {
  await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));
}

// ─────────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────────

const PERSONA_ORG = {
  id: "organizer",
  phone: "0611111111",
  meaning: "Creates clubs/outings; should see organizer controls on own sessions",
};
const PERSONA_MEMBER = {
  id: "member",
  phone: "0622222222",
  meaning: "Joins via invite code → approved member; can join public outings",
};
const PERSONA_OUTSIDER = {
  id: "outsider",
  phone: "0633333333",
  meaning: "No club membership; public join OK; members-only must request/block",
};
const PERSONA_PENDING = {
  id: "pending",
  phone: "0644444444",
  meaning: "Requested club join; pending ≠ approved; not treated as member",
};
const PERSONA_DEMO = {
  id: "demo-canonical",
  phone: "0708060337",
  meaning: "Canonical demo phone — may be pre-seeded into Casa club",
};

let inviteCodeClubA = null;
let inviteCodeClubB = null;
let clubAName = "Audit Club Alpha";
let clubBName = "Audit Club Beta";
let publicOutingId = null;
let membersOutingId = null;

// --- S1: Organizer creates two distinct clubs ---
{
  const id = "S1-two-clubs";
  const okLogin = await loginViaUi(PERSONA_ORG.phone, { label: "org" });
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    if (!okLogin) throw new Error("login failed");
    await goto("/club/access");
    await clickTestId("club-create-nav");
    await new Promise((r) => setTimeout(r, 1000));
    await typeTestId("club-name-input", clubAName);
    await typeTestId("club-city-input", "Casablanca");
    await clickTestId("club-create-submit");
    await new Promise((r) => setTimeout(r, 2000));
    shotPath = await shot("S1-club-a-created");
    // Generate invite A from Accès club (admin CTA)
    await goto("/club/access");
    await new Promise((r) => setTimeout(r, 1000));
    await clickTestId("club-generate-invite");
    await new Promise((r) => setTimeout(r, 1200));
    inviteCodeClubA = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="club-invite-code"]');
      return el?.textContent?.trim() || null;
    });
    await shot("S1-club-a-invite");

    // Create club B
    await goto("/club/access");
    await clickTestId("club-create-nav");
    await new Promise((r) => setTimeout(r, 1000));
    await typeTestId("club-name-input", clubBName);
    await typeTestId("club-city-input", "Rabat");
    await clickTestId("club-create-submit");
    await new Promise((r) => setTimeout(r, 2000));
    await shot("S1-club-b-created");
    await goto("/club/access");
    await new Promise((r) => setTimeout(r, 1000));
    // Select Beta in invite club picker (Puppeteer click — RN-web Pressable)
    const betaTestId = await page.evaluate(() => {
      const chips = [
        ...document.querySelectorAll('[data-testid^="invite-club-"]'),
      ];
      const beta = chips.find((c) => /Beta/i.test(c.textContent || ""));
      return beta?.getAttribute("data-testid") || null;
    });
    if (betaTestId) {
      await page.click(`[data-testid="${betaTestId}"]`);
      await new Promise((r) => setTimeout(r, 800));
      // Wait until generate CTA names Beta
      await page
        .waitForFunction(
          () => {
            const btn = document.querySelector(
              '[data-testid="club-generate-invite"]',
            );
            return /Beta/i.test(btn?.textContent || "");
          },
          { timeout: 5000 },
        )
        .catch(() => null);
    } else {
      console.log("S1 warn: beta invite chip not found");
    }
    await clickTestId("club-generate-invite");
    await new Promise((r) => setTimeout(r, 1200));
    inviteCodeClubB = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="club-invite-code"]');
      return el?.textContent?.trim() || null;
    });
    const generateLabel = await page.evaluate(
      () =>
        document
          .querySelector('[data-testid="club-generate-invite"]')
          ?.textContent?.trim() || "",
    );
    shotPath = await shot("S1-club-b-invite");
    if (!/Beta/i.test(generateLabel)) {
      console.log("S1 warn: generate CTA still not Beta:", generateLabel);
    }

    await goto("/club");
    await new Promise((r) => setTimeout(r, 1200));
    const clubsText = await bodyText();
    const hasA = /Alpha/i.test(clubsText);
    const hasB =
      /Beta/i.test(clubsText) ||
      Boolean(
        await page.evaluate(() =>
          [...document.querySelectorAll('[data-testid^="club-switch-"]')].some(
            (el) => /Beta/i.test(el.textContent || ""),
          ),
        ),
      );
    // Switch to Beta chip if present
    await page.evaluate(() => {
      const chip = [...document.querySelectorAll('[data-testid^="club-switch-"]')]
        .find((el) => /Beta/i.test(el.textContent || ""));
      chip?.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const afterSwitch = await bodyText();
    const betaFocused = /Beta/i.test(afterSwitch);
    const distinctCodes =
      inviteCodeClubA &&
      inviteCodeClubB &&
      inviteCodeClubA !== inviteCodeClubB &&
      !/MEMBRE|ACTIVIT|CLUBS/i.test(inviteCodeClubA) &&
      !/MEMBRE|ACTIVIT|CLUBS/i.test(inviteCodeClubB);
    actual = `clubsVisible A=${hasA} B=${hasB||betaFocused}; codeA=${inviteCodeClubA} codeB=${inviteCodeClubB}; betaFocused=${betaFocused}`;
    result = hasA && (hasB || betaFocused) && distinctCodes ? "PASS" : "FAIL";
    if (hasA && !(hasB || betaFocused)) {
      flagContradiction({
        severity: "P0",
        title: "Second club exists in data but is invisible / unswitchable in Clubs UI",
        impact: "Edits and invites silently target the wrong club",
        evidence: actual,
        scenario: id,
      });
    }
    if ((hasB || betaFocused) && !distinctCodes) {
      flagContradiction({
        severity: "P0",
        title: "Two clubs share or lack distinct invite codes",
        impact: "Invite intended for Club A may join Club B or fail silently",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S1-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Organizer creates two distinct clubs with distinct invites",
    persona: PERSONA_ORG.id,
    setup: "Fresh DEMO_MODE; real OTP login",
    steps: [
      "Login as organizer",
      "Create Club Alpha + generate invite",
      "Create Club Beta + generate invite",
      "Verify Clubs list shows both; codes differ",
    ],
    expectedMeaning:
      "Each club is a separate membership boundary with its own invite code",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S2: Member joins intended club via invite (not auto-attendance) ---
{
  const id = "S2-invite-joins-intended-club";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    if (!inviteCodeClubA) throw new Error("no invite code A from S1");
    // Preserve clubs/invites created by organizer on this device
    const okLogin = await loginViaUi(PERSONA_MEMBER.phone, {
      label: "member",
      preserveMockWorld: true,
    });
    if (!okLogin) throw new Error("login failed");
    await goto("/club/access");
    await typeTestId("club-invite-code-input", inviteCodeClubA);
    await clickTestId("club-join-by-code");
    await new Promise((r) => setTimeout(r, 2000));
    shotPath = await shot("S2-after-invite-join");
    const text = await bodyText();
    const joined =
      /rejoint|Bienvenue|membre|succès|Alpha/i.test(text) ||
      /MEMBRE|approuv/i.test(text);
    // Check not pending
    const looksPending = /en attente|pending|Demande/i.test(text) &&
      !/Bienvenue|rejoint/i.test(text);
    await goto("/club");
    const clubText = await bodyText();
    const inAlpha = /Alpha/i.test(clubText);
    const inBeta = /Beta/i.test(clubText);
    // Membership ≠ attendance: My outings should not magically fill with club sessions
    await goto("/my-sessions");
    const myText = await bodyText();
    const autoAttended = /inscrit|À VENIR/i.test(myText) &&
      !/Rien de prévu|Aucune séance|rejoins/i.test(myText);
    actual = `joinedMsg=${joined}; pending=${looksPending}; clubList A=${inAlpha} B=${inBeta}; autoAttended=${autoAttended}`;
    result = joined && inAlpha && !inBeta && !looksPending ? "PASS" : "FAIL";
    if (autoAttended) {
      flagContradiction({
        severity: "P0",
        title: "Club membership appears to imply outing attendance",
        impact: "User thinks joining a club enrolled them in outings",
        evidence: actual,
        scenario: id,
      });
      result = "FAIL";
    }
    if (inBeta && inviteCodeClubA) {
      flagContradiction({
        severity: "P0",
        title: "Invite for Club A also shows Club B membership",
        impact: "Wrong club context for subsequent edits/outings",
        evidence: actual,
        scenario: id,
      });
    }
    // Invite-by-code auto-approves (vs request path) — document meaning
    if (joined && !looksPending) {
      // Intentional product split: code = approved, request = pending
      // Record as observed policy, not failure
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S2-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Invite code joins the intended club; membership ≠ attendance",
    persona: PERSONA_MEMBER.id,
    setup: `Fresh login; use invite ${inviteCodeClubA}`,
    steps: [
      "Login as member phone",
      "Club access → enter Club A invite → Rejoindre",
      "Check Clubs list for Alpha only",
      "Check Mes sorties not auto-filled",
    ],
    expectedMeaning:
      "Code grants membership to that club only; does not enroll in outings",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S3: Outsider is not silently a Casa member ---
{
  const id = "S3-outsider-not-auto-member";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    const okLogin = await loginViaUi(PERSONA_OUTSIDER.phone, {
      label: "outsider",
    });
    if (!okLogin) throw new Error("login failed");
    await goto("/club");
    shotPath = await shot("S3-outsider-clubs");
    const text = await bodyText();
    const hasCasa = /Casa Running|casa-running/i.test(text);
    const hasMemberBadge = /MEMBRE|Approuv/i.test(text) && hasCasa;
    const emptyOrJoin =
      /Aucun club|Rejoindre|Accès club|Créer/i.test(text) ||
      (!hasCasa && !/MEMBRE/i.test(text));
    actual = `hasCasa=${hasCasa}; memberBadge=${hasMemberBadge}; emptyOrJoinCTA=${emptyOrJoin}`;
    result = !hasMemberBadge && emptyOrJoin ? "PASS" : "FAIL";
    if (hasMemberBadge) {
      flagContradiction({
        severity: "P0",
        title: "DEMO login silently approves outsider into Casa club",
        impact: "Cannot test outsider/pending; privacy and invite flows lie",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S3-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Outsider login is not silently a Casa club member",
    persona: PERSONA_OUTSIDER.id,
    setup: "Fresh login with non-demo phone",
    steps: ["Login", "Open Clubs", "Assert no approved Casa membership"],
    expectedMeaning:
      "Only invite/request (or canonical demo phone) creates membership",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S4: Pending request ≠ approved ---
{
  const id = "S4-pending-not-approved";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    const okLogin = await loginViaUi(PERSONA_PENDING.phone, {
      label: "pending",
    });
    if (!okLogin) throw new Error("login failed");
    await goto("/club/access");
    // Request by name (not code)
    await page.evaluate(() => {
      const inputs = [...document.querySelectorAll("input")];
      // second card name field — fill club name
    });
    // type into club name request field if present
    const filled = await page.evaluate((name) => {
      const labels = [...document.querySelectorAll("*")];
      // find input near "Nom du club"
      const inputs = [...document.querySelectorAll("input")];
      // Prefer invite code empty; use name field that isn't invite
      const invite = document.querySelector(
        '[data-testid="club-invite-code-input"]',
      );
      const candidates = inputs.filter((i) => i !== invite && i.getBoundingClientRect().width > 0);
      const nameInput = candidates[0];
      if (!nameInput) return false;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(nameInput, name);
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }, clubAName);
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"],button')]
        .find((n) => /Demander/i.test(n.textContent || ""))
        ?.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    shotPath = await shot("S4-after-request");
    const text = await bodyText();
    await goto("/club");
    const clubText = await bodyText();
    const pending =
      /attente|pending|Demande/i.test(text + clubText) ||
      /en attente/i.test(clubText);
    const approvedAsMember =
      /MEMBRE/i.test(clubText) && !/attente/i.test(clubText);
    actual = `filled=${filled}; pendingUI=${pending}; approvedAsMember=${approvedAsMember}; snippet=${(text + clubText).slice(0, 220)}`;
    result = pending && !approvedAsMember ? "PASS" : approvedAsMember ? "FAIL" : pending ? "PASS" : "FAIL";
    if (approvedAsMember) {
      flagContradiction({
        severity: "P0",
        title: "Request-to-join is treated as approved membership",
        impact: "Pending applicants gain member privileges and private access",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S4-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Club join request stays pending (not approved)",
    persona: PERSONA_PENDING.id,
    setup: "Fresh login; request Club Alpha by name",
    steps: ["Login", "Accès club → Demander à rejoindre", "Check Clubs status"],
    expectedMeaning: "Pending applicant cannot act as approved member",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S5: Public outing join/leave consistency ---
{
  const id = "S5-join-leave-consistency";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    const okLogin = await loginViaUi(PERSONA_MEMBER.phone, { label: "m2" });
    if (!okLogin) throw new Error("login failed");
    // Re-join club A if needed
    if (inviteCodeClubA) {
      await goto("/club/access");
      await typeTestId("club-invite-code-input", inviteCodeClubA);
      await clickTestId("club-join-by-code");
      await new Promise((r) => setTimeout(r, 1500));
    }
    await goto("/");
    await new Promise((r) => setTimeout(r, 1500));
    const sid = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="session-card-explore-sortie-longue-facile"]',
      ) || document.querySelector('[data-testid^="session-card-"]');
      return el?.getAttribute("data-testid")?.replace("session-card-", "") || null;
    });
    publicOutingId = sid;
    if (!sid) throw new Error("no session card");
    await goto(`/session/${sid}`);
    await page.evaluate(() => {
      document.querySelector('[data-testid^="session-group-"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const before = await page.evaluate(() => ({
      join: Boolean(document.querySelector('[data-testid="session-join-btn"]')),
      leave: Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
      modify: Boolean(document.querySelector('[data-testid="session-modify-btn"]')),
    }));
    if (before.modify && before.join) {
      flagContradiction({
        severity: "P0",
        title: "Participant sees both join and organizer modify controls",
        impact: "Non-hosts can edit/delete outings they do not own",
        evidence: JSON.stringify(before),
        scenario: id,
      });
    }
    if (before.leave) {
      // leave first
      const leaveHandle = await page.$('[data-testid="session-leave-btn"]');
      await leaveHandle?.click();
      await new Promise((r) => setTimeout(r, 1200));
    }
    await page.evaluate(() => {
      document.querySelector('[data-testid="session-join-btn"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      document.querySelector('[data-testid="session-join-confirm"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    const afterJoin = await page.evaluate(() => ({
      leave: Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
      join: Boolean(document.querySelector('[data-testid="session-join-btn"]')),
      text: document.body.innerText.slice(0, 400),
    }));
    shotPath = await shot("S5-after-join");
    // My outings
    await goto("/my-sessions");
    const myAfter = await bodyText();
    const inMy = /SORTIE|FARTLEK|inscrit|À VENIR|LONGUE/i.test(myAfter);
    // Reload detail
    await goto(`/session/${sid}`);
    const afterReload = await page.evaluate(() => ({
      leave: Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
      join: Boolean(document.querySelector('[data-testid="session-join-btn"]')),
    }));
    // Leave
    if (afterReload.leave) {
      const h = await page.$('[data-testid="session-leave-btn"]');
      await h?.click();
      await new Promise((r) => setTimeout(r, 1500));
    }
    const afterLeave = await page.evaluate(() => ({
      leave: Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
      join: Boolean(document.querySelector('[data-testid="session-join-btn"]')),
    }));
    await shot("S5-after-leave");
    actual = `before=${JSON.stringify(before)}; afterJoin=${JSON.stringify({ leave: afterJoin.leave, join: afterJoin.join })}; inMy=${inMy}; afterReload=${JSON.stringify(afterReload)}; afterLeave=${JSON.stringify(afterLeave)}`;
    const joinOk = afterJoin.leave && !afterJoin.join;
    const persistOk = afterReload.leave;
    const leaveOk = !afterLeave.leave && afterLeave.join;
    result = joinOk && persistOk && leaveOk ? "PASS" : "FAIL";
    if (joinOk && !inMy) {
      flagContradiction({
        severity: "P1",
        title: "Joined outing missing from Mes sorties after successful join",
        impact: "User cannot find logistics for an outing they just joined",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S5-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Join/leave updates detail + persists across reload; Mes sorties consistent",
    persona: PERSONA_MEMBER.id,
    setup: "Member account; public seed outing",
    steps: [
      "Open public outing",
      "S'inscrire → assert leave CTA",
      "Check Mes sorties",
      "Reload detail → still joined",
      "Quitter → join CTA returns",
    ],
    expectedMeaning:
      "Attendance is explicit, durable in-session, and reflected in My outings",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S6: Members-only outing privacy for outsider (direct link) ---
{
  const id = "S6-members-only-privacy";
  let result = "BLOCKED";
  let actual = "";
  let shotPath = "";
  try {
    // Organizer creates members-only outing if possible
    const okOrg = await loginViaUi(PERSONA_ORG.phone, { label: "org2" });
    if (!okOrg) throw new Error("org login failed");
    await goto("/session/create");
    await new Promise((r) => setTimeout(r, 1500));
    shotPath = await shot("S6-create-form");
    const createText = await bodyText();
    const hasVisibility = /Public|Membres|Privé|visibilité/i.test(createText);
    // Try select members visibility
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"],button,*')]
        .find((n) => /Membres|Privé \(membres\)|Réservé/i.test((n.textContent || "").trim()))
        ?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    // Fill minimal and publish if fields exist
    await page.evaluate(() => {
      const title = document.querySelector('[data-testid="session-title-input"]') ||
        [...document.querySelectorAll("input")].find((i) => /titre|title|nom/i.test(i.placeholder || ""));
      if (title) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(title, "Audit Members Only");
        title.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    try {
      await clickTestId("session-publish-btn");
    } catch {
      await page.evaluate(() => {
        [...document.querySelectorAll('[role="button"],button')]
          .find((n) => /Publier/i.test(n.textContent || ""))
          ?.click();
      });
    }
    await new Promise((r) => setTimeout(r, 2500));
    membersOutingId = page.url().includes("/session/")
      ? page.url().split("/session/")[1]?.split("?")[0]
      : null;
    await shot("S6-after-publish");

    // Outsider opens direct link
    const okOut = await loginViaUi(PERSONA_OUTSIDER.phone, { label: "out2" });
    if (!okOut) throw new Error("outsider login failed");
    if (!membersOutingId) {
      // try known demo members session
      await goto("/");
      const text = await bodyText();
      actual = `no membersOutingId after publish; createHasVisibility=${hasVisibility}; home=${text.slice(0, 120)}`;
      result = "BLOCKED";
      flagContradiction({
        severity: "P1",
        title: "Could not create/capture members-only outing id for privacy probe",
        impact: "Cannot prove direct-link privacy for private outings in this run",
        evidence: actual,
        scenario: id,
      });
    } else {
      await goto(`/session/${membersOutingId}`);
      shotPath = await shot("S6-outsider-direct-link");
      const t = await bodyText();
      const canJoin = await page.evaluate(() =>
        Boolean(document.querySelector('[data-testid="session-join-btn"]')),
      );
      const requestOnly = await page.evaluate(() =>
        Boolean(document.querySelector('[data-testid="session-join-request"]')),
      );
      const showsPrivateLogistics =
        /Lieu exact|Coordonnées GPS|WhatsApp|TON RENDEZ-VOUS/i.test(t) &&
        /inscrit/i.test(t);
      const blockedJoin = !canJoin;
      actual = `canJoin=${canJoin}; requestOnly=${requestOnly}; privateLogistics=${showsPrivateLogistics}; text=${t.slice(0, 240)}`;
      result = blockedJoin && !showsPrivateLogistics ? "PASS" : "FAIL";
      if (canJoin) {
        flagContradiction({
          severity: "P0",
          title: "Outsider can S'inscrire on members-only outing via direct link",
          impact: "Private club outings are not private",
          evidence: actual,
          scenario: id,
        });
      }
      if (showsPrivateLogistics) {
        flagContradiction({
          severity: "P0",
          title: "Private logistics visible to non-members on direct link",
          impact: "Meeting point / contact leaks",
          evidence: actual,
          scenario: id,
        });
      }
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S6-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Members-only outing: outsider direct link cannot join or see logistics",
    persona: `${PERSONA_ORG.id}→${PERSONA_OUTSIDER.id}`,
    setup: "Organizer publishes members-only; outsider opens /session/:id",
    steps: [
      "Organizer create members-only outing",
      "Outsider login",
      "Open direct session URL",
      "Assert no join + no private logistics",
    ],
    expectedMeaning: "Visibility=members gates attendance and sensitive details",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S7: Standalone public outing does not inherit club context ---
{
  const id = "S7-standalone-no-club-context";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    const ok = await loginViaUi(PERSONA_ORG.phone, { label: "org3" });
    if (!ok) throw new Error("login failed");
    await goto("/session/create");
    await new Promise((r) => setTimeout(r, 1500));
    // Ensure Public selected
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"],button,*')]
        .find((n) => /^Public$/i.test((n.textContent || "").trim()))
        ?.click();
    });
    await page.evaluate(() => {
      const inputs = [...document.querySelectorAll("input, textarea")];
      const title =
        document.querySelector('[data-testid="session-title-input"]') ||
        inputs[0];
      if (title) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(title, "Audit Standalone Public");
        title.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    try {
      await clickTestId("session-publish-btn");
    } catch {
      await page.evaluate(() => {
        [...document.querySelectorAll('[role="button"],button')]
          .find((n) => /Publier/i.test(n.textContent || ""))
          ?.click();
      });
    }
    await new Promise((r) => setTimeout(r, 2500));
    shotPath = await shot("S7-after-publish");
    const url = page.url();
    const text = await bodyText();
    const inheritedClub =
      /réservé aux membres|Club Alpha|Club Beta|Casa Running|MEMBRES UNIQUEMENT/i.test(
        text,
      );
    const looksPublic = /Public|S'inscrire|ouverte/i.test(text) || !inheritedClub;
    actual = `url=${url}; inheritedClub=${inheritedClub}; looksPublic=${looksPublic}; snippet=${text.slice(0, 200)}`;
    result = !inheritedClub ? "PASS" : "FAIL";
    if (inheritedClub) {
      flagContradiction({
        severity: "P0",
        title: "Standalone public outing inherits club/members framing",
        impact: "Public walks appear club-gated; wrong audience",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S7-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Standalone public outing does not inherit club membership context",
    persona: PERSONA_ORG.id,
    setup: "Organizer with clubs; publish Public outing",
    steps: ["Create session", "Select Public", "Publish", "Assert no members-only club framing"],
    expectedMeaning: "Public outings are independent of club membership",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S8: Walking/language — forced running pace/coach assumptions ---
{
  const id = "S8-walk-language-no-run-assumptions";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    const ok = await loginViaUi(PERSONA_OUTSIDER.phone, { label: "walk" });
    if (!ok) throw new Error("login failed");
    await goto("/");
    // Filter community / languages if present
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"],button,*')]
        .find((n) => /Langues|Communauté|Marche/i.test((n.textContent || "").trim()))
        ?.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    shotPath = await shot("S8-discover-filters");
    await goto("/session/create");
    await new Promise((r) => setTimeout(r, 1200));
    const createText = await bodyText();
    await shot("S8-create");
    const forcesRun =
      /VMA|Seuil|Fartlek|allure cible|min\/km|Groupe A|coach/i.test(createText) &&
      !/marche|langue|communauté|balade/i.test(createText);
    const hasWalkPath =
      /Marche|Communauté|Langue|Sortie libre|Sans allure/i.test(createText);
    await goto("/profile");
    const profileText = await bodyText();
    const profileForces10k = /10k|10 km|VO₂|VO2|objectif.*course/i.test(
      profileText,
    );
    actual = `forcesRunOnlyCreate=${forcesRun}; hasWalkPath=${hasWalkPath}; profileForces10k=${profileForces10k}`;
    result = hasWalkPath && !profileForces10k ? "PASS" : "FAIL";
    if (forcesRun || profileForces10k) {
      flagContradiction({
        severity: "P1",
        title: "Walking/language users pushed into running pace/goal/coach model",
        impact: "Community walkers must invent a pace/goal to use the product",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S8-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Walking/language users are not forced into running goals/pace/coach",
    persona: PERSONA_OUTSIDER.id,
    setup: "Fresh outsider; inspect Découvrir filters + create + profile",
    steps: [
      "Open Découvrir community/langues filters",
      "Open Créer une séance",
      "Open Profil",
      "Assert walk path exists; no mandatory 10k/VO2",
    ],
    expectedMeaning: "Community/walk experiences are first-class without run PR framing",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S9: Same-device account switch persistence ---
{
  const id = "S9-account-switch";
  let result = "FAIL";
  let actual = "";
  let shotPath = "";
  try {
    // Member joins outing
    const ok1 = await loginViaUi(PERSONA_MEMBER.phone, { label: "sw1" });
    if (!ok1) throw new Error("member login failed");
    if (inviteCodeClubA) {
      await goto("/club/access");
      await typeTestId("club-invite-code-input", inviteCodeClubA);
      await clickTestId("club-join-by-code");
      await new Promise((r) => setTimeout(r, 1000));
    }
    const sid = publicOutingId || "explore-sortie-longue-facile";
    await goto(`/session/${sid}`);
    await page.evaluate(() => {
      document.querySelector('[data-testid^="session-group-"]')?.click();
      document.querySelector('[data-testid="session-join-btn"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      document.querySelector('[data-testid="session-join-confirm"]')?.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    const memberJoined = await page.evaluate(() =>
      Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
    );
    await shot("S9-member-joined");

    // Switch to outsider
    const ok2 = await loginViaUi(PERSONA_OUTSIDER.phone, { label: "sw2" });
    if (!ok2) throw new Error("outsider login failed");
    await goto(`/session/${sid}`);
    const outsiderState = await page.evaluate(() => ({
      leave: Boolean(document.querySelector('[data-testid="session-leave-btn"]')),
      join: Boolean(document.querySelector('[data-testid="session-join-btn"]')),
    }));
    shotPath = await shot("S9-outsider-after-switch");
    actual = `memberJoined=${memberJoined}; outsider=${JSON.stringify(outsiderState)}`;
    // Outsider must not inherit member's attendance
    result =
      memberJoined && !outsiderState.leave && outsiderState.join
        ? "PASS"
        : "FAIL";
    if (outsiderState.leave) {
      flagContradiction({
        severity: "P0",
        title: "Attendance leaks across same-device account switch",
        impact: "New identity sees previous user's join state",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S9-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Same-device account switch does not leak attendance",
    persona: `${PERSONA_MEMBER.id}→${PERSONA_OUTSIDER.id}`,
    setup: "Member joins outing; logout via fresh login as outsider",
    steps: ["Member join", "Outsider login (storage cleared)", "Open same outing"],
    expectedMeaning: "Attendance is per-identity, not device-global after switch",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo-same-device-switch",
  });
}

// --- S10: Unsupported policies honesty ---
{
  const id = "S10-unsupported-policies";
  let result = "PASS";
  let actual = "";
  let shotPath = "";
  try {
    const ok = await loginViaUi(PERSONA_ORG.phone, { label: "pol" });
    if (!ok) throw new Error("login failed");
    await goto(`/session/${publicOutingId || "explore-sortie-longue-facile"}`);
    shotPath = await shot("S10-session-detail");
    const text = await bodyText();
    const claimsFull = /complet|complets|plus de place|waitlist|liste d'attente/i.test(
      text,
    );
    const claimsCancelOuting =
      /annuler la sortie|sortie annulée|cancelled/i.test(text);
    const claimsExpireInvite = /expire|expiré|valable/i.test(
      await (async () => {
        await goto("/club/access");
        return bodyText();
      })(),
    );
    actual = `UI claims full/waitlist=${claimsFull}; cancelOuting=${claimsCancelOuting}; expireInvite=${claimsExpireInvite}`;
    // Flag if UI claims features we know are unsupported
    if (claimsFull) {
      flagContradiction({
        severity: "P2",
        title: "UI mentions full/waitlist without verified capacity enforcement",
        impact: "Users trust a capacity policy that may be decorative",
        evidence: actual,
        scenario: id,
      });
    }
    // Document BLOCKED surfaces
    flagContradiction({
      severity: "P2",
      title: "UNSUPPORTED: hosted cross-device persistence not verified in this run",
      impact: "Cannot claim attendance survives devices/backends",
      evidence: "No hosted preview URL/credentials in cloud agent",
      scenario: id,
    });
    flagContradiction({
      severity: "P2",
      title: "UNSUPPORTED: expired invites / cancel outing / capacity-full lifecycle",
      impact: "No product path exercised for expire/cancel/full in demo mock",
      evidence: "Mock invite codes do not expire; no cancel-outing control found",
      scenario: id,
    });
    result = "PASS"; // honesty checklist completed
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S10-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Unsupported policies flagged honestly (expire/cancel/full/hosted)",
    persona: PERSONA_ORG.id,
    setup: "Inspect session + invite UI for claimed vs implemented policies",
    steps: ["Open outing detail", "Open club access", "Record claims vs support"],
    expectedMeaning: "Product must not silently invent expire/cancel/full/hosted guarantees",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- S11: Labels — Publier vs S'inscrire vs Demander ---
{
  const id = "S11-action-labels";
  let result = "PASS";
  let actual = "";
  let shotPath = "";
  try {
    const ok = await loginViaUi(PERSONA_MEMBER.phone, { label: "labels" });
    if (!ok) throw new Error("login failed");
    await goto("/session/create");
    const createText = await bodyText();
    const publishLabel = /Publier la séance|Mettre à jour/i.test(createText);
    await goto(`/session/${publicOutingId || "explore-sortie-longue-facile"}`);
    const detail = await page.evaluate(() => ({
      join: document.querySelector('[data-testid="session-join-btn"]')?.textContent,
      request: document.querySelector('[data-testid="session-join-request"]')?.textContent,
      leave: document.querySelector('[data-testid="session-leave-btn"]')?.textContent,
      modify: document.querySelector('[data-testid="session-modify-btn"]')?.textContent,
    }));
    shotPath = await shot("S11-labels");
    actual = `publishOnCreate=${publishLabel}; detail=${JSON.stringify(detail)}`;
    if (!publishLabel) {
      result = "FAIL";
      flagContradiction({
        severity: "P1",
        title: "Create flow missing Publier label",
        impact: "Unclear whether draft is saved or published",
        evidence: actual,
        scenario: id,
      });
    }
  } catch (e) {
    actual = String(e.message || e);
    shotPath = await shot("S11-error");
    result = "FAIL";
  }
  recordScenario({
    id,
    title: "Action labels: Publier (create) vs S'inscrire/Demander/Quitter (detail)",
    persona: PERSONA_MEMBER.id,
    setup: "Compare create CTA vs detail CTAs",
    steps: ["Open create", "Open detail", "Record CTA copy"],
    expectedMeaning: "Publish ≠ attend; request ≠ join; leave ≠ delete outing",
    actual,
    result,
    screenshot: shotPath,
    surface: "demo",
  });
}

// --- Hosted / cross-device BLOCKED markers ---
recordScenario({
  id: "S12-hosted-blocked",
  title: "Hosted journey acceptance",
  persona: "n/a",
  setup: "Cloud agent environment",
  steps: ["Check for hosted preview URL"],
  expectedMeaning: "Hosted persistence separate from demo localStorage",
  actual: "No hosted preview credentials/URL in this run",
  result: "BLOCKED",
  screenshot: "",
  surface: "hosted",
});
recordScenario({
  id: "S13-cross-device-blocked",
  title: "Cross-device persistence",
  persona: "n/a",
  setup: "Requires two devices or hosted backend",
  steps: ["Join on device A", "Login on device B"],
  expectedMeaning: "Attendance follows account across devices",
  actual: "Not executable without hosted API + second device",
  result: "BLOCKED",
  screenshot: "",
  surface: "cross-device",
});

await browser.close();

// Rank contradictions
const severityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
contradictions.sort(
  (a, b) =>
    (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
);

const summary = {
  sha,
  generatedAt: new Date().toISOString(),
  mode: "offline-demo",
  hosted: "BLOCKED — no hosted preview in this run",
  crossDevice: "BLOCKED — no second device/hosted API",
  scenarios: scenarios.map((s) => ({
    id: s.id,
    result: s.result,
    title: s.title,
  })),
  counts: {
    pass: scenarios.filter((s) => s.result === "PASS").length,
    fail: scenarios.filter((s) => s.result === "FAIL").length,
    blocked: scenarios.filter((s) => s.result === "BLOCKED").length,
    contradictions: contradictions.length,
  },
  preview: {
    branch: "cursor/green-home-ux-join-3184",
    command: "EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081",
    reference: `${BASE}/reference/green-home`,
    live: `${BASE}/`,
  },
};

const reportMd = `# Semantic / product-logic audit

**SHA:** \`${sha}\`  
**Generated:** ${summary.generatedAt}  
**Surfaces:** demo (executed) · same-device switch (executed) · hosted (**BLOCKED**) · cross-device (**BLOCKED**)

## Summary

| Result | Count |
|--------|------:|
| PASS | ${summary.counts.pass} |
| FAIL | ${summary.counts.fail} |
| BLOCKED | ${summary.counts.blocked} |
| Contradictions flagged | ${summary.counts.contradictions} |

Green design preserved. This is **not** an MVP-ready claim.

## Meaning map (membership ≠ attendance ≠ pace group)

| Concept | Meaning in product |
|---------|-------------------|
| Club membership | Access boundary to a club (pending \| approved). Invite **code** → approved; **request** → pending. |
| Outing attendance | Explicit S'inscrire / Quitter on a session. Must not be implied by membership. |
| Pace group | Optional allure bucket for a session; not club membership. |
| Visibility public | Anyone can attempt join (subject to other gates). |
| Visibility members | Requires approved membership of that club; outsiders get request/lock. |
| Organizer controls | Modifier/Supprimer only when \`hostUserId\` matches viewer — not merely \`isCustom\`. |

## Ranked contradiction register

${contradictions
  .map(
    (c, i) =>
      `### ${i + 1}. [${c.severity}] ${c.title}\n- **Impact:** ${c.impact}\n- **Scenario:** ${c.scenario}\n- **Evidence:** ${c.evidence}\n`,
  )
  .join("\n") || "_No contradictions recorded._"}

## Scenario log

${scenarios
  .map(
    (s) => `### ${s.id} — ${s.result}
- **Title:** ${s.title}
- **Persona:** ${s.persona}
- **Setup:** ${s.setup}
- **Steps:** ${(s.steps || []).map((x) => `\n  1. ${x}`).join("") || "—"}
- **Expected meaning:** ${s.expectedMeaning}
- **Actual:** ${s.actual}
- **Surface:** ${s.surface}
- **Screenshot:** ${s.screenshot || "—"}
`,
  )
  .join("\n")}

## Preview

\`\`\`bash
EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
# ${BASE}/reference/green-home
# ${BASE}/
\`\`\`

No merge / production / spend / credential changes / OCIF submission.
`;

fs.writeFileSync(path.join(OUT, "REPORT.md"), reportMd);
fs.writeFileSync(path.join(REPO, "REPORT.md"), reportMd);
fs.writeFileSync(
  path.join(OUT, "results.json"),
  JSON.stringify({ summary, scenarios, contradictions }, null, 2),
);
fs.writeFileSync(
  path.join(REPO, "results.json"),
  JSON.stringify({ summary, scenarios, contradictions }, null, 2),
);

console.log("\n=== AUDIT SUMMARY ===");
console.log(JSON.stringify(summary.counts, null, 2));
console.log("SHA", sha);
console.log("Report:", path.join(REPO, "REPORT.md"));
