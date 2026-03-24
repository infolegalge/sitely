/**
 * Re-download failed portfolio screenshots using Puppeteer.
 * Only targets files that are exactly 6040 bytes (thum.io failures).
 *
 * Usage:  node scripts/dl-portfolio-puppeteer.mjs
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const outDir = path.resolve("public/images/projects/portfolio");

/* ── Same mapping from the original script ── */
const projects = [
  { name: "velour-beauty",      url: "https://www.rarebeauty.com" },
  { name: "nordik-outdoor",     url: "https://www.hfresco.com" },
  { name: "luminary-watches",   url: "https://www.danielwellington.com" },
  { name: "botanica-market",    url: "https://www.thesill.com" },
  { name: "revolta-motors",     url: "https://www.polestar.com" },
  { name: "aether-audio",       url: "https://www.beoplay.com" },
  { name: "casa-ceramica",      url: "https://www.heathceramics.com" },
  { name: "apex-supplements",   url: "https://www.ritual.com" },
  { name: "stellar-space",      url: "https://www.spacex.com" },
  { name: "vertigo-studios",    url: "https://www.resn.co.nz" },
  { name: "atlas-geography",    url: "https://earth.google.com" },
  { name: "neuron-lab",         url: "https://www.brainly.com" },
  { name: "oceanic-dive",       url: "https://www.oceanconservancy.org" },
  { name: "prism-architecture", url: "https://www.zaha-hadid.com" },
  { name: "flowdesk-crm",      url: "https://www.attio.com" },
  { name: "cipher-security",   url: "https://www.1password.com" },
  { name: "syncboard-pm",      url: "https://linear.app" },
  { name: "voxel-analytics",   url: "https://www.mixpanel.com" },
  { name: "pulse-devops",      url: "https://vercel.com" },
  { name: "echoai-assistant",  url: "https://www.jasper.ai" },
  { name: "meridian-capital",  url: "https://www.goldmansachs.com" },
  { name: "quantum-consulting",url: "https://www.mckinsey.com" },
  { name: "zenith-law",        url: "https://www.cliffordchance.com" },
  { name: "bridge-ventures",   url: "https://a16z.com" },
  { name: "atlas-logistics",   url: "https://www.flexport.com" },
  { name: "apex-energy",       url: "https://www.nexttracker.com" },
  { name: "aurora-resorts",    url: "https://www.aman.com" },
  { name: "wanderlust-trails", url: "https://www.alltrails.com" },
  { name: "sakura-ryokan",     url: "https://www.hoshinoresorts.com" },
  { name: "compass-cruises",   url: "https://www.explora-journeys.com" },
  { name: "alpine-lodges",     url: "https://www.the-chedi-andermatt.com" },
  { name: "ember-safari",      url: "https://www.andbeyond.com" },
  { name: "vitalis-clinic",    url: "https://www.onemedical.com" },
  { name: "serenity-wellness", url: "https://www.calm.com" },
  { name: "mindflow-therapy",  url: "https://www.headspace.com" },
  { name: "kinetic-physio",    url: "https://www.sword.health" },
  { name: "bloom-fertility",   url: "https://www.kindbody.com" },
  { name: "skyline-properties",url: "https://www.sothebysrealty.com" },
  { name: "haven-homes",       url: "https://www.compass.com" },
  { name: "pinnacle-towers",   url: "https://www.skyscrapercity.com" },
  { name: "coastal-living",    url: "https://www.zillow.com" },
  { name: "urban-nest",        url: "https://www.trulia.com" },
  { name: "maison-noir",       url: "https://www.ysl.com" },
  { name: "esse-jewelry",      url: "https://www.mejuri.com" },
  { name: "atelier-blanc",     url: "https://www.celine.com" },
  { name: "vanguard-menswear", url: "https://www.mrporter.com" },
  { name: "soleil-eyewear",    url: "https://www.oliverpeoples.com" },
  { name: "ember-steakhouse",  url: "https://www.nobu.com" },
  { name: "sakana-omakase",    url: "https://www.sushisamba.com" },
  { name: "verde-kitchen",     url: "https://www.sweetgreen.com" },
  { name: "crust-bakery",      url: "https://www.dominiqueansel.com" },
  { name: "noma-cocktails",    url: "https://www.deathandco.com" },
  { name: "parallax-studio",   url: "https://www.basicagency.com" },
  { name: "mono-type",         url: "https://www.pentagram.com" },
  { name: "frame-motion",      url: "https://www.buck.co" },
  { name: "pixel-forge",       url: "https://www.ueno.co" },
  { name: "sonance-music",     url: "https://www.spotify.design" },
];

/* ── identify broken images (6040 bytes = thum.io placeholder) ── */
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
  console.log(`\n Found ${broken.length} broken/missing images to re-download\n`);

  if (broken.length === 0) {
    console.log("All images look good!");
    return;
  }

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const dest = path.join(outDir, `${p.name}.webp`);
    console.log(`[${i + 1}/${broken.length}] ${p.name} <- ${p.url}`);

    const page = await browser.newPage();

    try {
      // Block heavy resources for faster loading
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
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait a bit for animations/lazy-loaded content
      await new Promise((r) => setTimeout(r, 2000));

      // Dismiss common cookie/consent banners by clicking common selectors
      try {
        await page.evaluate(() => {
          const selectors = [
            '[class*="cookie"] button',
            '[class*="consent"] button',
            '[id*="cookie"] button',
            '[class*="banner"] button[class*="accept"]',
            'button[class*="accept"]',
            '[aria-label*="accept"]',
            '[aria-label*="Accept"]',
          ];
          for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) {
              btn.click();
              break;
            }
          }
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        // Ignore cookie banner errors
      }

      // Take screenshot as WebP
      const buf = await page.screenshot({
        type: "webp",
        quality: 82,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      fs.writeFileSync(dest, buf);
      const sizeKB = (buf.length / 1024).toFixed(0);
      console.log(`  OK  ${sizeKB} KB`);
      success++;
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n Done! ${success} succeeded, ${failed} failed out of ${broken.length}`);
}

main().catch(console.error);
