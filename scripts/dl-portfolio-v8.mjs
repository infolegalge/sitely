/**
 * dl-portfolio-v8.mjs — Downloads one screenshot at a time via child_process.
 * Reads broken images directly, maps slug→URL, spawns screenshot-one.mjs per image.
 * If a subprocess crashes, logs and continues to next.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const outDir = "public/images/projects/portfolio";

const URL_MAP = {
  "quantum-consulting": "https://www.accenture.com",
  "zenith-law":         "https://www.weforum.org",
  "bridge-ventures":    "https://www.blackrock.com",
  "atlas-logistics":    "https://www.kpmg.com",
  "aurora-resorts":     "https://www.timeout.com",
  "wanderlust-trails":  "https://www.lonelyplanet.com",
  "sakura-ryokan":      "https://www.nationalgeographic.com/travel",
  "compass-cruises":    "https://www.cntraveler.com",
  "alpine-lodges":      "https://www.hotels.com",
  "ember-safari":       "https://www.expedia.com",
  "serenity-wellness":  "https://www.healthline.com",
  "kinetic-physio":     "https://www.everydayhealth.com",
  "bloom-fertility":    "https://www.mayoclinic.org",
  "pinnacle-towers":    "https://www.zillow.com",
  "coastal-living":     "https://www.redfin.com",
  "urban-nest":         "https://www.realtor.com",
  "vanguard-menswear":  "https://www.vogue.com",
  "soleil-eyewear":     "https://www.farfetch.com",
  "ember-steakhouse":   "https://www.bonappetit.com",
  "sakana-omakase":     "https://www.eater.com",
  "verde-kitchen":      "https://www.seriouseats.com",
  "crust-bakery":       "https://www.epicurious.com",
  "noma-cocktails":     "https://www.thekitchn.com",
  "frame-motion":       "https://dribbble.com",
  "pixel-forge":        "https://www.figma.com",
  "sonance-music":      "https://www.sketch.com",
};

// Find broken images
const broken = fs.readdirSync(outDir)
  .filter(f => f.endsWith(".webp"))
  .filter(f => fs.statSync(path.join(outDir, f)).size < 12000)
  .map(f => f.replace(".webp", ""))
  .filter(slug => URL_MAP[slug]);

console.log(`${broken.length} broken images to fix\n`);

let ok = 0, fail = 0;
const failures = [];

for (let i = 0; i < broken.length; i++) {
  const slug = broken[i];
  const url = URL_MAP[slug];
  const label = `[${i + 1}/${broken.length}]`;

  try {
    const result = execFileSync(
      process.execPath,
      ["scripts/screenshot-one.mjs", slug, url],
      { timeout: 60000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log(`${label} ${result.trim()}`);
    ok++;
  } catch (err) {
    const msg = (err.stdout || err.stderr || err.message || "").trim().slice(0, 100);
    console.log(`${label} ERROR ${slug} — ${msg}`);
    failures.push(slug);
    fail++;
  }

  // Small delay between screenshots to avoid resource exhaustion
  if (i < broken.length - 1) {
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log(`\nDone: ${ok} OK, ${fail} FAIL`);
if (failures.length) console.log("Failures:", failures.join(", "));
