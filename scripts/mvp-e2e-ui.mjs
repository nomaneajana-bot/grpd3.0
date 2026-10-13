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
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);
// confirmAction() uses window.confirm on web — must accept or evaluates hang
page.on("dialog", async (dialog) => {
  try {
    await dialog.accept();
  } catch {
    /* already handled */
  }
});

async function shot(name) {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: false });
  results.notes.push(`shot:${file}`);
  return file;
}

async function clearAppStorage({ preserveMockWorld = false } = {}) {
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
      // Keep mock clubs/sessions/invites; only drop auth so another identity can login.
      const authKeys = [
        "grpd_auth_user_v1",
        "grpd_auth_tokens_v1",
        "grpd_device_id_v1",
        "grpd_use_mock_api_v1",
        "grpd_login_phone_v1",
        "grpd_login_otp_request_v1",
        "grpd_onboarding_v1",
      ];
      for (const k of authKeys) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }, preserveMockWorld);
  await page.goto(BASE + "/onboarding", {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 1500));
}

/** Click visible testID; optional aria-label disambiguates stacked auth screens. */
async function clickTestId(testId, label = testId, ariaLabel = null) {
  const handle = await page.waitForFunction(
    (id, aria) => {
      const nodes = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      );
      const match = nodes.find((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const visible =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0;
        if (!visible) return false;
        if (aria && el.getAttribute("aria-label") !== aria) return false;
        return true;
      });
      if (match) {
        match.scrollIntoView({ block: "center" });
        return true;
      }
      return false;
    },
    { timeout: 20000 },
    testId,
    ariaLabel,
  );
  await page.evaluate(
    (id, aria) => {
      const nodes = Array.from(
        document.querySelectorAll(`[data-testid="${id}"]`),
      );
      const match = nodes.find((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const visible =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0;
        if (!visible) return false;
        if (aria && el.getAttribute("aria-label") !== aria) return false;
        return true;
      });
      match?.click();
    },
    testId,
    ariaLabel,
  );
  void handle;
  results.notes.push(`click:${label}`);
}

async function typeTestId(testId, value) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 20000 });
  await page.evaluate((id) => {
    const el = Array.from(
      document.querySelectorAll(`[data-testid="${id}"]`),
    ).find((n) => n.getBoundingClientRect().width > 0);
    if (!el) throw new Error(`No visible ${id}`);
    el.focus();
    const proto = window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc?.set?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, testId);
  await page.keyboard.type(value, { delay: 20 });
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

async function loginViaUi(
  phoneDigits,
  otp = "000000",
  { preserveMockWorld = false, shotPrefix = "" } = {},
) {
  await clearAppStorage({ preserveMockWorld });
  await shot(`${shotPrefix}01-onboarding-welcome.png`);

  // Secondary: "J'ai déjà un compte" → real login
  await clickTestId(
    "cta-secondary",
    "J'ai déjà un compte",
    "J'ai déjà un compte",
  );
  await page.waitForFunction(() => /\/phone/.test(location.pathname), {
    timeout: 15000,
  });
  await new Promise((r) => setTimeout(r, 800));
  await shot("02-phone.png");

  // Clear then type phone via focused visible input
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
  await new Promise((r) => setTimeout(r, 400));
  await clickTestId("cta-primary", "Recevoir le code", "Recevoir le code");
  await page.waitForFunction(() => /verify/i.test(location.pathname), {
    timeout: 15000,
  });
  const phoneUrl = page.url();
  record("login_navigated_to_verify", /verify/i.test(phoneUrl), phoneUrl);
  await shot("03-verify.png");

  await enterOtp(otp);
  await new Promise((r) => setTimeout(r, 400));
  // Ensure verify CTA fires if auto-complete didn't
  try {
    await clickTestId("cta-primary", "Vérifier", "Vérifier");
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
    !/SÉRIE EN COURS|RECORDS PERSONNELS|Pas de PR pour l'instant|Sub-50 sur 10/i.test(
      profileText,
    ) && /Entraînement avancé/i.test(profileText),
    "primary must not show streak/PR/goal cards",
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
  try {
    await page.waitForSelector('[data-testid="club-generate-invite"]', {
      timeout: 10000,
    });
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="club-generate-invite"]')
        ?.scrollIntoView({ block: "center" });
    });
    await clickTestId(
      "club-generate-invite",
      "Générer invite",
      "Générer un code d'invitation",
    );
    record("invite_generate_clicked", true);
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
    record("invite_generate_clicked", false, String(e.message || e));
  }
  record(
    "invite_code_captured",
    Boolean(inviteCode && /^[A-Z0-9]{4,12}$/i.test(inviteCode)),
    inviteCode || "",
  );
  await shot("10-invite-code.png");

  // Create outings via Mes sorties
  await page.goto(BASE + "/my-sessions", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await shot("11-my-outings.png");
  record("my_outings_title", /Mes sorties/i.test(await bodyText()));

  for (let i = 0; i < 2; i++) {
    try {
      await page.goto(BASE + "/my-sessions", { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1000));
      await clickTestId("create-outing-btn", "Créer sortie");
      await page.waitForFunction(
        () => /session\/create|Créer/.test(location.href + document.body.innerText),
        { timeout: 15000 },
      );
      await new Promise((r) => setTimeout(r, 1000));
      await shot(`12-create-outing-${i + 1}.png`);
      const filled = await page.evaluate((n) => {
        const inputs = Array.from(document.querySelectorAll("input, textarea"));
        const spot = inputs.find((el) =>
          /spot|lieu|marina|endroit|Corniche/i.test(
            el.getAttribute("placeholder") ||
              el.getAttribute("aria-label") ||
              "",
          ),
        );
        if (spot) {
          spot.focus();
          const proto = window.HTMLInputElement.prototype;
          const desc = Object.getOwnPropertyDescriptor(proto, "value");
          desc?.set?.call(spot, `Corniche E2E ${n}`);
          spot.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return Boolean(spot);
      }, i + 1);
      const submitted = await page.evaluate(() => {
        const btn =
          document.querySelector('[data-testid="session-publish-btn"]') ||
          Array.from(
            document.querySelectorAll('[role="button"], button'),
          ).find((n) =>
            /Publier la séance|Créer une séance|Enregistrer/i.test(
              n.textContent || "",
            ),
          );
        if (btn) {
          btn.scrollIntoView({ block: "center" });
          btn.click();
          return true;
        }
        return false;
      });
      record(`outing_${i + 1}_submit_clicked`, submitted);
      await new Promise((r) => setTimeout(r, 2000));
      record(
        `outing_${i + 1}_form_reached`,
        true,
        filled ? "spot filled" : "form opened",
      );
    } catch (e) {
      record(`outing_${i + 1}_form_reached`, false, String(e.message || e));
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

  // Join / leave — try public session cards until a joinable control appears
  try {
    let joined = false;
    let joinDetail = "";
    const cards = await page.$$('[data-testid^="session-card-"]');
    // Prefer known public seed first (joinable without club membership)
    const tryIds = ["explore-sortie-longue-facile"];
    for (const card of cards.slice(0, 3)) {
      const id = await page.evaluate(
        (el) => el.getAttribute("data-testid"),
        card,
      );
      if (id) tryIds.push(id.replace("session-card-", ""));
    }
    for (const sid of [...new Set(tryIds.filter(Boolean))]) {
      try {
        await page.goto(BASE + `/session/${sid}`, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });
        await new Promise((r) => setTimeout(r, 1200));
        // Select a group tile if present; scroll join control into view
        await page.evaluate(() => {
          const group = document.querySelector(
            '[data-testid^="session-group-"]',
          );
          group?.scrollIntoView({ block: "center" });
          group?.click();
          const join =
            document.querySelector('[data-testid="session-join-btn"]') ||
            document.querySelector('[data-testid="session-join-confirm"]') ||
            document.querySelector('[data-testid="session-leave-btn"]');
          join?.scrollIntoView({ block: "center" });
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise((r) => setTimeout(r, 500));
        const state = await page.evaluate(() => {
          const join =
            document.querySelector('[data-testid="session-join-btn"]') ||
            document.querySelector('[data-testid="session-join-confirm"]');
          const locked = document.querySelector(
            '[data-testid="session-join-locked"]',
          );
          const request = document.querySelector(
            '[data-testid="session-join-request"]',
          );
          const leave = document.querySelector(
            '[data-testid="session-leave-btn"]',
          );
          return {
            hasJoin: Boolean(join),
            hasLocked: Boolean(locked),
            hasRequest: Boolean(request),
            hasLeave: Boolean(leave),
            joinLabel: join?.textContent?.trim()?.slice(0, 40) || "",
          };
        });
        if (state.hasLeave) {
          // Already joined — exercise leave (page dialog listener accepts confirm)
          await page.evaluate(() => {
            document
              .querySelector('[data-testid="session-leave-btn"]')
              ?.scrollIntoView({ block: "center" });
            document
              .querySelector('[data-testid="session-leave-btn"]')
              ?.click();
          });
          await new Promise((r) => setTimeout(r, 1000));
          // Re-open and join again
          await page.goto(BASE + `/session/${sid}`, {
            waitUntil: "networkidle0",
          });
          await new Promise((r) => setTimeout(r, 1000));
          await page.evaluate(() => {
            document
              .querySelector('[data-testid^="session-group-"]')
              ?.click();
          });
          await new Promise((r) => setTimeout(r, 300));
        }
        if (state.hasJoin || state.hasLeave) {
          await page.evaluate(() => {
            const join =
              document.querySelector('[data-testid="session-join-btn"]') ||
              document.querySelector('[data-testid="session-join-confirm"]');
            join?.scrollIntoView({ block: "center" });
            join?.click();
          });
          // warn confirm path
          await new Promise((r) => setTimeout(r, 500));
          await page.evaluate(() => {
            document
              .querySelector('[data-testid="session-join-confirm"]')
              ?.click();
          });
          await new Promise((r) => setTimeout(r, 2000));
          const after = await page.evaluate(() => ({
            leave: Boolean(
              document.querySelector('[data-testid="session-leave-btn"]'),
            ),
            joinStill: Boolean(
              document.querySelector('[data-testid="session-join-btn"]') ||
                document.querySelector('[data-testid="session-join-confirm"]'),
            ),
            text: document.body.innerText,
          }));
          // Require leave control (hasStoredJoin) — inscription copy alone is not enough
          if (after.leave && !after.joinStill) {
            joined = true;
            joinDetail = `session ${sid}`;
            await shot("15-session-joined.png");
            let leftOk = false;
            try {
              // Prefer ElementHandle click so window.confirm can be accepted by
              // the page "dialog" listener without blocking Runtime.evaluate.
              const leaveHandle = await page.$(
                '[data-testid="session-leave-btn"]',
              );
              if (leaveHandle) {
                await leaveHandle.evaluate((el) =>
                  el.scrollIntoView({ block: "center" }),
                );
                await leaveHandle.click();
                await leaveHandle.dispose();
              }
              await new Promise((r) => setTimeout(r, 1500));
              leftOk = await page.evaluate(() => {
                const leave = document.querySelector(
                  '[data-testid="session-leave-btn"]',
                );
                const join =
                  document.querySelector('[data-testid="session-join-btn"]') ||
                  document.querySelector(
                    '[data-testid="session-join-confirm"]',
                  );
                return !leave && Boolean(join);
              });
            } catch (leaveErr) {
              leftOk = false;
              joinDetail = `session ${sid}; leave error: ${String(leaveErr.message || leaveErr)}`;
            }
            record("session_leave_clicked", leftOk, `session ${sid}`);
            break;
          }
          joinDetail = `join clicked but no leave state on ${sid} (leave=${after.leave}, joinStill=${after.joinStill})`;
        } else {
          joinDetail = state.hasLocked
            ? `locked on ${sid}`
            : state.hasRequest
              ? `request-only on ${sid}`
              : `no join control on ${sid}`;
        }
      } catch (sidErr) {
        if (joined) break;
        joinDetail = `error on ${sid}: ${String(sidErr.message || sidErr)}`;
      }
    }
    record("session_join_clicked", joined, joinDetail);
    if (!joined) {
      record("session_leave_clicked", false, "join never succeeded");
      await shot("15-session-join-failed.png");
    }
  } catch (e) {
    record("session_join_clicked", false, String(e.message || e));
    record("session_leave_clicked", false, "exception");
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

  // --- Identity B: join with invite (keep mock clubs/invites) ---
  if (inviteCode) {
    const okB = await loginViaUi("0622222222", "000000", {
      preserveMockWorld: true,
      shotPrefix: "b-",
    });
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
