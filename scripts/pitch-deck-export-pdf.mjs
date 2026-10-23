/**
 * Export /pitch as a landscape PDF (one page per slide).
 */
import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:8085";
const OUT = "/opt/cursor/artifacts";
const TMP = path.join(OUT, "pitch-pdf-pages");
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await page.goto(`${BASE}/pitch`, { waitUntil: "networkidle", timeout: 90000 });
await page.getByTestId("pitch-deck").waitFor({ state: "visible", timeout: 45000 });
await page.waitForTimeout(800);

const pages = [];
for (let i = 0; i < 7; i++) {
  if (i > 0) {
    await page.getByTestId("pitch-next").click({ force: true });
    await page.waitForTimeout(550);
  }
  const file = path.join(TMP, `slide-${String(i + 1).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, fullPage: false });
  pages.push(file);
  console.log("PAGE", file);
}

await browser.close();

const pdfPath = path.join(OUT, "GRPD-pitch-deck.pdf");
const repoPdf = path.join("/workspace/docs", "GRPD-pitch-deck.pdf");
fs.mkdirSync("/workspace/docs", { recursive: true });

// ImageMagick: PNG pages → PDF
execSync(`convert ${pages.map((p) => `"${p}"`).join(" ")} "${pdfPath}"`, {
  stdio: "inherit",
});
fs.copyFileSync(pdfPath, repoPdf);
console.log("PDF", pdfPath);
console.log("REPO", repoPdf);
console.log("SIZE", fs.statSync(pdfPath).size);
