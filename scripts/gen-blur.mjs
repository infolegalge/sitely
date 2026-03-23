import sharp from "sharp";
import path from "path";

const dir = "public/images/projects";
const names = ["darknode", "springs", "planetono", "particolare"];

console.log("Generating blur placeholders...\n");

for (const n of names) {
  const src = path.join(dir, `${n}.webp`);
  const buf = await sharp(src).resize(16, 10).webp({ quality: 20 }).toBuffer();
  const b64 = `data:image/webp;base64,${buf.toString("base64")}`;
  console.log(`"${n}": "${b64}",`);
}
