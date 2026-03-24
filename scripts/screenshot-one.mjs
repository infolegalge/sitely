/**
 * screenshot-one.mjs — Takes a single screenshot.
 * Usage: node scripts/screenshot-one.mjs <slug> <url>
 * Exit codes: 0 = success, 1 = failure
 */
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const [slug, url] = process.argv.slice(2);
if (!slug || !url) { console.error("Usage: node screenshot-one.mjs <slug> <url>"); process.exit(1); }

const dest = path.resolve(`public/images/projects/portfolio/${slug}.webp`);

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Dismiss cookie banners
  await page.evaluate(() => {
    const sels = [
      "#onetrust-accept-btn-handler", ".cc-btn.cc-dismiss",
      'button[class*="accept"]', 'button[class*="Accept"]',
      'button[aria-label*="Accept"]', 'button[aria-label*="close"]',
      '[class*="cookie"] button', '[class*="consent"] button',
      '.fc-cta-consent', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    ];
    for (const s of sels) {
      try { const b = document.querySelector(s); if (b) { b.click(); break; } } catch {}
    }
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  const buf = await page.screenshot({ type: "webp", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  await browser.close();

  if (buf.length < 12000) {
    console.log(`FAIL ${slug} ${buf.length}B`);
    process.exit(1);
  }

  fs.writeFileSync(dest, buf);
  console.log(`OK ${slug} ${(buf.length / 1024).toFixed(0)}KB`);
}

run().catch(err => {
  console.log(`FAIL ${slug} ${err.message.slice(0, 80)}`);
  process.exit(1);
});
