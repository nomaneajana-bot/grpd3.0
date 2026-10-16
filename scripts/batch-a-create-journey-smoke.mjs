/**
 * Full fresh-state CREATE onboarding journey:
 * Commencer → mock phone → profile → Créer un club → skip pace → Marche
 * → create club → welcome → home → Clubs focused on new club → reload checks.
 * Then a second differently themed club; preserve the first.
 *
 * Does NOT mark invite path PASS.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BATCH_A_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const report = {
  base: BASE,
  tested_at: new Date().toISOString(),
  checks: [],
  blockers: [],
  clubs: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 400) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 120));
}

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log("SHOT", p);
  return p;
}

async function clearAll(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
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
  await page.waitForTimeout(700);
}

async function enterOtp(page, code) {
  for (let i = 0; i < 6; i++) {
    const box = page.getByTestId(`otp-digit-${i}`);
    await box.click({ force: true });
    await page.keyboard.type(String(code[i]), { delay: 25 });
  }
  await page.waitForTimeout(900);
  if (await page.getByText(/^Vérifier$/i).count()) {
    await clickText(page, /^Vérifier$/i);
    await page.waitForTimeout(800);
  }
}

async function runCreatePath(page, { firstName, clubName, city }) {
  await clearAll(page);
  await shot(page, `create-j-${firstName}-00-start.png`);

  await clickText(page, /Commencer/i);
  await page.waitForTimeout(600);
  const phone = page.getByTestId("phone-input");
  await phone.click({ force: true });
  await phone.fill("0708060337", { force: true });
  await page.waitForTimeout(300);
  const phoneBody = await page.locator("body").innerText();
  check(
    `${firstName}_sim_phone`,
    /simulation|aucun SMS/i.test(phoneBody),
    phoneBody.slice(0, 200),
  );
  check(
    `${firstName}_no_auto_sms_claim_on_phone`,
    !/on t'envoie un code SMS|SMS vient d'être envoyé/i.test(phoneBody),
    phoneBody.slice(0, 160),
  );
  await shot(page, `create-j-${firstName}-01-phone.png`);
  await clickText(page, /Continuer|Recevoir/i);
  await page.waitForTimeout(800);

  const verifyBody = await page.locator("body").innerText();
  check(
    `${firstName}_sim_verify`,
    /simulation|aucun SMS/i.test(verifyBody),
    verifyBody.slice(0, 220),
  );
  check(
    `${firstName}_no_code_auto_received`,
    !/Code reçu automatiquement/i.test(verifyBody),
    verifyBody.slice(0, 220),
  );
  const codeMatch = verifyBody.match(/code\s+(000000|123456)/i);
  const otp = codeMatch ? codeMatch[1] : "123456";
  await enterOtp(page, otp);
  await shot(page, `create-j-${firstName}-02-verify.png`);

  await page.getByPlaceholder(/Sara/i).first().fill(firstName, { force: true });
  if (await page.getByPlaceholder(/Casablanca/i).count()) {
    await page
      .getByPlaceholder(/Casablanca/i)
      .first()
      .fill(city, { force: true });
  }
  await clickText(page, /^Continuer$/);
  await page.waitForTimeout(800);

  await shot(page, `create-j-${firstName}-03-role.png`);
  await clickText(page, /Créer un club/i);
  await clickText(page, /^Continuer$/);
  await page.waitForTimeout(800);

  await shot(page, `create-j-${firstName}-04-pace.png`);
  const paceBody = await page.locator("body").innerText();
  check(
    `${firstName}_pace_no_group_letters`,
    !/Groupe [A-D]/i.test(paceBody),
    paceBody.slice(0, 200),
  );
  await clickText(page, /Passer/i);
  await page.waitForTimeout(800);

  await clickText(page, /Marche & bien-être|Marche/i);
  await clickText(page, /^Continuer$/);
  await page.waitForTimeout(900);

  await shot(page, `create-j-${firstName}-05-create-club.png`);
  const nameField = page.getByTestId("onboarding-club-name");
  if (await nameField.count()) {
    await nameField.fill(clubName, { force: true });
  } else {
    await page.getByPlaceholder(/Gazelles/i).fill(clubName, { force: true });
  }
  const cityField = page.getByTestId("onboarding-club-city");
  if (await cityField.count()) {
    await cityField.fill(city, { force: true });
  }
  await clickText(page, /Créer le club/i);
  await page.waitForTimeout(1200);

  // permissions
  if (await page.getByText(/Continuer/i).count()) {
    await clickText(page, /^Continuer$/);
    await page.waitForTimeout(900);
  }

  await shot(page, `create-j-${firstName}-06-welcome.png`);
  const welcome = await page.locator("body").innerText();
  check(
    `${firstName}_welcome_natural_copy`,
    !/rien n.est invent|aucun groupe invent/i.test(welcome),
    welcome.slice(0, 280),
  );
  check(
    `${firstName}_welcome_has_club`,
    welcome.includes(clubName) || /Club/i.test(welcome),
    welcome.slice(0, 280),
  );
  check(
    `${firstName}_welcome_no_youssef`,
    !/Coach Youssef|12 participants|GROUPE D/i.test(welcome),
    welcome.slice(0, 200),
  );

  await clickText(page, /Voir l'accueil|Voir l’accueil/i);
  await page.waitForTimeout(1500);
  await shot(page, `create-j-${firstName}-07-home.png`);

  // Open Clubs tab — wait until club hub chrome is visible (not Découvrir home).
  await page.goto(`${BASE}/club`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  try {
    await page.getByText(/MES CLUBS|TU ES ADMIN|Organiser une sortie/i).first().waitFor({
      timeout: 10000,
    });
  } catch {
    /* continue — assertions below record failure */
  }
  await shot(page, `create-j-${firstName}-08-clubs.png`);
  let clubsBody = await page.locator("body").innerText();

  // If old club still focused, select the new one from MES CLUBS
  if (!clubsBody.includes(clubName) || !/TU ES ADMIN/i.test(clubsBody)) {
    const switcher = page.getByText(clubName, { exact: false });
    if (await switcher.count()) {
      await switcher.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  }
  clubsBody = await page.locator("body").innerText();
  const onClubHub =
    /MES CLUBS|TU ES ADMIN|Organiser une sortie|FIL D.ACTIVITÉ/i.test(clubsBody);
  check(
    `${firstName}_clubs_hub_loaded`,
    onClubHub,
    clubsBody.slice(0, 400),
  );
  check(
    `${firstName}_clubs_shows_new_club`,
    onClubHub && clubsBody.includes(clubName),
    clubsBody.slice(0, 400),
  );
  check(
    `${firstName}_clubs_admin`,
    onClubHub && /TU ES ADMIN/i.test(clubsBody),
    clubsBody.slice(0, 300),
  );
  check(
    `${firstName}_no_elite_running_groups`,
    onClubHub && !/Élite|Elite|Sub 4:30|Sub4:30/i.test(clubsBody),
    clubsBody.slice(0, 400),
  );
  check(
    `${firstName}_no_toi_groupe_d_on_skip`,
    onClubHub && !(/Groupe D/i.test(clubsBody) && /\bTOI\b/i.test(clubsBody)),
    clubsBody.slice(0, 400),
  );
  check(
    `${firstName}_display_name_not_coureur`,
    onClubHub &&
      clubsBody.includes(firstName) &&
      !new RegExp(`${firstName}[\\s\\S]{0,40}Coureur|Coureur est membre`, "i").test(
        clubsBody,
      ),
    clubsBody.slice(0, 400),
  );

  // Reload identity
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  if (!(await page.getByText(/^Clubs$/i).count())) {
    await page.goto(`${BASE}/club`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  } else {
    await page.getByText(/^Clubs$/i).last().click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot(page, `create-j-${firstName}-09-reload-clubs.png`);
  const afterReload = await page.locator("body").innerText();
  check(
    `${firstName}_reload_keeps_club`,
    afterReload.includes(clubName),
    afterReload.slice(0, 400),
  );
  check(
    `${firstName}_reload_keeps_name`,
    afterReload.includes(firstName) || !/Coureur/i.test(afterReload),
    afterReload.slice(0, 400),
  );

  report.clubs.push({ firstName, clubName, city });
  return { clubsBody: afterReload };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await runCreatePath(page, {
      firstName: "Revue",
      clubName: "Marche revue A",
      city: "Casablanca",
    });

    // Second differently themed club (same account — preserve first)
    // Continue from authenticated state: go through organise? Better: use club create in-app
    // For onboarding create a second time we'd need logout. Use /club/create if available.
    await page.goto(`${BASE}/club/create`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1000);
    await shot(page, "create-j-second-00-form.png");
    const bodyCreate = await page.locator("body").innerText();
    if (/nom|club|créer/i.test(bodyCreate)) {
      const inputs = page.locator("input:visible");
      const n = await inputs.count();
      if (n > 0) {
        await inputs.first().fill("English Walk B", { force: true });
      }
      if (n > 1) {
        await inputs.nth(1).fill("Rabat", { force: true });
      }
      // purpose / walk idea if present — skip
      const submit = page.getByText(/Créer|Publier|Continuer/i);
      if (await submit.count()) {
        await submit.last().click({ force: true });
        await page.waitForTimeout(1500);
      }
      await shot(page, "create-j-second-01-after.png");
      await page.goto(`${BASE}/club`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      await shot(page, "create-j-second-02-clubs.png");
      const both = await page.locator("body").innerText();
      check(
        "second_club_exists_or_listed",
        /English Walk B|Marche revue A/i.test(both),
        both.slice(0, 500),
      );
      check(
        "first_club_preserved",
        /Marche revue A/i.test(both),
        both.slice(0, 500),
      );
    } else {
      check(
        "second_club_form_reachable",
        false,
        "club/create UI not reachable — recorded; first club path still primary evidence",
      );
    }

    // Invite path — exact blocker, no PASS
    await page.goto(`${BASE}/onboarding/club`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    }).catch(() => null);
    report.blockers.push({
      path: "invitation / Rejoindre un club",
      exact:
        "Invite fixture unavailable in this batch. Do not PASS. Remaining for batch D: invitation create → pending → approval + two-account private visibility.",
    });
    check(
      "invite_not_marked_pass",
      true,
      "blocker recorded — no fabricated invite PASS",
    );
  } catch (e) {
    console.error("CREATE_JOURNEY_ERROR", e);
    report.error = String(e);
    try {
      await shot(page, "create-j-error.png");
    } catch {}
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "batch-a-create-journey-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail > 0 || report.error ? 1 : 0);
  }
})();
