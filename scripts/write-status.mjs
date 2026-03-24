import fs from "fs";
import path from "path";
const d = "public/images/projects/portfolio";
const all = fs.readdirSync(d).filter(f => f.endsWith(".webp")).map(f => ({
  name: f, size: fs.statSync(path.join(d, f)).size
}));
const broken = all.filter(x => x.size < 12000);
const good = all.filter(x => x.size >= 12000);
const out = `GOOD: ${good.length} | BROKEN: ${broken.length} | TOTAL: ${all.length}\n\nBroken files:\n${broken.map(x => `  ${x.name} ${x.size}B`).join("\n")}\n\nGood files:\n${good.map(x => `  ${x.name} ${(x.size/1024).toFixed(0)}KB`).join("\n")}`;
fs.writeFileSync("scripts/img-status.txt", out);
