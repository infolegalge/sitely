/**
 * Generate gradient thumbnail images for broken portfolio screenshots.
 *
 * Creates beautiful abstract gradient images (1280×800) using sharp + SVG.
 * Each category gets a unique color palette with mesh-gradient style.
 *
 * Usage:  node scripts/gen-portfolio-thumbs.mjs
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const outDir = path.resolve("public/images/projects/portfolio");

/* ── category → gradient colors ── */
const CATEGORY_COLORS = {
  "E-Commerce":           { c1: "#667eea", c2: "#764ba2", c3: "#f093fb" },
  "3D & WebGL":           { c1: "#0f0c29", c2: "#302b63", c3: "#24243e" },
  "SaaS & Technology":    { c1: "#0052D4", c2: "#4364F7", c3: "#6FB1FC" },
  "Corporate & Business": { c1: "#141E30", c2: "#243B55", c3: "#4e6a8d" },
  "Tourism & Hospitality":{ c1: "#134E5E", c2: "#71B280", c3: "#a8e063" },
  "Healthcare & Wellness":{ c1: "#43cea2", c2: "#185a9d", c3: "#89d4cf" },
  "Real Estate":          { c1: "#373B44", c2: "#4286f4", c3: "#7db9e8" },
  "Fashion & Luxury":     { c1: "#1a1a2e", c2: "#16213e", c3: "#e94560" },
  "Food & Restaurant":    { c1: "#f12711", c2: "#f5af19", c3: "#ffd194" },
  "Creative & Portfolio": { c1: "#8E2DE2", c2: "#4A00E0", c3: "#c471f5" },
};

/* ── project slug → category mapping ── */
const PROJECT_CATEGORIES = {
  "velour-beauty": "E-Commerce",
  "nordik-outdoor": "E-Commerce",
  "luminary-watches": "E-Commerce",
  "botanica-market": "E-Commerce",
  "revolta-motors": "E-Commerce",
  "aether-audio": "E-Commerce",
  "casa-ceramica": "E-Commerce",
  "apex-supplements": "E-Commerce",
  "stellar-space": "3D & WebGL",
  "vertigo-studios": "3D & WebGL",
  "atlas-geography": "3D & WebGL",
  "neuron-lab": "3D & WebGL",
  "oceanic-dive": "3D & WebGL",
  "prism-architecture": "3D & WebGL",
  "flowdesk-crm": "SaaS & Technology",
  "cipher-security": "SaaS & Technology",
  "syncboard-pm": "SaaS & Technology",
  "voxel-analytics": "SaaS & Technology",
  "pulse-devops": "SaaS & Technology",
  "echoai-assistant": "SaaS & Technology",
  "meridian-capital": "Corporate & Business",
  "quantum-consulting": "Corporate & Business",
  "zenith-law": "Corporate & Business",
  "bridge-ventures": "Corporate & Business",
  "atlas-logistics": "Corporate & Business",
  "apex-energy": "Corporate & Business",
  "aurora-resorts": "Tourism & Hospitality",
  "wanderlust-trails": "Tourism & Hospitality",
  "sakura-ryokan": "Tourism & Hospitality",
  "compass-cruises": "Tourism & Hospitality",
  "alpine-lodges": "Tourism & Hospitality",
  "ember-safari": "Tourism & Hospitality",
  "vitalis-clinic": "Healthcare & Wellness",
  "serenity-wellness": "Healthcare & Wellness",
  "mindflow-therapy": "Healthcare & Wellness",
  "kinetic-physio": "Healthcare & Wellness",
  "bloom-fertility": "Healthcare & Wellness",
  "skyline-properties": "Real Estate",
  "haven-homes": "Real Estate",
  "pinnacle-towers": "Real Estate",
  "coastal-living": "Real Estate",
  "urban-nest": "Real Estate",
  "maison-noir": "Fashion & Luxury",
  "esse-jewelry": "Fashion & Luxury",
  "atelier-blanc": "Fashion & Luxury",
  "vanguard-menswear": "Fashion & Luxury",
  "soleil-eyewear": "Fashion & Luxury",
  "ember-steakhouse": "Food & Restaurant",
  "sakana-omakase": "Food & Restaurant",
  "verde-kitchen": "Food & Restaurant",
  "crust-bakery": "Food & Restaurant",
  "noma-cocktails": "Food & Restaurant",
  "parallax-studio": "Creative & Portfolio",
  "mono-type": "Creative & Portfolio",
  "frame-motion": "Creative & Portfolio",
  "pixel-forge": "Creative & Portfolio",
  "sonance-music": "Creative & Portfolio",
};

/* ── random seeded by name (deterministic) ── */
function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ── generate SVG gradient image ── */
function generateSVG(name, category) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["SaaS & Technology"];
  const seed = hashName(name);

  // Vary circle positions by seed
  const cx1 = 20 + (seed % 30);
  const cy1 = 20 + ((seed >> 3) % 30);
  const cx2 = 60 + ((seed >> 5) % 25);
  const cy2 = 50 + ((seed >> 7) % 30);
  const cx3 = 30 + ((seed >> 9) % 40);
  const cy3 = 70 + ((seed >> 11) % 20);
  const r1 = 35 + (seed % 15);
  const r2 = 30 + ((seed >> 4) % 20);
  const r3 = 25 + ((seed >> 6) % 15);

  // Generate subtle grid lines
  const gridLines = [];
  const gridOpacity = 0.04 + (seed % 3) * 0.01;
  for (let x = 0; x <= 1280; x += 80) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="800" stroke="white" stroke-opacity="${gridOpacity}" />`);
  }
  for (let y = 0; y <= 800; y += 80) {
    gridLines.push(`<line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="white" stroke-opacity="${gridOpacity}" />`);
  }

  // Subtle floating circles for depth
  const circles = [];
  for (let i = 0; i < 5; i++) {
    const cx = ((seed * (i + 1) * 17) % 1280);
    const cy = ((seed * (i + 1) * 13) % 800);
    const r = 2 + (i * 1.5);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" fill-opacity="${0.06 + i * 0.02}" />`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <radialGradient id="g1" cx="${cx1}%" cy="${cy1}%" r="${r1}%">
      <stop offset="0%" stop-color="${colors.c1}" />
      <stop offset="100%" stop-color="${colors.c1}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="g2" cx="${cx2}%" cy="${cy2}%" r="${r2}%">
      <stop offset="0%" stop-color="${colors.c2}" />
      <stop offset="100%" stop-color="${colors.c2}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="g3" cx="${cx3}%" cy="${cy3}%" r="${r3}%">
      <stop offset="0%" stop-color="${colors.c3}" />
      <stop offset="100%" stop-color="${colors.c3}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.c1}" />
      <stop offset="50%" stop-color="${colors.c2}" />
      <stop offset="100%" stop-color="${colors.c3}" />
    </linearGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feBlend in="SourceGraphic" mode="overlay" />
    </filter>
  </defs>

  <!-- Base gradient -->
  <rect width="1280" height="800" fill="url(#bg)" />

  <!-- Mesh-like radial blobs -->
  <rect width="1280" height="800" fill="url(#g1)" opacity="0.8" />
  <rect width="1280" height="800" fill="url(#g2)" opacity="0.7" />
  <rect width="1280" height="800" fill="url(#g3)" opacity="0.6" />

  <!-- Grid overlay -->
  ${gridLines.join("\n  ")}

  <!-- Floating dots -->
  ${circles.join("\n  ")}

  <!-- Subtle noise texture overlay -->
  <rect width="1280" height="800" fill="transparent" filter="url(#noise)" opacity="0.03" />

  <!-- Vignette effect -->
  <rect width="1280" height="800" fill="url(#g1)" opacity="0.15" />
</svg>`;
}

async function main() {
  const allSlugs = Object.keys(PROJECT_CATEGORIES);
  const broken = allSlugs.filter((name) => {
    const f = path.join(outDir, `${name}.webp`);
    if (!fs.existsSync(f)) return true;
    return fs.statSync(f).size <= 10000;
  });

  console.log(`\n${broken.length} broken images to generate\n`);
  if (!broken.length) { console.log("All good!"); return; }

  let ok = 0;
  for (const name of broken) {
    const cat = PROJECT_CATEGORIES[name];
    const svg = generateSVG(name, cat);
    const dest = path.join(outDir, `${name}.webp`);

    try {
      await sharp(Buffer.from(svg))
        .resize(1280, 800)
        .webp({ quality: 85 })
        .toFile(dest);

      const size = fs.statSync(dest).size;
      console.log(`  ${name} (${cat}) → ${(size / 1024).toFixed(0)} KB`);
      ok++;
    } catch (err) {
      console.error(`  FAIL ${name}: ${err.message}`);
    }
  }

  console.log(`\nGenerated ${ok}/${broken.length} thumbnails`);
}

main().catch(console.error);
