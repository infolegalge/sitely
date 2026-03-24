/**
 * Convert remaining PNGs to WebP in public/images/projects/portfolio/
 * Usage:  node scripts/convert-remaining.mjs
 */
import fs from "fs";
import path from "path";

const dir = path.resolve("public/images/projects/portfolio");

async function main() {
  const sharp = (await import("sharp")).default;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
  console.log(`Found ${files.length} PNG files to convert`);

  for (const file of files) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(".png", ".webp"));

    if (fs.existsSync(dest)) {
      // WebP exists, just remove PNG
      fs.unlinkSync(src);
      console.log(`  ${file} -> already has webp, removed png`);
      continue;
    }

    try {
      const info = await sharp(src)
        .resize(1280, 800, { fit: "cover", position: "top" })
        .webp({ quality: 82, effort: 6 })
        .toFile(dest);

      const origSize = fs.statSync(src).size;
      console.log(
        `  ${file}: ${(origSize / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB webp`,
      );
      fs.unlinkSync(src);
    } catch (err) {
      console.error(`  FAIL ${file}: ${err.message}`);
    }
  }

  const webps = fs.readdirSync(dir).filter((f) => f.endsWith(".webp"));
  console.log(`\nDone! ${webps.length} WebP files ready.`);
}

main().catch(console.error);
