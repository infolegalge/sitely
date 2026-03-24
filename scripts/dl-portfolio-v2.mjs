/**
 * Re-download failed portfolio screenshots using Puppeteer + Stealth.
 *
 * - Uses puppeteer-extra-plugin-stealth to bypass anti-bot detection
 * - Replaces URLs that are known to block headless browsers
 * - Only processes images <= 10 KB (broken ones)
 *
 * Usage:  node scripts/dl-portfolio-v2.mjs
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteerExtra.use(StealthPlugin());

const outDir = path.resolve("public/images/projects/portfolio");

/* ── Map project slug → reliable URL (replaced blocked sites) ── */
const projects = [
  /* ═══ E-COMMERCE (8) ═══ */
  { name: "velour-beauty",      url: "https://www.glossier.com" },
  { name: "nordik-outdoor",     url: "https://www.rei.com" },
  { name: "luminary-watches",   url: "https://www.tissotshop.com" },
  { name: "botanica-market",    url: "https://www.bloomandwild.com" },
  { name: "revolta-motors",     url: "https://www.polestar.com" },
  { name: "aether-audio",       url: "https://www.sonos.com" },
  { name: "casa-ceramica",      url: "https://www.etsy.com" },
  { name: "apex-supplements",   url: "https://www.myprotein.com" },

  /* ═══ 3D & WebGL (6) ═══ */
  { name: "stellar-space",      url: "https://www.spacex.com" },
  { name: "vertigo-studios",    url: "https://www.awwwards.com" },
  { name: "atlas-geography",    url: "https://www.mapbox.com" },
  { name: "neuron-lab",         url: "https://openai.com" },
  { name: "oceanic-dive",       url: "https://www.nationalgeographic.com" },
  { name: "prism-architecture", url: "https://www.archdaily.com" },

  /* ═══ SaaS & TECHNOLOGY (6) ═══ */
  { name: "flowdesk-crm",      url: "https://www.hubspot.com" },
  { name: "cipher-security",   url: "https://www.cloudflare.com" },
  { name: "syncboard-pm",      url: "https://www.notion.so" },
  { name: "voxel-analytics",   url: "https://www.tableau.com" },
  { name: "pulse-devops",      url: "https://github.com" },
  { name: "echoai-assistant",  url: "https://www.intercom.com" },

  /* ═══ CORPORATE & BUSINESS (6) ═══ */
  { name: "meridian-capital",   url: "https://www.jpmorgan.com" },
  { name: "quantum-consulting", url: "https://www.bcg.com" },
  { name: "zenith-law",        url: "https://www.bakermckenzie.com" },
  { name: "bridge-ventures",   url: "https://www.ycombinator.com" },
  { name: "atlas-logistics",   url: "https://www.fedex.com" },
  { name: "apex-energy",       url: "https://www.tesla.com/energy" },

  /* ═══ TOURISM & HOSPITALITY (6) ═══ */
  { name: "aurora-resorts",    url: "https://www.marriott.com" },
  { name: "wanderlust-trails", url: "https://www.lonelyplanet.com" },
  { name: "sakura-ryokan",     url: "https://www.booking.com" },
  { name: "compass-cruises",   url: "https://www.royalcaribbean.com" },
  { name: "alpine-lodges",     url: "https://www.airbnb.com" },
  { name: "ember-safari",      url: "https://www.tripadvisor.com" },

  /* ═══ HEALTHCARE & WELLNESS (5) ═══ */
  { name: "vitalis-clinic",    url: "https://www.mayoclinic.org" },
  { name: "serenity-wellness", url: "https://www.calm.com" },
  { name: "mindflow-therapy",  url: "https://www.headspace.com" },
  { name: "kinetic-physio",    url: "https://www.peloton.com" },
  { name: "bloom-fertility",   url: "https://www.webmd.com" },

  /* ═══ REAL ESTATE (5) ═══ */
  { name: "skyline-properties", url: "https://www.realtor.com" },
  { name: "haven-homes",       url: "https://www.compass.com" },
  { name: "pinnacle-towers",   url: "https://www.redfin.com" },
  { name: "coastal-living",    url: "https://www.zillow.com" },
  { name: "urban-nest",        url: "https://www.apartments.com" },

  /* ═══ FASHION & LUXURY (5) ═══ */
  { name: "maison-noir",       url: "https://www.gucci.com" },
  { name: "esse-jewelry",      url: "https://www.tiffany.com" },
  { name: "atelier-blanc",     url: "https://www.dior.com" },
  { name: "vanguard-menswear", url: "https://www.hugoboss.com" },
  { name: "soleil-eyewear",    url: "https://www.ray-ban.com" },

  /* ═══ FOOD & RESTAURANT (5) ═══ */
  { name: "ember-steakhouse",  url: "https://www.opentable.com" },
  { name: "sakana-omakase",    url: "https://www.yelp.com" },
  { name: "verde-kitchen",     url: "https://www.sweetgreen.com" },
  { name: "crust-bakery",      url: "https://www.kingarthurbaking.com" },
  { name: "noma-cocktails",    url: "https://www.diffordsguide.com" },

  /* ═══ CREATIVE & PORTFOLIO (5) ═══ */
  { name: "parallax-studio",   url: "https://www.behance.net" },
  { name: "mono-type",         url: "https://www.pentagram.com" },
  { name: "frame-motion",      url: "https://dribbble.com" },
  { name: "pixel-forge",       url: "https://www.figma.com" },
  { name: "sonance-music",     url: "https://www.spotify.com" },
];

/* ── identify broken images ── */
function getBrokenProjects() {
  const broken = [];
  for (const p of projects) {
    const webp = path.join(outDir, `${p.name}.webp`);
    if (!fs.existsSync(webp)) {
      broken.push(p);
      continue;
    }
    const size = fs.statSync(webp).size;
    if (size <= 10000) {
      broken.push(p);
    }
  }
  return broken;
}

async function main() {
  const broken = getBrokenProjects();
  console.log(`\nFound ${broken.length} broken/missing images to re-download\n`);

  if (broken.length === 0) {
    console.log("All images look good!");
    return;
  }

  console.log("Launching Puppeteer with stealth...");
  const browser = await puppeteerExtra.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,800",
    ],
  });

  let success = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const dest = path.join(outDir, `${p.name}.webp`);
    console.log(`[${i + 1}/${broken.length}] ${p.name} <- ${p.url}`);

    const page = await browser.newPage();

    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Block heavy resources
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const type = req.resourceType();
        if (["media", "font"].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(p.url, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });

      // Wait for images & content to render
      await new Promise((r) => setTimeout(r, 3000));

      // Try to dismiss cookie/consent banners
      try {
        await page.evaluate(() => {
          const sels = [
            '[class*="cookie"] button',
            '[class*="consent"] button',
            '[id*="cookie"] button',
            'button[class*="accept"]',
            'button[class*="Accept"]',
            '[aria-label*="accept"]',
            '[aria-label*="Accept"]',
            '[data-testid*="accept"]',
            '[class*="Banner"] button',
            '#onetrust-accept-btn-handler',
            '.cc-btn.cc-dismiss',
          ];
          for (const sel of sels) {
            const btn = document.querySelector(sel);
            if (btn) { btn.click(); break; }
          }
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch { /* ignore */ }

      const buf = await page.screenshot({
        type: "webp",
        quality: 82,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      if (buf.length < 5000) {
        console.log(`  SKIPPED (too small: ${buf.length} bytes)`);
        failures.push(p.name);
        failed++;
      } else {
        fs.writeFileSync(dest, buf);
        console.log(`  OK  ${(buf.length / 1024).toFixed(0)} KB`);
        success++;
      }
    } catch (err) {
      console.error(`  FAILED: ${err.message.substring(0, 80)}`);
      failures.push(p.name);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\nDone! ${success} succeeded, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\nFailed projects: ${failures.join(", ")}`);
  }
}

main().catch(console.error);
