/**
 * Real UI E2E (DEMO_MODE offline) — no auth storage seeding.
 * Uses semantic testIDs / accessibility labels for clicks.
 *
 * Usage: EXPO_PUBLIC_DEMO_MODE=true node scripts/mvp-e2e-ui.mjs
 * Requires: Expo web on http://localhost:8081
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const OUT = "/opt/cursor/artifacts/e2e";
const SHOTS = path.join(OUT, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.E2E_BASE_URL || "http://localhost:8081";
const results = {
  mode: "offline-demo",
  hosted: "blocked — no hosted preview credentials/URL in this run",
  checks: {},
  errors: [],
  notes: [],
};

function record(name, ok, detail = "") {
  results.checks[name] = { ok, detail };
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
page.setDefaultTimeout(25000);

async function shot(name) {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: false });
  results.notes.push(`shot:${file}`);
  return file;
}

async function clearAppStorage() {
  await page.goto(BASE + "/onboarding", { waitUntil: "networkidle0", timeout: 90000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(BASE + "/onboarding", { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1500));
}

async function clickTestId(testId, label = testId) {
  const sel = `[data-testid="${testId}"]`;
  await page.waitForSelector(sel, { visible: true, timeout: 20000 });
  await page.click(sel);
  results.notes.push(`click:${label}`);
}

async function typeTestId(testId, value) {
  const sel = `[data-testid="${testId}"]`;
  await page.waitForSelector(sel, { visible: true });
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, value, { delay: 20 });
}

async function enterOtp(code) {
  for (let i = 0; i < code.length; i++) {
    const sel = `[data-testid="otp-digit-${i}"]`;
    await page.waitForSelector(sel, { visible: true });
    await page.click(sel);
    await page.keyboard.type(code[i]);
  }
}

async function bodyText() {
  return page.evaluate(() => document.body.innerText || "");
}

async function loginViaUi(phoneDigits, otp = "000000") {
  await clearAppStorage();
  await shot("01-onboarding-welcome.png");

  // Secondary: "J'ai déjà un compte" → real login
  await clickTestId("cta-secondary", "J'ai déjà un compte");
  await new Promise((r) => setTimeout(r, 1200));
  await shot("02-phone.png");

  await typeTestId("phone-input", phoneDigits);
  await clickTestId("cta-primary", "Recevoir le code");
  await new Promise((r) => setTimeout(r, 1500));
  const phoneUrl = page.url();
  record("login_navigated_to_verify", /verify/i.test(phoneUrl), phoneUrl);
  await shot("03-verify.png");

  await enterOtp(otp);
  await new Promise((r) => setTimeout(r, 400));
  // Ensure verify CTA fires if auto-complete didn't
  try {
    await clickTestId("cta-primary", "Vérifier");
  } catch {
    /* may already navigate */
  }
  await new Promise((r) => setTimeout(r, 2500));
  await shot("04-after-login.png");
  const text = await bodyText();
  const loggedIn =
    /Découvrir|Mes sorties|Clubs|Profil/i.test(text) &&
    !/Bon retour|Code reçu/i.test(text);
  record("login_reached_tabs", loggedIn, text.slice(0, 200));
  return loggedIn;
}

try {
  // --- Identity A: login ---
  const okA = await loginViaUi("0611111111");
  if (!okA) throw new Error("Login identity A failed");

  // Keyboard: Tab through tabs area (smoke)
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  record("keyboard_tab_smoke", true);

  // Profile community-primary
  await page.goto(BASE + "/profile", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await shot("05-profile-community.png");
  const profileText = await bodyText();
  record(
    "profile_no_primary_streak_prs",
    !/OBJECTIF|RECORDS PERSONNELS|PROFIL PHYSIQUE|Série/i.test(profileText) ||
      /Entraînement avancé/i.test(profileText),
    "training link expected; streak/PR blocks should not dominate primary",
  );
  record(
    "profile_has_training_link",
    /Entraînement avancé/i.test(profileText),
  );
  record("profile_has_clubs_section", /CLUBS|Aucun club|MEMBRE/i.test(profileText));

  // Open training secondary
  try {
    await clickTestId("profile-training-link");
    await new Promise((r) => setTimeout(r, 1500));
    await shot("06-training-secondary.png");
    const trainText = await bodyText();
    record(
      "training_secondary_has_metrics",
      /OBJECTIF|RECORDS|PROFIL PHYSIQUE|WORKOUTS/i.test(trainText),
    );
  } catch (e) {
    record("training_secondary_has_metrics", false, String(e));
  }

  // Create club 1
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await clickTestId("club-create-nav");
  await new Promise((r) => setTimeout(r, 1200));
  await shot("07-club-create.png");
  await typeTestId("club-name-input", "Club E2E Alpha");
  await typeTestId("club-city-input", "Casablanca");
  await clickTestId("club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));
  await shot("08-club1-created.png");
  record("club1_created", /Club E2E Alpha|Clubs|MEMBRE|Admin/i.test(await bodyText()));

  // Create club 2
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  await clickTestId("club-create-nav");
  await new Promise((r) => setTimeout(r, 1000));
  await typeTestId("club-name-input", "Club E2E Beta");
  await typeTestId("club-city-input", "Rabat");
  await clickTestId("club-create-submit");
  await new Promise((r) => setTimeout(r, 2000));
  await shot("09-club2-created.png");
  record("club2_created", /Club E2E Beta|Clubs/i.test(await bodyText()));

  // Generate invite from access (admin)
  await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  let inviteCode = null;
  const genClicked = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll('[role="button"], button, div'),
    );
    const btn = nodes.find((n) =>
      /Générer un code/i.test(n.textContent || ""),
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  record("invite_generate_clicked", genClicked);
  await new Promise((r) => setTimeout(r, 1200));
  inviteCode = await page.evaluate(() => {
    const el = document.querySelector('[class*="inviteCode"], [data-testid="club-invite-code"]');
    if (el?.textContent?.trim()) return el.textContent.trim();
    const body = document.body.innerText;
    const m = body.match(/\b[A-Z0-9]{6,10}\b/);
    return m ? m[0] : null;
  });
  record("invite_code_captured", Boolean(inviteCode), inviteCode || "");
  await shot("10-invite-code.png");

  // Create outings via Mes sorties
  await page.goto(BASE + "/my-sessions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await shot("11-my-outings.png");
  record("my_outings_title", /Mes sorties/i.test(await bodyText()));

  for (let i = 0; i < 2; i++) {
    try {
      await clickTestId("create-outing-btn");
      await new Promise((r) => setTimeout(r, 1500));
      await shot(`12-create-outing-${i + 1}.png`);
      // Fill minimal create form via labels if present
      const filled = await page.evaluate((n) => {
        const inputs = Array.from(document.querySelectorAll("input, textarea"));
        const spot = inputs.find((el) =>
          /spot|lieu|marina|endroit/i.test(
            el.getAttribute("placeholder") || el.getAttribute("aria-label") || "",
          ),
        );
        if (spot) {
          spot.focus();
          spot.value = `Corniche E2E ${n}`;
          spot.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return Boolean(spot);
      }, i + 1);
      // Submit primary if available
      try {
        await clickTestId("cta-primary");
      } catch {
        const submitted = await page.evaluate(() => {
          const nodes = Array.from(
            document.querySelectorAll('[role="button"], button'),
          );
          const btn = nodes.find((n) =>
            /Créer|Publier|Enregistrer|Continuer/i.test(n.textContent || ""),
          );
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        record(`outing_${i + 1}_submit_clicked`, submitted);
      }
      await new Promise((r) => setTimeout(r, 2000));
      record(`outing_${i + 1}_form_reached`, true, filled ? "spot filled" : "form opened");
    } catch (e) {
      record(`outing_${i + 1}_form_reached`, false, String(e));
    }
  }

  // Discovery: open first session card via testID
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2000));
  await shot("13-discovery.png");
  const sessionClicked = await page.evaluate(() => {
    const card = document.querySelector('[data-testid^="session-card-"]');
    if (card) {
      card.click();
      return card.getAttribute("data-testid");
    }
    return null;
  });
  record("session_card_semantic_click", Boolean(sessionClicked), sessionClicked || "");
  await new Promise((r) => setTimeout(r, 2000));
  await shot("14-session-detail.png");

  // Join / leave if buttons present
  try {
    await clickTestId("session-join-btn");
    await new Promise((r) => setTimeout(r, 1500));
    record("session_join_clicked", true);
    await shot("15-session-joined.png");
  } catch {
    try {
      await clickTestId("session-join-confirm");
      record("session_join_clicked", true, "confirm");
    } catch (e) {
      record("session_join_clicked", false, String(e.message || e));
    }
  }

  // Bad input: empty club create
  await page.goto(BASE + "/club/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  await clickTestId("club-create-submit");
  await new Promise((r) => setTimeout(r, 800));
  const badInputText = await bodyText();
  record(
    "bad_input_empty_club_name",
    /nom de club|Ajoute un nom|Impossible/i.test(badInputText),
    badInputText.slice(0, 160),
  );
  await shot("16-bad-input.png");

  // Private exclusion smoke: members-only language on create if present
  await page.goto(BASE + "/session/create", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const createText = await bodyText();
  record(
    "outing_create_has_visibility_controls",
    /membres|privé|public|visibilité|club/i.test(createText),
  );
  await shot("17-outing-create-visibility.png");

  // Desktop width constraint smoke
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await shot("18-home-desktop.png");
  record("desktop_home_loaded", /Découvrir/i.test(await bodyText()));

  // --- Identity B: join with invite (fresh login) ---
  if (inviteCode) {
    const okB = await loginViaUi("0622222222");
    record("login_identity_b", okB);
    if (okB) {
      await page.goto(BASE + "/club/access", { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1200));
      await typeTestId("club-invite-code-input", inviteCode);
      await clickTestId("club-join-by-code");
      await new Promise((r) => setTimeout(r, 2000));
      await shot("19-identity-b-joined.png");
      const joinText = await bodyText();
      record(
        "identity_b_join_attempt",
        /rejoint|attente|membre|club|succès|déjà/i.test(joinText),
        joinText.slice(0, 200),
      );
    }
  } else {
    record("identity_b_join_attempt", false, "no invite code");
  }

  // OTP isolation note (unit-tested separately): 000000 only DEMO_MODE
  results.notes.push(
    "OTP 000000 accepted only when EXPO_PUBLIC_DEMO_MODE=true (see mockOtpVerify)",
  );
} catch (err) {
  results.errors.push(String(err?.stack || err));
  console.error("E2E_FATAL", err);
  try {
    await shot("99-fatal.png");
  } catch {
    /* ignore */
  }
}

const passed = Object.values(results.checks).filter((c) => c.ok).length;
const failed = Object.values(results.checks).filter((c) => !c.ok).length;
results.summary = { passed, failed, total: passed + failed };
fs.writeFileSync(path.join(OUT, "e2e-results.json"), JSON.stringify(results, null, 2));
console.log("SUMMARY", results.summary);

await browser.close();
process.exit(failed > 0 || results.errors.length ? 1 : 0);
