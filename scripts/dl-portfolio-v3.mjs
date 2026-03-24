/**
 * Re-download broken portfolio screenshots using Microlink API.
 * Free tier, no API key needed, handles bot-blocking better.
 *
 * Usage:  node scripts/dl-portfolio-v3.mjs
 */

import https from "https";
import fs from "fs";
import path from "path";

const outDir = path.resolve("public/images/projects/portfolio");

/* ── project → URL mapping (same as v2) ── */
const projects = [
  { name: "velour-beauty",      url: "https://www.glossier.com" },
  { name: "nordik-outdoor",     url: "https://www.rei.com" },
  { name: "luminary-watches",   url: "https://www.tissotshop.com" },
  { name: "botanica-market",    url: "https://www.bloomandwild.com" },
  { name: "revolta-motors",     url: "https://www.polestar.com" },
  { name: "aether-audio",       url: "https://www.sonos.com" },
  { name: "casa-ceramica",      url: "https://www.etsy.com" },
  { name: "apex-supplements",   url: "https://www.myprotein.com" },
  { name: "stellar-space",      url: "https://www.spacex.com" },
  { name: "vertigo-studios",    url: "https://www.awwwards.com" },
  { name: "atlas-geography",    url: "https://www.mapbox.com" },
  { name: "neuron-lab",         url: "https://openai.com" },
  { name: "oceanic-dive",       url: "https://www.nationalgeographic.com" },
  { name: "prism-architecture", url: "https://www.archdaily.com" },
  { name: "flowdesk-crm",      url: "https://www.hubspot.com" },
  { name: "cipher-security",   url: "https://www.cloudflare.com" },
  { name: "syncboard-pm",      url: "https://www.notion.so" },
  { name: "voxel-analytics",   url: "https://www.tableau.com" },
  { name: "pulse-devops",      url: "https://github.com" },
  { name: "echoai-assistant",  url: "https://www.intercom.com" },
  { name: "meridian-capital",  url: "https://www.jpmorgan.com" },
  { name: "quantum-consulting",url: "https://www.bcg.com" },
  { name: "zenith-law",        url: "https://www.bakermckenzie.com" },
  { name: "bridge-ventures",   url: "https://www.ycombinator.com" },
  { name: "atlas-logistics",   url: "https://www.fedex.com" },
  { name: "apex-energy",       url: "https://www.tesla.com/energy" },
  { name: "aurora-resorts",    url: "https://www.marriott.com" },
  { name: "wanderlust-trails", url: "https://www.lonelyplanet.com" },
  { name: "sakura-ryokan",     url: "https://www.booking.com" },
  { name: "compass-cruises",   url: "https://www.royalcaribbean.com" },
  { name: "alpine-lodges",     url: "https://www.airbnb.com" },
  { name: "ember-safari",      url: "https://www.tripadvisor.com" },
  { name: "vitalis-clinic",    url: "https://www.mayoclinic.org" },
  { name: "serenity-wellness", url: "https://www.calm.com" },
  { name: "mindflow-therapy",  url: "https://www.headspace.com" },
  { name: "kinetic-physio",    url: "https://www.peloton.com" },
  { name: "bloom-fertility",   url: "https://www.webmd.com" },
  { name: "skyline-properties",url: "https://www.realtor.com" },
  { name: "haven-homes",       url: "https://www.compass.com" },
  { name: "pinnacle-towers",   url: "https://www.redfin.com" },
  { name: "coastal-living",    url: "https://www.zillow.com" },
  { name: "urban-nest",        url: "https://www.apartments.com" },
  { name: "maison-noir",       url: "https://www.gucci.com" },
  { name: "esse-jewelry",      url: "https://www.tiffany.com" },
  { name: "atelier-blanc",     url: "https://www.dior.com" },
  { name: "vanguard-menswear", url: "https://www.hugoboss.com" },
  { name: "soleil-eyewear",    url: "https://www.ray-ban.com" },
  { name: "ember-steakhouse",  url: "https://www.opentable.com" },
  { name: "sakana-omakase",    url: "https://www.yelp.com" },
  { name: "verde-kitchen",     url: "https://www.sweetgreen.com" },
  { name: "crust-bakery",      url: "https://www.kingarthurbaking.com" },
  { name: "noma-cocktails",    url: "https://www.diffordsguide.com" },
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
    if (!fs.existsSync(webp)) { broken.push(p); continue; }
    if (fs.statSync(webp).size <= 10000) broken.push(p);
  }
  return broken;
}

/* ── fetch URL → Buffer ── */
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        let loc = res.headers.location;
        if (loc.startsWith("/")) loc = new URL(url).origin + loc;
        return fetchUrl(loc, maxRedirects - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/* ── Microlink screenshot URL ── */
function microlinkUrl(siteUrl) {
  const encoded = encodeURIComponent(siteUrl);
  return `https://api.microlink.io/?url=${encoded}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&waitForTimeout=3000&type=png`;
}

async function main() {
  const broken = getBrokenProjects();
  console.log(`\nFound ${broken.length} broken/missing images to re-download\n`);
  if (broken.length === 0) { console.log("All good!"); return; }

  let sharp;
  try { sharp = (await import("sharp")).default; }
  catch { console.log("sharp not installed"); return; }

  let success = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < broken.length; i++) {
    const p = broken[i];
    const dest = path.join(outDir, `${p.name}.webp`);
    console.log(`[${i + 1}/${broken.length}] ${p.name} <- ${p.url}`);

    try {
      const url = microlinkUrl(p.url);
      const pngBuf = await fetchUrl(url);

      if (pngBuf.length < 5000) {
        throw new Error(`Too small: ${pngBuf.length} bytes`);
      }

      // Convert PNG to WebP and resize to 1280x800
      await sharp(pngBuf)
        .resize(1280, 800, { fit: "cover", position: "top" })
        .webp({ quality: 82 })
        .toFile(dest);

      const size = fs.statSync(dest).size;
      console.log(`  OK  ${(size / 1024).toFixed(0)} KB`);
      success++;

      // Rate limit: Microlink free tier is ~50 req/min
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  FAILED: ${err.message.substring(0, 100)}`);
      failures.push(p.name);
      failed++;
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed`);
  if (failures.length) console.log(`Failed: ${failures.join(", ")}`);
}

main().catch(console.error);
