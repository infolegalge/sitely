/**
 * Download screenshots for all 57 portfolio projects using thum.io
 *
 * Each fictional project maps to a real website whose visual style matches.
 * Screenshots are saved as PNG, then converted to WebP via sharp.
 *
 * Usage:  node scripts/dl-portfolio-screenshots.mjs
 */

import https from "https";
import fs from "fs";
import path from "path";

/* ── Map each project slug → a real website URL ── */
const projects = [
  /* ═══ E-COMMERCE (8) ═══ */
  { name: "velour-beauty",     url: "https://www.rarebeauty.com" },
  { name: "nordik-outdoor",    url: "https://www.hfresco.com" },
  { name: "luminary-watches",  url: "https://www.danielwellington.com" },
  { name: "botanica-market",   url: "https://www.thesill.com" },
  { name: "revolta-motors",    url: "https://www.polestar.com" },
  { name: "aether-audio",      url: "https://www.beoplay.com" },
  { name: "casa-ceramica",     url: "https://www.heathceramics.com" },
  { name: "apex-supplements",  url: "https://www.ritual.com" },

  /* ═══ 3D & WebGL (6) ═══ */
  { name: "stellar-space",     url: "https://www.spacex.com" },
  { name: "vertigo-studios",   url: "https://www.resn.co.nz" },
  { name: "atlas-geography",   url: "https://earth.google.com" },
  { name: "neuron-lab",        url: "https://www.brainly.com" },
  { name: "oceanic-dive",      url: "https://www.oceanconservancy.org" },
  { name: "prism-architecture",url: "https://www.zaha-hadid.com" },

  /* ═══ SaaS & TECHNOLOGY (6) ═══ */
  { name: "flowdesk-crm",      url: "https://www.attio.com" },
  { name: "cipher-security",   url: "https://www.1password.com" },
  { name: "syncboard-pm",      url: "https://linear.app" },
  { name: "voxel-analytics",   url: "https://www.mixpanel.com" },
  { name: "pulse-devops",      url: "https://vercel.com" },
  { name: "echoai-assistant",  url: "https://www.jasper.ai" },

  /* ═══ CORPORATE & BUSINESS (6) ═══ */
  { name: "meridian-capital",   url: "https://www.goldmansachs.com" },
  { name: "quantum-consulting", url: "https://www.mckinsey.com" },
  { name: "zenith-law",        url: "https://www.cliffordchance.com" },
  { name: "bridge-ventures",   url: "https://a16z.com" },
  { name: "atlas-logistics",   url: "https://www.flexport.com" },
  { name: "apex-energy",       url: "https://www.nexttracker.com" },

  /* ═══ TOURISM & HOSPITALITY (6) ═══ */
  { name: "aurora-resorts",    url: "https://www.aman.com" },
  { name: "wanderlust-trails", url: "https://www.alltrails.com" },
  { name: "sakura-ryokan",     url: "https://www.hoshinoresorts.com" },
  { name: "compass-cruises",   url: "https://www.explora-journeys.com" },
  { name: "alpine-lodges",     url: "https://www.the-chedi-andermatt.com" },
  { name: "ember-safari",      url: "https://www.andbeyond.com" },

  /* ═══ HEALTHCARE & WELLNESS (5) ═══ */
  { name: "vitalis-clinic",    url: "https://www.onemedical.com" },
  { name: "serenity-wellness", url: "https://www.calm.com" },
  { name: "mindflow-therapy",  url: "https://www.headspace.com" },
  { name: "kinetic-physio",    url: "https://www.sword.health" },
  { name: "bloom-fertility",   url: "https://www.kindbody.com" },

  /* ═══ REAL ESTATE (5) ═══ */
  { name: "skyline-properties", url: "https://www.sothebysrealty.com" },
  { name: "haven-homes",       url: "https://www.compass.com" },
  { name: "pinnacle-towers",   url: "https://www.skyscrapercity.com" },
  { name: "coastal-living",    url: "https://www.zillow.com" },
  { name: "urban-nest",        url: "https://www.trulia.com" },

  /* ═══ FASHION & LUXURY (5) ═══ */
  { name: "maison-noir",       url: "https://www.ysl.com" },
  { name: "esse-jewelry",      url: "https://www.mejuri.com" },
  { name: "atelier-blanc",     url: "https://www.celine.com" },
  { name: "vanguard-menswear", url: "https://www.mrporter.com" },
  { name: "soleil-eyewear",    url: "https://www.oliverpeoples.com" },

  /* ═══ FOOD & RESTAURANT (5) ═══ */
  { name: "ember-steakhouse",  url: "https://www.nobu.com" },
  { name: "sakana-omakase",    url: "https://www.sushisamba.com" },
  { name: "verde-kitchen",     url: "https://www.sweetgreen.com" },
  { name: "crust-bakery",      url: "https://www.dominiqueansel.com" },
  { name: "noma-cocktails",    url: "https://www.deathandco.com" },

  /* ═══ CREATIVE & PORTFOLIO (5) ═══ */
  { name: "parallax-studio",   url: "https://www.basicagency.com" },
  { name: "mono-type",         url: "https://www.pentagram.com" },
  { name: "frame-motion",      url: "https://www.buck.co" },
  { name: "pixel-forge",       url: "https://www.ueno.co" },
  { name: "sonance-music",     url: "https://www.spotify.design" },
];

/* ── output directory ── */
const outDir = path.resolve("public/images/projects/portfolio");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

/* ── thum.io params: 1280×800, wait 5s for JS rendering ── */
const thumbUrl = (siteUrl) =>
  `https://image.thum.io/get/width/1280/crop/800/wait/5/${siteUrl}`;

/* ── follow redirects ── */
function follow(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https
      .get(url, { timeout: 180_000 }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          return follow(res.headers.location, maxRedirects - 1).then(
            resolve,
            reject,
          );
        }
        resolve(res);
      })
      .on("error", reject);
  });
}

/* ── download one screenshot ── */
async function download(project) {
  const dest = path.join(outDir, `${project.name}.png`);

  // Skip if WebP or PNG already exists
  const webpDest = path.join(outDir, `${project.name}.webp`);
  if (fs.existsSync(webpDest) || fs.existsSync(dest)) {
    console.log(`  SKIP ${project.name} (already exists)`);
    return;
  }

  console.log(`  Downloading ${project.name} <- ${project.url}`);
  try {
    const res = await follow(thumbUrl(project.url));
    const stream = fs.createWriteStream(dest);
    res.pipe(stream);
    await new Promise((ok, fail) => {
      stream.on("finish", ok);
      stream.on("error", fail);
    });
    const size = fs.statSync(dest).size;
    const status = size > 50_000 ? "OK" : "⚠ SMALL";
    console.log(
      `  ${project.name}.png  ${(size / 1024).toFixed(0)} KB  ${status}`,
    );
  } catch (err) {
    console.error(`  ✗ FAILED ${project.name}: ${err.message}`);
  }
}

/* ── convert all PNGs to WebP ── */
async function convertAll() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("\nsharp not installed — PNGs saved. Install sharp to convert:");
    console.log("  npm i -D sharp");
    return;
  }

  console.log("\n── Converting to WebP ──");
  for (const p of projects) {
    const src = path.join(outDir, `${p.name}.png`);
    const dest = path.join(outDir, `${p.name}.webp`);
    if (!fs.existsSync(src)) continue;

    try {
      const info = await sharp(src)
        .resize(1280, 800, { fit: "cover", position: "top" })
        .webp({ quality: 82, effort: 6 })
        .toFile(dest);

      const origSize = fs.statSync(src).size;
      console.log(
        `  ${p.name}: ${(origSize / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB webp`,
      );
      // Remove PNG after successful conversion
      fs.unlinkSync(src);
    } catch (err) {
      console.error(`  ✗ Convert failed ${p.name}: ${err.message}`);
    }
  }
}

/* ── main: download in batches of 5 to avoid rate-limiting ── */
async function main() {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  Portfolio Screenshot Downloader       ║`);
  console.log(`║  ${projects.length} projects → ${outDir}`);
  console.log(`╚═══════════════════════════════════════╝\n`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);
    console.log(
      `\n── Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(projects.length / BATCH_SIZE)} ──`,
    );
    await Promise.all(batch.map(download));
  }

  await convertAll();

  console.log(`\n✓ All done! ${projects.length} screenshots processed.`);
}

main().catch(console.error);
