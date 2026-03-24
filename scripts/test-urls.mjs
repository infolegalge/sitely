/**
 * Quick puppeteer diagnostic - test different settings on a single URL.
 */
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

puppeteerExtra.use(StealthPlugin());

const testUrls = [
  "https://www.awwwards.com",
  "https://dribbble.com",
  "https://www.behance.net",
  "https://github.com",
  "https://www.wikipedia.org",
  "https://stripe.com",
  "https://linear.app",
  "https://www.lonelyplanet.com",
];

async function main() {
  const browser = await puppeteerExtra.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  for (const url of testUrls) {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
      await new Promise(r => setTimeout(r, 3000));
      const buf = await page.screenshot({ type: "webp", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      const kb = (buf.length / 1024).toFixed(1);
      const status = buf.length > 15000 ? "GOOD" : "BAD";
      console.log(`${status}  ${kb} KB  ${url}`);
    } catch (e) {
      console.log(`FAIL        ${url}  ${e.message.slice(0, 60)}`);
    }
    await page.close();
  }
  await browser.close();
}

main();
