/**
 * dl-portfolio-v4.mjs
 *
 * Uses Puppeteer (visible Chrome + stealth) to screenshot ONLY the
 * still-broken portfolio images (<=10 KB).  One page at a time, with
 * generous timeouts.
 *
 * Usage:  node scripts/dl-portfolio-v4.mjs
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteerExtra.use(StealthPlugin());

const outDir = path.resolve("public/images/projects/portfolio");

/* ── Every slug mapped to a simple, bot-friendly site ── */
const projects = [
  { name: "alpine-lodges",     url: "https://www.airbnb.com" },
  { name: "apex-energy",       url: "https://www.shell.com" },
  { name: "atelier-blanc",     url: "https://www.zara.com" },
  { name: "atlas-geography",   url: "https://www.mapbox.com" },
  { name: "atlas-logistics",   url: "https://www.ups.com" },
  { name: "aurora-resorts",    url: "https://www.hilton.com" },
  { name: "bloom-fertility",   url: "https://www.plannedparenthood.org" },
  { name: "bridge-ventures",   url: "https://www.ycombinator.com" },
  { name: "cipher-security",   url: "https://www.norton.com" },
  { name: "coastal-living",    url: "https://www.realtor.com" },
  { name: "compass-cruises",   url: "https://www.carnival.com" },
  { name: "crust-bakery",      url: "https://www.kingarthurbaking.com" },
  { name: "echoai-assistant",  url: "https://www.drift.com" },
  { name: "ember-safari",      url: "https://www.tripadvisor.com" },
  { name: "ember-steakhouse",  url: "https://www.opentable.com" },
  { name: "flowdesk-crm",      url: "https://www.salesforce.com" },
  { name: "frame-motion",      url: "https://dribbble.com" },
  { name: "kinetic-physio",    url: "https://www.nike.com/training" },
  { name: "neuron-lab",        url: "https://openai.com" },
  { name: "noma-cocktails",    url: "https://www.liquor.com" },
  { name: "oceanic-dive",      url: "https://www.oceana.org" },
  { name: "pinnacle-towers",   url: "https://www.redfin.com" },
  { name: "pixel-forge",       url: "https://www.canva.com" },
  { name: "pulse-devops",      url: "https://github.com/features" },
  { name: "quantum-consulting", url: "https://www.deloitte.com" },
  { name: "sakana-omakase",    url: "https://www.doordash.com" },
  { name: "sakura-ryokan",     url: "https://www.agoda.com" },
  { name: "serenity-wellness", url: "https://www.calm.com" },
  { name: "soleil-eyewear",    url: "https://www.warbyparker.com" },
  { name: "sonance-music",     url: "https://open.spotify.com" },
  { name: "syncboard-pm",      url: "https://www.monday.com" },
  { name: "urban-nest",        url: "https://www.apartments.com" },
  { name: "vanguard-menswear", url: "https://www.nordstrom.com" },
  { name: "verde-kitchen",     url: "https://www.sweetgreen.com" },
  { name: "vertigo-studios",   url: "https://www.awwwards.com" },
  { name: "voxel-analytics",   url: "https://www.datastudio.google.com" },
  { name: "wanderlust-trails", url: "https://www.lonelyplanet.com" },
  { name: "zenith-law",        url: "https://www.law.com" },
];

function isBroken(name) {
  const f = path.join(outDir, `${name}.webp`);
  if (!fs.existsSync(f)) return true;
  return fs.statSync(f).size <= 10000;
}

async function main() {
  const broken = projects.filter((p) => isBroken(p.name));
  console.log(`\n${broken.length} broken images to fix\n`);
  if (!broken.length) { console.log("All good!"); return; }

  const browser = await puppeteerExtra.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900",
      "--window-position=0,0",
    ],
  });

  let ok = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const dest = path.join(outDir, `${p.name}.webp`);
    console.log(`[${i + 1}/${broken.length}] ${p.name}`);

    const page = await browser.newPage();
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      );

      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 4000));

      // Dismiss cookie/consent banners
      await page.evaluate(() => {
        const sels = [
          "#onetrust-accept-btn-handler",
          ".cc-btn.cc-dismiss",
          '[class*="cookie"] button[class*="accept"]',
          '[class*="consent"] button[class*="accept"]',
          'button[data-testid*="accept"]',
          '[aria-label*="Accept"]',
          '[aria-label*="accept"]',
          'button[class*="Accept"]',
          'button[id*="accept"]',
        ];
        for (const s of sels) {
          try { const b = document.querySelector(s); if (b) { b.click(); break; } } catch {}
        }
      }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1000));

      const buf = await page.screenshot({
        type: "webp",
        quality: 82,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      if (buf.length > 5000) {
        fs.writeFileSync(dest, buf);
        console.log(`  OK ${(buf.length / 1024).toFixed(0)} KB`);
        ok++;
      } else {
        console.log(`  TOO SMALL (${buf.length} B)`);
        failed.push(p.name);
        fail++;
      }
    } catch (err) {
      console.error(`  FAIL: ${err.message.slice(0, 80)}`);
      failed.push(p.name);
      fail++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n${ok} OK, ${fail} failed`);
  if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
}

main().catch(console.error);
