import https from "https";
import fs from "fs";
import path from "path";

const projects = [
  // Aesop with longer wait + different pages
  { name: "aesop-w8", url: "https://image.thum.io/get/width/1280/crop/800/wait/8/https://www.aesop.com" },
  { name: "aesop-skin", url: "https://image.thum.io/get/width/1280/crop/800/wait/5/https://www.aesop.com/us/c/skin/" },
  // Alternative premium e-commerce
  { name: "glossier", url: "https://image.thum.io/get/width/1280/crop/800/wait/3/https://www.glossier.com" },
  { name: "bellroy", url: "https://image.thum.io/get/width/1280/crop/800/wait/3/https://bellroy.com" },
  { name: "rfrsh", url: "https://image.thum.io/get/width/1280/crop/800/wait/3/https://www.brooklinen.com" },
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
            reject
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
    const ok = size > 50_000 ? "✅" : "⚠️ small";
    console.log(`  ${project.name}.png  ${(size / 1024).toFixed(0)} KB  ${ok}`);
  } catch (err) {
    console.error(`  FAILED ${project.name}:`, err.message);
  }
}

for (const p of projects) {
  await download(p);
}
console.log("\nDone! Pick the best ones.");
