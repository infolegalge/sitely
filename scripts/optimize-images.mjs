import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "public/images/projects";
const names = ["darknode", "springs", "planetono", "particolare"];

for (const n of names) {
  const src = path.join(dir, `${n}.jpg`); // actually PNG data
  const dest = path.join(dir, `${n}.webp`);

  const info = await sharp(src)
    .resize(1280, 800, { fit: "cover", position: "top" })
    .webp({ quality: 82, effort: 6 })
    .toFile(dest);

  const origSize = fs.statSync(src).size;
  console.log(
    `${n}: ${(origSize / 1024).toFixed(0)}KB PNG -> ${(info.size / 1024).toFixed(0)}KB WebP  (${((1 - info.size / origSize) * 100).toFixed(0)}% smaller)`
  );

  // Remove original
  fs.unlinkSync(src);
}

console.log("\nOptimization complete!");
