/**
 * dl-batch.mjs — Takes a batch number (1-6) and processes ~4 images per batch.
 * Usage: node scripts/dl-batch.mjs <batch_number>
 * Each batch is a separate invocation to ensure clean state.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const BATCHES = [
  // Batch 1
  [
    { slug: "aurora-resorts",     url: "https://www.timeout.com" },
    { slug: "bloom-fertility",    url: "https://www.mayoclinic.org" },
    { slug: "bridge-ventures",    url: "https://www.blackrock.com" },
    { slug: "coastal-living",     url: "https://www.redfin.com" },
  ],
  // Batch 2
  [
    { slug: "compass-cruises",    url: "https://www.cntraveler.com" },
    { slug: "crust-bakery",       url: "https://www.epicurious.com" },
    { slug: "ember-safari",       url: "https://www.expedia.com" },
    { slug: "ember-steakhouse",   url: "https://www.bonappetit.com" },
  ],
  // Batch 3
  [
    { slug: "frame-motion",       url: "https://dribbble.com" },
    { slug: "kinetic-physio",     url: "https://www.everydayhealth.com" },
    { slug: "noma-cocktails",     url: "https://www.thekitchn.com" },
    { slug: "pinnacle-towers",    url: "https://www.zillow.com" },
  ],
  // Batch 4
  [
    { slug: "pixel-forge",        url: "https://www.figma.com" },
    { slug: "quantum-consulting", url: "https://www.accenture.com" },
    { slug: "sakana-omakase",     url: "https://www.eater.com" },
    { slug: "sakura-ryokan",      url: "https://www.nationalgeographic.com/travel" },
  ],
  // Batch 5
  [
    { slug: "serenity-wellness",  url: "https://www.healthline.com" },
    { slug: "soleil-eyewear",     url: "https://www.farfetch.com" },
    { slug: "sonance-music",      url: "https://www.sketch.com" },
    { slug: "urban-nest",         url: "https://www.realtor.com" },
  ],
  // Batch 6
  [
    { slug: "vanguard-menswear",  url: "https://www.vogue.com" },
    { slug: "verde-kitchen",      url: "https://www.seriouseats.com" },
    { slug: "wanderlust-trails",  url: "https://www.lonelyplanet.com" },
    { slug: "zenith-law",         url: "https://www.weforum.org" },
  ],
];

const batchNum = parseInt(process.argv[2]) || 1;
if (batchNum < 1 || batchNum > BATCHES.length) {
  console.log(`Usage: node dl-batch.mjs <1-${BATCHES.length}>`);
  process.exit(1);
}

const batch = BATCHES[batchNum - 1];
const outDir = "public/images/projects/portfolio";
const logFile = "scripts/batch-log.txt";

function appendLog(msg) {
  fs.appendFileSync(logFile, msg + "\n");
}

appendLog(`\n=== Batch ${batchNum} started ${new Date().toISOString()} ===`);

for (const item of batch) {
  const file = path.join(outDir, `${item.slug}.webp`);
  // Skip if already good
  if (fs.existsSync(file) && fs.statSync(file).size >= 12000) {
    const msg = `SKIP ${item.slug} (already good)`;
    console.log(msg);
    appendLog(msg);
    continue;
  }

  try {
    const result = execFileSync(
      process.execPath,
      ["scripts/screenshot-one.mjs", item.slug, item.url],
      { timeout: 60000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log(result.trim());
    appendLog(result.trim());
  } catch (err) {
    const msg = `FAIL ${item.slug} — ${(err.stdout || err.stderr || err.message || "").trim().slice(0, 100)}`;
    console.log(msg);
    appendLog(msg);
  }
}

appendLog(`=== Batch ${batchNum} done ===`);
console.log(`\nBatch ${batchNum} complete`);
