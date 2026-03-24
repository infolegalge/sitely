/**
 * Adds liveUrl field to every portfolio project.
 * Run: node scripts/add-live-urls.mjs
 */
import fs from "fs";

const URLS = {
  "velour-beauty":      "https://www.glossier.com",
  "nordik-outdoor":     "https://www.rei.com",
  "luminary-watches":   "https://www.tissotshop.com",
  "botanica-market":    "https://www.bloomandwild.com",
  "revolta-motors":     "https://www.polestar.com",
  "aether-audio":       "https://www.sonos.com",
  "casa-ceramica":      "https://www.etsy.com",
  "apex-supplements":   "https://www.myprotein.com",
  "stellar-space":      "https://www.spacex.com",
  "vertigo-studios":    "https://threejs.org",
  "atlas-geography":    "https://www.mapbox.com",
  "neuron-lab":         "https://openai.com",
  "oceanic-dive":       "https://www.blender.org",
  "prism-architecture": "https://www.archdaily.com",
  "flowdesk-crm":       "https://stripe.com",
  "cipher-security":    "https://tailwindcss.com",
  "syncboard-pm":       "https://supabase.com",
  "voxel-analytics":    "https://nextjs.org",
  "pulse-devops":       "https://github.com",
  "echoai-assistant":   "https://vercel.com",
  "meridian-capital":   "https://www.jpmorgan.com",
  "quantum-consulting": "https://www.accenture.com",
  "zenith-law":         "https://www.weforum.org",
  "bridge-ventures":    "https://www.blackrock.com",
  "atlas-logistics":    "https://www.kpmg.com",
  "apex-energy":        "https://www.shell.com",
  "aurora-resorts":     "https://www.timeout.com",
  "wanderlust-trails":  "https://www.lonelyplanet.com",
  "sakura-ryokan":      "https://www.nationalgeographic.com/travel",
  "compass-cruises":    "https://www.cntraveler.com",
  "alpine-lodges":      "https://www.hotels.com",
  "ember-safari":       "https://www.expedia.com",
  "vitalis-clinic":     "https://www.mayoclinic.org",
  "serenity-wellness":  "https://www.healthline.com",
  "mindflow-therapy":   "https://www.headspace.com",
  "kinetic-physio":     "https://www.everydayhealth.com",
  "bloom-fertility":    "https://www.mayoclinic.org",
  "skyline-properties": "https://www.realtor.com",
  "haven-homes":        "https://www.compass.com",
  "pinnacle-towers":    "https://www.zillow.com",
  "coastal-living":     "https://www.redfin.com",
  "urban-nest":         "https://www.realtor.com",
  "maison-noir":        "https://www.gucci.com",
  "esse-jewelry":       "https://www.tiffany.com",
  "atelier-blanc":      "https://www.zara.com",
  "vanguard-menswear":  "https://www.vogue.com",
  "soleil-eyewear":     "https://www.farfetch.com",
  "ember-steakhouse":   "https://www.bonappetit.com",
  "sakana-omakase":     "https://www.eater.com",
  "verde-kitchen":      "https://www.seriouseats.com",
  "crust-bakery":       "https://www.epicurious.com",
  "noma-cocktails":     "https://www.thekitchn.com",
  "parallax-studio":    "https://www.behance.net",
  "mono-type":          "https://www.pentagram.com",
  "frame-motion":       "https://dribbble.com",
  "pixel-forge":        "https://www.figma.com",
  "sonance-music":      "https://www.sketch.com",
};

let content = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8");
let updated = 0;

for (const [slug, url] of Object.entries(URLS)) {
  // Insert liveUrl before accentColor for each project
  const marker = `slug: "${slug}"`;
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.log(`Not found: ${slug}`);
    continue;
  }

  const afterSlug = content.slice(idx);
  const accentIdx = afterSlug.indexOf("accentColor:");
  if (accentIdx === -1) {
    console.log(`No accentColor for: ${slug}`);
    continue;
  }

  const insertPos = idx + accentIdx;
  const injection = `liveUrl: "${url}",\n    `;
  content = content.slice(0, insertPos) + injection + content.slice(insertPos);
  updated++;
}

fs.writeFileSync("src/lib/portfolio-projects.ts", content);
console.log(`Added liveUrl to ${updated}/${Object.keys(URLS).length} projects`);
