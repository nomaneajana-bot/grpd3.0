/**
 * Batch B — club → private outing + Structure/déroulé persistence (demo).
 * Does not claim hosted.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8082";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
const STRUCTURE = `B-STRUCT-${Date.now().toString(36).slice(-6)} · 12 min échauffement`;
const TITLE = `Sortie privée B ${Date.now().toString(36).slice(-5)}`;
const SPOT = `SPOT-B-${Date.now().toString(36).slice(-5).toUpperCase()}`;

const report = {
  batch: "B",
  tested_sha: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  hosted_claim: false,
  checks: [],
};

function check(id, ok, detail) {
  report.checks.push({ id, ok, detail: String(detail ?? "").slice(0, 320) });
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
    await page.keyboard.type(String(code[i]), { delay: 12 });
  }
  await page.waitForTimeout(500);
}

async function login(page) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle" });
  await clickText(page, /J'ai déjà un compte/i);
  await page.waitForURL(/phone/i, { timeout: 20000 });
  await page.getByTestId("phone-input").fill("0611111111");
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
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await login(page);

    const clubName = `BatchB Club ${Date.now().toString(36).slice(-4)}`;
    await page.goto(`${BASE}/club/create`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    await page.getByTestId("club-name-input").fill(clubName);
    await page.getByTestId("club-city-input").fill("Casablanca");
    await page.getByTestId("club-purpose-input").fill("Sorties privées Batch B");
    await page.getByTestId("club-create-submit").click({ force: true });
    await page.waitForTimeout(2500);
    check("club_created", /Clubs|membre|Quitter/i.test(await page.locator("body").innerText()), page.url());

    // Organise from club CTA when available, else deep-link with clubId from storage.
    let clubId = await page.evaluate(() => {
      try {
        return localStorage.getItem("grpd_focused_club_id_v1");
      } catch {
        return null;
      }
    });
    if (!clubId) {
      clubId = await page.evaluate(() => {
        try {
          const raw = localStorage.getItem("mock:club_memberships");
          const map = raw ? JSON.parse(raw) : {};
          const first = Object.values(map)[0];
          return first?.clubId || null;
        } catch {
          return null;
        }
      });
    }

    const organise = page.getByTestId("club-organise-outing-cta");
    if (await organise.count()) {
      await organise.click({ force: true });
      await page.waitForTimeout(1200);
    } else if (clubId) {
      await page.goto(
        `${BASE}/session/create?clubId=${encodeURIComponent(clubId)}&audience=club`,
        { waitUntil: "networkidle", timeout: 60000 },
      );
    } else {
      await page.goto(`${BASE}/session/create`, { waitUntil: "networkidle" });
      await page.getByTestId("session-audience-club").click({ force: true });
    }
    await page.waitForTimeout(900);

    const bodyCreate = await page.locator("body").innerText();
    check(
      "create_club_bound_or_audience",
      Boolean(await page.getByTestId("session-audience-club").count()) &&
        (/Réservée au club|membres confirmés|create-club-bound/i.test(bodyCreate) ||
          Boolean(await page.getByTestId("create-club-bound").count())),
      bodyCreate.slice(0, 120),
    );

    await clickText(page, /^Marche$/i);
    await page.getByTestId("session-title-input").fill(TITLE);
    await page.getByTestId("session-purpose-input").fill("Objectif Batch B privé");
    await page.getByTestId("session-structure-input").fill(STRUCTURE);

    // Spot — custom if picker available
    try {
      await page.getByTestId("session-spot-field").click({ force: true });
      await page.waitForTimeout(400);
      const custom = page.getByTestId("session-spot-custom-input");
      if (await custom.count()) {
        await custom.fill(SPOT);
        await page.getByTestId("session-spot-custom-add").click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch {
      /* default spot ok */
    }

    await page.getByTestId("session-audience-club").click({ force: true }).catch(() => {});
    await page.getByTestId("session-publish-btn").click({ force: true });
    await page.waitForTimeout(2800);

    let url = page.url();
    // Confirmation may land on published — continue to detail
    if (/published/i.test(url)) {
      const id = new URL(url).searchParams.get("id");
      check("published_confirm", Boolean(id), url);
      if (id) {
        await page.goto(`${BASE}/session/${id}`, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        await page.waitForTimeout(1200);
        url = page.url();
      }
    }

    const detail = await page.locator("body").innerText();
    const structureEl = page.getByTestId("session-structure-text");
    const structureText = (await structureEl.count())
      ? await structureEl.innerText()
      : "";
    check(
      "structure_persisted",
      structureText.includes(STRUCTURE.split(" · ")[0]) || detail.includes(STRUCTURE),
      structureText || detail.slice(0, 160),
    );
    check(
      "private_outing_reachable",
      /\/session\/[^/]+/.test(url) && !/create/i.test(url) && !/n'est pas accessible/i.test(detail),
      url,
    );
    check(
      "title_present",
      detail.includes(TITLE) || Boolean(await page.getByText(TITLE).count()),
      TITLE,
    );

    await page.screenshot({
      path: path.join(OUT, "batch-b-private-outing-detail.png"),
      fullPage: true,
    });
  } catch (e) {
    check("batch_b_uncaught", false, String(e));
    await page.screenshot({
      path: path.join(OUT, "batch-b-error.png"),
      fullPage: true,
    }).catch(() => {});
  } finally {
    const pass = report.checks.filter((c) => c.ok).length;
    const fail = report.checks.filter((c) => !c.ok).length;
    report.summary = { pass, fail };
    fs.writeFileSync(
      path.join(OUT, "batch-b-private-outing-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("SUMMARY", report.summary);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
}

main();
