import https from "https";
import fs from "fs";
import path from "path";

const projects = [
  {
    name: "legal-ge",
    url: "https://image.thum.io/get/width/1280/crop/800/wait/5/https://legal.ge",
  },
  {
    name: "xparagliding",
    url: "https://image.thum.io/get/width/1280/crop/800/wait/5/https://xparagliding.ge",
  },
];

const outDir = path.resolve("public/images/projects");

function follow(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https
      .get(url, { timeout: 180_000 }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          return follow(res.headers.location, maxRedirects - 1).then(
            resolve,
            reject,
          );
        }
        resolve(res);
      })
      .on("error", reject);
  });
}

async function download(project) {
  const dest = path.join(outDir, `${project.name}.png`);
  console.log(`Downloading ${project.name}...`);
  try {
    const res = await follow(project.url);
    const stream = fs.createWriteStream(dest);
    res.pipe(stream);
    await new Promise((ok, fail) => {
      stream.on("finish", ok);
      stream.on("error", fail);
    });
    const size = fs.statSync(dest).size;
    const ok = size > 50_000 ? "OK" : "SMALL - might be error page";
    console.log(`  ${project.name}.png  ${(size / 1024).toFixed(0)} KB  ${ok}`);
  } catch (err) {
    console.error(`  FAILED ${project.name}:`, err.message);
  }
}

for (const p of projects) {
  await download(p);
}
console.log("\nDownload done! Now run optimize step...");

// Optimize to WebP using sharp
try {
  const sharp = (await import("sharp")).default;
  for (const p of projects) {
    const src = path.join(outDir, `${p.name}.png`);
    const dest = path.join(outDir, `${p.name}.webp`);
    if (!fs.existsSync(src)) {
      console.log(`  Skipping ${p.name} - no PNG found`);
      continue;
    }
    const info = await sharp(src)
      .resize(1280, 800, { fit: "cover", position: "top" })
      .webp({ quality: 82, effort: 6 })
      .toFile(dest);

    const origSize = fs.statSync(src).size;
    console.log(
      `${p.name}: ${(origSize / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB WebP`,
    );
    fs.unlinkSync(src);
  }
  console.log("\nAll done! WebP files ready.");
} catch (err) {
  console.error("Sharp not available, PNGs saved. Convert manually:", err.message);
}
