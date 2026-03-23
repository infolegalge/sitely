import https from "https";
import fs from "fs";
import path from "path";

const projects = [
  {
    name: "obys",
    url: "https://image.thum.io/get/width/1280/crop/800/https://obys.agency",
  },
  {
    name: "lusion",
    url: "https://image.thum.io/get/width/1280/crop/800/https://lusion.co",
  },
];

const outDir = path.resolve("public/images/projects");

function follow(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https
      .get(url, { timeout: 120_000 }, (res) => {
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
    console.log(`  ${project.name}.png  ${(size / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.error(`  FAILED ${project.name}:`, err.message);
  }
}

for (const p of projects) {
  await download(p);
}
console.log("\nDownload done!");
