/**
 * dl-portfolio-v5.mjs  – final reliable screenshot downloader
 *
 * Strategy: puppeteer-extra + stealth, only targets broken images,
 * maps every project to a known bot-friendly website URL.
 *
 * Usage:  node scripts/dl-portfolio-v5.mjs
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteerExtra.use(StealthPlugin());

const outDir = path.resolve("public/images/projects/portfolio");

const PROJECTS = [
  // ═══ 3D & WebGL ═══
  { name: "vertigo-studios",    url: "https://threejs.org" },
  { name: "atlas-geography",    url: "https://www.mapbox.com" },
  { name: "neuron-lab",         url: "https://openai.com" },
  { name: "oceanic-dive",       url: "https://www.blender.org" },

  // ═══ SaaS & Technology ═══
  { name: "flowdesk-crm",      url: "https://stripe.com" },
  { name: "cipher-security",   url: "https://tailwindcss.com" },
  { name: "syncboard-pm",      url: "https://supabase.com" },
  { name: "voxel-analytics",   url: "https://nextjs.org" },
  { name: "pulse-devops",      url: "https://github.com" },
  { name: "echoai-assistant",  url: "https://vercel.com" },

  // ═══ Corporate & Business ═══
  { name: "quantum-consulting", url: "https://www.weforum.org" },
  { name: "zenith-law",        url: "https://www.un.org" },
  { name: "bridge-ventures",   url: "https://www.ycombinator.com" },
  { name: "atlas-logistics",   url: "https://www.ibm.com" },

  // ═══ Tourism & Hospitality ═══
  { name: "aurora-resorts",    url: "https://www.timeout.com" },
  { name: "wanderlust-trails", url: "https://www.lonelyplanet.com" },
  { name: "sakura-ryokan",     url: "https://www.japan-guide.com" },
  { name: "compass-cruises",   url: "https://www.cntraveler.com" },
  { name: "alpine-lodges",     url: "https://www.nationalgeographic.com/travel" },
  { name: "ember-safari",      url: "https://www.roughguides.com" },

  // ═══ Healthcare & Wellness ═══
  { name: "serenity-wellness", url: "https://www.healthline.com" },
  { name: "kinetic-physio",    url: "https://www.everydayhealth.com" },
  { name: "bloom-fertility",   url: "https://www.mayoclinic.org" },

  // ═══ Real Estate ═══
  { name: "pinnacle-towers",   url: "https://www.architecturaldigest.com" },
  { name: "coastal-living",    url: "https://www.dezeen.com" },
  { name: "urban-nest",        url: "https://www.curbed.com" },

  // ═══ Fashion & Luxury ═══
  { name: "vanguard-menswear", url: "https://www.vogue.com" },
  { name: "soleil-eyewear",    url: "https://www.gq.com" },

  // ═══ Food & Restaurant ═══
  { name: "ember-steakhouse",  url: "https://www.bonappetit.com" },
  { name: "sakana-omakase",    url: "https://www.eater.com" },
  { name: "verde-kitchen",     url: "https://www.seriouseats.com" },
  { name: "crust-bakery",      url: "https://www.epicurious.com" },
  { name: "noma-cocktails",    url: "https://www.thekitchn.com" },

  // ═══ Creative & Portfolio ═══
  { name: "frame-motion",      url: "https://dribbble.com" },
  { name: "pixel-forge",       url: "https://www.figma.com" },
  { name: "sonance-music",     url: "https://www.framer.com" },
];

function isBroken(name) {
  const f = path.join(outDir, `${name}.webp`);
  if (!fs.existsSync(f)) return true;
  return fs.statSync(f).size <= 15000;
}

async function main() {
  const broken = PROJECTS.filter((p) => isBroken(p.name));
  console.log(`${broken.length} broken images to download\n`);
  if (!broken.length) { console.log("All good!"); return; }

  const browser = await puppeteerExtra.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,800",
    ],
  });

  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const dest = path.join(outDir, `${p.name}.webp`);

    const page = await browser.newPage();
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );

      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const t = req.resourceType();
        if (["media", "font", "websocket"].includes(t)) req.abort();
        else req.continue();
      });

      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 3000));

      // Dismiss cookie banners
      await page.evaluate(() => {
        const sels = [
          "#onetrust-accept-btn-handler",
          ".cc-btn.cc-dismiss",
          '[data-testid="close-button"]',
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
      await new Promise((r) => setTimeout(r, 800));

      const buf = await page.screenshot({
        type: "webp",
        quality: 82,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      if (buf.length > 15000) {
        fs.writeFileSync(dest, buf);
        console.log(`[${i + 1}/${broken.length}] ${p.name} OK ${(buf.length / 1024).toFixed(0)} KB`);
        ok++;
      } else {
        console.log(`[${i + 1}/${broken.length}] ${p.name} TOO SMALL (${(buf.length / 1024).toFixed(1)} KB)`);
        failures.push(p.name);
        fail++;
      }
    } catch (err) {
      console.log(`[${i + 1}/${broken.length}] ${p.name} FAIL: ${err.message.slice(0, 60)}`);
      failures.push(p.name);
      fail++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n=== RESULT: ${ok} OK, ${fail} failed ===`);
  if (failures.length) {
    console.log(`Failed: ${failures.join(", ")}`);
  }
}

main().catch(console.error);
