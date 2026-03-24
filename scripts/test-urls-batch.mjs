/**
 * Batch-test URLs for puppeteer friendliness.
 * Prints GOOD/BAD + size for each URL.
 */
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteerExtra.use(StealthPlugin());

const urls = [
  // Batch 1: proven working
  "https://www.awwwards.com",
  "https://dribbble.com",
  "https://www.behance.net",
  // Batch 2: SaaS / Tech
  "https://github.com",
  "https://stripe.com",
  "https://vercel.com",
  "https://supabase.com",
  "https://tailwindcss.com",
  "https://nextjs.org",
  "https://slack.com",
  "https://www.atlassian.com",
  "https://www.twilio.com",
  "https://www.datadog.com",
  "https://www.sentry.io",
  "https://www.postman.com",
  // Batch 3: Corporate
  "https://www.mckinsey.com",
  "https://www.pwc.com",
  "https://www.blackrock.com",
  "https://www.kpmg.com",
  "https://www.accenture.com",
  "https://www.weforum.org",
  // Batch 4: Tourism / Hospitality
  "https://www.lonelyplanet.com",
  "https://www.nationalgeographic.com/travel",
  "https://www.timeout.com",
  "https://www.cntraveler.com",
  "https://www.hotels.com",
  "https://www.kayak.com",
  "https://www.expedia.com",
  // Batch 5: Healthcare
  "https://www.webmd.com",
  "https://www.healthline.com",
  "https://www.mayoclinic.org",
  "https://www.everydayhealth.com",
  // Batch 6: Real Estate
  "https://www.zillow.com",
  "https://www.redfin.com",
  "https://www.realtor.com",
  "https://www.apartments.com",
  // Batch 7: Fashion
  "https://www.vogue.com",
  "https://www.net-a-porter.com",
  "https://www.farfetch.com",
  "https://www.ssense.com",
  "https://www.asos.com",
  // Batch 8: Food
  "https://www.bonappetit.com",
  "https://www.eater.com",
  "https://www.epicurious.com",
  "https://www.seriouseats.com",
  "https://www.thekitchn.com",
  // Batch 9: Creative
  "https://www.figma.com",
  "https://www.canva.com",
  "https://www.adobe.com",
  "https://www.sketch.com",
  "https://www.framer.com",
  // Batch 10: 3D / WebGL
  "https://threejs.org",
  "https://www.unrealengine.com",
  "https://www.blender.org",
  "https://www.sketchfab.com",
];

async function main() {
  const browser = await puppeteerExtra.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const results = [];

  for (const url of urls) {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      const buf = await page.screenshot({ type: "webp", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      const kb = (buf.length / 1024).toFixed(1);
      const good = buf.length > 15000;
      results.push({ url, kb: parseFloat(kb), good });
      console.log(`${good ? "GOOD" : "BAD "}  ${kb.padStart(6)} KB  ${url}`);
    } catch (e) {
      results.push({ url, kb: 0, good: false });
      console.log(`FAIL  ${"0".padStart(6)} KB  ${url}  (${e.message.slice(0, 50)})`);
    }
    await page.close();
  }

  await browser.close();

  const goodUrls = results.filter(r => r.good);
  console.log(`\n${goodUrls.length}/${urls.length} URLs produced usable screenshots`);
}

main();
