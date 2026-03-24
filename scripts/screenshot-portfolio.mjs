/**
 * screenshot-portfolio.mjs — Screenshots all 57 portfolio websites
 * Uses screenshot-one.mjs for process isolation.
 * Run: node scripts/screenshot-portfolio.mjs
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const outDir = "public/images/projects/portfolio";

const PROJECTS = [
  // E-Commerce
  { slug: "allbirds",       url: "https://www.allbirds.com" },
  { slug: "mejuri",         url: "https://www.mejuri.com" },
  { slug: "bellroy",        url: "https://bellroy.com" },
  { slug: "cotopaxi",      url: "https://www.cotopaxi.com" },
  { slug: "ridge",          url: "https://www.ridge.com" },
  { slug: "kotn",           url: "https://www.kotn.com" },
  { slug: "brooklinen",     url: "https://www.brooklinen.com" },
  { slug: "bombas",         url: "https://bombas.com" },

  // SaaS & Technology
  { slug: "linear",         url: "https://linear.app" },
  { slug: "raycast",        url: "https://www.raycast.com" },
  { slug: "cal",            url: "https://cal.com" },
  { slug: "resend",         url: "https://resend.com" },
  { slug: "clerk",          url: "https://clerk.com" },
  { slug: "dub",            url: "https://dub.co" },

  // Developer Tools
  { slug: "neon",           url: "https://neon.tech" },
  { slug: "railway",        url: "https://railway.app" },
  { slug: "upstash",        url: "https://upstash.com" },
  { slug: "trigger-dev",    url: "https://trigger.dev" },
  { slug: "inngest",        url: "https://www.inngest.com" },
  { slug: "loops",          url: "https://loops.so" },

  // Corporate & Business
  { slug: "mercury",        url: "https://mercury.com" },
  { slug: "ramp",           url: "https://ramp.com" },
  { slug: "lattice",        url: "https://lattice.com" },
  { slug: "gusto",          url: "https://gusto.com" },
  { slug: "rippling",       url: "https://www.rippling.com" },
  { slug: "deel",           url: "https://www.deel.com" },

  // Tourism & Hospitality
  { slug: "getaway-house",  url: "https://getaway.house" },
  { slug: "hipcamp",        url: "https://www.hipcamp.com" },
  { slug: "sonder",         url: "https://www.sonder.com" },
  { slug: "inspirato",      url: "https://www.inspirato.com" },
  { slug: "under-canvas",   url: "https://www.undercanvas.com" },

  // Healthcare & Wellness
  { slug: "noom",           url: "https://www.noom.com" },
  { slug: "hims",           url: "https://www.hims.com" },
  { slug: "ritual",         url: "https://ritual.com" },
  { slug: "oura",           url: "https://ouraring.com" },
  { slug: "whoop",          url: "https://www.whoop.com" },

  // Real Estate
  { slug: "pacaso",         url: "https://www.pacaso.com" },
  { slug: "flyhomes",       url: "https://www.flyhomes.com" },
  { slug: "landing",        url: "https://www.hellolanding.com" },
  { slug: "lessen",         url: "https://www.lessen.com" },
  { slug: "juniper-square", url: "https://junipersquare.com" },

  // Fashion & Lifestyle
  { slug: "everlane",       url: "https://www.everlane.com" },
  { slug: "vuori",          url: "https://vuoriclothing.com" },
  { slug: "aritzia",        url: "https://www.aritzia.com" },
  { slug: "tentree",        url: "https://www.tentree.com" },
  { slug: "frank-and-oak",  url: "https://www.frankandoak.com" },

  // Food & Beverage
  { slug: "sweetgreen",     url: "https://www.sweetgreen.com" },
  { slug: "blue-bottle",    url: "https://bluebottlecoffee.com" },
  { slug: "huel",           url: "https://huel.com" },
  { slug: "daily-harvest",  url: "https://www.daily-harvest.com" },
  { slug: "hungryroot",     url: "https://www.hungryroot.com" },

  // Creative & Design
  { slug: "rive",           url: "https://rive.app" },
  { slug: "spline",         url: "https://spline.design" },
  { slug: "readymag",       url: "https://readymag.com" },
  { slug: "pitch",          url: "https://pitch.com" },
  { slug: "lottiefiles",    url: "https://lottiefiles.com" },
  { slug: "read-cv",        url: "https://read.cv" },
];

console.log(`Screenshotting ${PROJECTS.length} websites...\n`);

let ok = 0, fail = 0;
const failures = [];

for (let i = 0; i < PROJECTS.length; i++) {
  const p = PROJECTS[i];
  const dest = path.join(outDir, `${p.slug}.webp`);
  const label = `[${i + 1}/${PROJECTS.length}]`;

  // Skip if already exists and is good
  if (fs.existsSync(dest) && fs.statSync(dest).size > 12000) {
    console.log(`${label} SKIP ${p.slug} (already good)`);
    ok++;
    continue;
  }

  try {
    const result = execFileSync(
      process.execPath,
      ["scripts/screenshot-one.mjs", p.slug, p.url],
      { timeout: 60000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log(`${label} ${result.trim()}`);
    ok++;
  } catch (err) {
    const msg = (err.stdout || err.stderr || err.message || "").trim().slice(0, 100);
    console.log(`${label} ERROR ${p.slug} — ${msg}`);
    failures.push({ slug: p.slug, url: p.url });
    fail++;
  }

  // Small delay between screenshots
  if (i < PROJECTS.length - 1) {
    await new Promise(r => setTimeout(r, 1500));
  }
}

console.log(`\nDone: ${ok} OK, ${fail} FAIL`);
if (failures.length) {
  console.log("Failures:");
  failures.forEach(f => console.log(`  ${f.slug} -> ${f.url}`));
}
