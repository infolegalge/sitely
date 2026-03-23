import fs from "fs";

const names = ["darknode", "springs", "planetono", "particolare"];
for (const n of names) {
  const f = `public/images/projects/${n}.jpg`;
  const buf = fs.readFileSync(f);
  const hex = buf.subarray(0, 4).toString("hex");
  const type = hex.startsWith("ffd8")
    ? "JPEG"
    : hex.startsWith("8950")
      ? "PNG"
      : hex.startsWith("3c")
        ? "HTML/SVG"
        : "unknown:" + hex;
  console.log(`${n}: ${(buf.length / 1024).toFixed(0)}KB  ${type}`);
  if (type === "HTML/SVG") {
    console.log("  First 200 chars:", buf.subarray(0, 200).toString("utf8"));
  }
}
