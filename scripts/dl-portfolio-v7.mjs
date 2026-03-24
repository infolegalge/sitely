/**
 * dl-portfolio-v7.mjs — Runs screenshot-one.mjs as a subprocess for each broken image.
 * True process isolation: if one crashes, the next starts fresh.
 * All URLs are proven-working from test-results.txt
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const outDir = path.resolve("public/images/projects/portfolio");

/* Every URL here was verified GOOD (>15KB) in test-results.txt */
const PROJECTS = [
  // SaaS & Technology
  { slug: "flowdesk-crm",       url: "https://stripe.com" },
  { slug: "cipher-security",    url: "https://tailwindcss.com" },
  { slug: "syncboard-pm",       url: "https://supabase.com" },
  { slug: "voxel-analytics",    url: "https://nextjs.org" },
  { slug: "pulse-devops",       url: "https://github.com" },
  { slug: "echoai-assistant",   url: "https://vercel.com" },

  // 3D & WebGL
  { slug: "neuron-lab",         url: "https://www.unrealengine.com" },

  // Corporate & Business
  { slug: "quantum-consulting", url: "https://www.accenture.com" },
  { slug: "zenith-law",         url: "https://www.weforum.org" },
  { slug: "bridge-ventures",    url: "https://www.blackrock.com" },
  { slug: "atlas-logistics",    url: "https://www.kpmg.com" },

  // Tourism & Hospitality
  { slug: "aurora-resorts",     url: "https://www.timeout.com" },
  { slug: "wanderlust-trails",  url: "https://www.lonelyplanet.com" },
  { slug: "sakura-ryokan",      url: "https://www.nationalgeographic.com/travel" },
  { slug: "compass-cruises",    url: "https://www.cntraveler.com" },
  { slug: "alpine-lodges",      url: "https://www.hotels.com" },
  { slug: "ember-safari",       url: "https://www.expedia.com" },

  // Healthcare & Wellness
  { slug: "serenity-wellness",  url: "https://www.healthline.com" },
  { slug: "kinetic-physio",     url: "https://www.everydayhealth.com" },
  { slug: "bloom-fertility",    url: "https://www.mayoclinic.org" },

  // Real Estate
  { slug: "pinnacle-towers",    url: "https://www.zillow.com" },
  { slug: "coastal-living",     url: "https://www.redfin.com" },
  { slug: "urban-nest",         url: "https://www.realtor.com" },

  // Fashion & Luxury
  { slug: "vanguard-menswear",  url: "https://www.vogue.com" },
  { slug: "soleil-eyewear",     url: "https://www.farfetch.com" },

  // Food & Restaurant
  { slug: "ember-steakhouse",   url: "https://www.bonappetit.com" },
  { slug: "sakana-omakase",     url: "https://www.eater.com" },
  { slug: "verde-kitchen",      url: "https://www.seriouseats.com" },
  { slug: "crust-bakery",       url: "https://www.epicurious.com" },
  { slug: "noma-cocktails",     url: "https://www.thekitchn.com" },

  // Creative & Portfolio
  { slug: "frame-motion",       url: "https://dribbble.com" },
  { slug: "pixel-forge",        url: "https://www.figma.com" },
  { slug: "sonance-music",      url: "https://www.sketch.com" },
];

function isBroken(slug) {
  const f = path.join(outDir, `${slug}.webp`);
  if (!fs.existsSync(f)) return true;
  return fs.statSync(f).size < 12000;
}

const broken = PROJECTS.filter(p => isBroken(p.slug));
console.log(`${broken.length} broken images to process (of ${PROJECTS.length} total)\n`);

let ok = 0, fail = 0;
const failures = [];

for (let i = 0; i < broken.length; i++) {
  const p = broken[i];
  const label = `[${i + 1}/${broken.length}]`;
  try {
    const out = execFileSync("node", ["scripts/screenshot-one.mjs", p.slug, p.url], {
      timeout: 60000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log(`${label} ${out.trim()}`);
    ok++;
  } catch (err) {
    const msg = err.stdout?.trim() || err.stderr?.trim() || err.message.slice(0, 80);
    console.log(`${label} FAIL ${p.slug} — ${msg}`);
    failures.push(p.slug);
    fail++;
  }
}

console.log(`\nDone: ${ok} OK, ${fail} FAIL`);
if (failures.length) console.log("Failures:", failures.join(", "));
