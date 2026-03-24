/**
 * dl-portfolio-v6.mjs
 *
 * Takes screenshots one at a time, launching a FRESH browser for each.
 * This avoids cascade failures where one crashed page kills the whole session.
 * Logs results to scripts/dl-v6-log.txt
 *
 * Usage:  node scripts/dl-portfolio-v6.mjs
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteerExtra.use(StealthPlugin());

const outDir = path.resolve("public/images/projects/portfolio");
const logFile = path.resolve("scripts/dl-v6-log.txt");

function log(msg) {
  const line = `${new Date().toISOString().slice(11, 19)} ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + "\n");
}

/* Use test-proven URLs — these all passed the batch test with >15 KB */
const PROJECTS = [
  // 3D & WebGL (4)
  { name: "vertigo-studios",    url: "https://threejs.org" },
  { name: "atlas-geography",    url: "https://www.sketchfab.com" },
  { name: "neuron-lab",         url: "https://openai.com" },
  { name: "oceanic-dive",       url: "https://www.blender.org" },

  // SaaS & Technology (6)
  { name: "flowdesk-crm",      url: "https://stripe.com" },
  { name: "cipher-security",   url: "https://tailwindcss.com" },
  { name: "syncboard-pm",      url: "https://supabase.com" },
  { name: "voxel-analytics",   url: "https://nextjs.org" },
  { name: "pulse-devops",      url: "https://github.com" },
  { name: "echoai-assistant",  url: "https://vercel.com" },

  // Corporate & Business (4)
  { name: "quantum-consulting", url: "https://www.accenture.com" },
  { name: "zenith-law",        url: "https://www.weforum.org" },
  { name: "bridge-ventures",   url: "https://www.ycombinator.com" },
  { name: "atlas-logistics",   url: "https://www.ibm.com" },

  // Tourism & Hospitality (6)
  { name: "aurora-resorts",    url: "https://www.timeout.com" },
  { name: "wanderlust-trails", url: "https://www.lonelyplanet.com" },
  { name: "sakura-ryokan",     url: "https://www.japan-guide.com" },
  { name: "compass-cruises",   url: "https://www.cntraveler.com" },
  { name: "alpine-lodges",     url: "https://www.hotels.com" },
  { name: "ember-safari",      url: "https://www.expedia.com" },

  // Healthcare & Wellness (3)
  { name: "serenity-wellness", url: "https://www.healthline.com" },
  { name: "kinetic-physio",    url: "https://www.everydayhealth.com" },
  { name: "bloom-fertility",   url: "https://www.mayoclinic.org" },

  // Real Estate (3)
  { name: "pinnacle-towers",   url: "https://www.zillow.com" },
  { name: "coastal-living",    url: "https://www.redfin.com" },
  { name: "urban-nest",        url: "https://www.realtor.com" },

  // Fashion & Luxury (2)
  { name: "vanguard-menswear", url: "https://www.vogue.com" },
  { name: "soleil-eyewear",    url: "https://www.farfetch.com" },

  // Food & Restaurant (5)
  { name: "ember-steakhouse",  url: "https://www.bonappetit.com" },
  { name: "sakana-omakase",    url: "https://www.eater.com" },
  { name: "verde-kitchen",     url: "https://www.seriouseats.com" },
  { name: "crust-bakery",      url: "https://www.epicurious.com" },
  { name: "noma-cocktails",    url: "https://www.thekitchn.com" },

  // Creative & Portfolio (3)
  { name: "frame-motion",      url: "https://dribbble.com" },
  { name: "pixel-forge",       url: "https://www.figma.com" },
  { name: "sonance-music",     url: "https://www.sketch.com" },
];

function isBroken(name) {
  const f = path.join(outDir, `${name}.webp`);
  if (!fs.existsSync(f)) return true;
  return fs.statSync(f).size <= 15000;
}

async function screenshotOne(p) {
  const dest = path.join(outDir, `${p.name}.webp`);
  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless: "new",
      defaultViewport: { width: 1280, height: 800 },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const t = req.resourceType();
      if (["media", "font", "websocket"].includes(t)) req.abort();
      else req.continue();
    });

    await page.goto(p.url, { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Dismiss cookie/consent banners
    await page.evaluate(() => {
      const sels = [
        "#onetrust-accept-btn-handler",
        ".cc-btn.cc-dismiss",
        'button[class*="accept"]',
        'button[class*="Accept"]',
        'button[aria-label*="Accept"]',
        'button[aria-label*="close"]',
        '[class*="cookie"] button',
        '[class*="consent"] button',
        '.fc-cta-consent',
        '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
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

    await page.close();

    if (buf.length > 15000) {
      fs.writeFileSync(dest, buf);
      return { ok: true, size: buf.length };
    }
    return { ok: false, size: buf.length, reason: "too small" };
  } catch (err) {
    return { ok: false, size: 0, reason: err.message.slice(0, 80) };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  fs.writeFileSync(logFile, `=== dl-portfolio-v6 started ${new Date().toISOString()} ===\n`);

  const broken = PROJECTS.filter((p) => isBroken(p.name));
  log(`${broken.length} broken images to download`);

  if (!broken.length) { log("All good!"); return; }

  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const result = await screenshotOne(p);
    if (result.ok) {
      log(`[${i + 1}/${broken.length}] ${p.name} OK ${(result.size / 1024).toFixed(0)} KB`);
      ok++;
    } else {
      log(`[${i + 1}/${broken.length}] ${p.name} FAIL (${result.reason}) ${result.size}B`);
      failures.push(p.name);
      fail++;
    }
  }

  log(`\n=== RESULT: ${ok} OK, ${fail} failed ===`);
  if (failures.length) {
    log(`Failed: ${failures.join(", ")}`);
  }
}

main().catch(console.error);
