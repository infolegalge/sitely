import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "public/images/projects";

// Optimize the replacement screenshot
const files = [
  { src: "glossier.png", dest: "glossier.webp" },
];

for (const f of files) {
  const srcPath = path.join(dir, f.src);
  const destPath = path.join(dir, f.dest);

  const info = await sharp(srcPath)
    .resize(1280, 800, { fit: "cover", position: "top" })
    .webp({ quality: 82, effort: 6 })
    .toFile(destPath);

  const origSize = fs.statSync(srcPath).size;
  console.log(
    `${f.src}: ${(origSize / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB WebP`
  );
}

// Generate blur placeholders
console.log("\nBlur placeholders:");
for (const f of files) {
  const srcPath = path.join(dir, f.dest);
  const buf = await sharp(srcPath).resize(16, 10).webp({ quality: 20 }).toBuffer();
  const name = f.dest.replace(".webp", "");
  console.log(`"${name}": "data:image/webp;base64,${buf.toString("base64")}",`);
}

// Remove old files and temp png files
const toRemove = [
  "aesop.webp",
  "aesop-w8.png",
  "aesop-skin.png",
  "glossier.png",
  "bellroy.png",
  "rfrsh.png",
];

for (const f of toRemove) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed: ${f}`);
  }
}

console.log("\nDone!");
