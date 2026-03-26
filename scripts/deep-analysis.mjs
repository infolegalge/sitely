import 'dotenv/config';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const H = {
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY
};
const base = 'https://gjjtxkwycehvdwqwvurw.supabase.co/rest/v1/companies';

async function run() {
  // 1. Name length distribution
  console.log('═══════════════════════════════════════');
  console.log('1. COMPANY NAME LENGTH ANALYSIS');
  console.log('═══════════════════════════════════════');
  const resp = await fetch(base + '?select=name,phone,email,address,website,rating,reviews_count,category,metadata&limit=500', { headers: { ...H, 'Range': '0-499' } });
  const all = await resp.json();
  if (!Array.isArray(all)) { console.log('Response:', JSON.stringify(all).substring(0, 200)); return; }
  console.log(`Total companies fetched: ${all.length}`);
  
  const names = all.map(c => {
    const gmName = c.metadata?.gm?.name;
    return { 
      dbName: c.name, 
      gmName: gmName,
      usedName: gmName || c.name,
      dbLen: c.name?.length || 0,
      gmLen: gmName?.length || 0,
      usedLen: (gmName || c.name)?.length || 0
    };
  });
  
  names.sort((a, b) => b.usedLen - a.usedLen);
  
  console.log('\nTOP 15 LONGEST (used in template):');
  names.slice(0, 15).forEach(n => console.log(`  [${n.usedLen} chars] "${n.usedName.substring(0, 80)}${n.usedName.length > 80 ? '...' : ''}"`));
  
  console.log('\nTOP 10 SHORTEST:');
  names.filter(n => n.usedLen > 0).sort((a, b) => a.usedLen - b.usedLen).slice(0, 10).forEach(n => console.log(`  [${n.usedLen} chars] "${n.usedName}"`));
  
  const gmLong = names.filter(n => n.gmLen > 30);
  console.log(`\nCompanies with gm.name > 30 chars: ${gmLong.length}`);
  console.log(`Companies with gm.name > 50 chars: ${names.filter(n => n.gmLen > 50).length}`);
  console.log(`Companies with gm.name > 80 chars: ${names.filter(n => n.gmLen > 80).length}`);
  
  // Compare gm.name vs db.name
  const gmVsDb = names.filter(n => n.gmName && n.gmLen > n.dbLen * 2);
  console.log(`\nCompanies where gm.name is 2x+ longer than db.name: ${gmVsDb.length}`);
  gmVsDb.slice(0, 5).forEach(n => console.log(`  DB: "${n.dbName}" (${n.dbLen}) → GM: "${n.gmName.substring(0, 60)}..." (${n.gmLen})`));
  
  // 2. Phone number formats
  console.log('\n═══════════════════════════════════════');
  console.log('2. PHONE NUMBER FORMAT ANALYSIS');
  console.log('═══════════════════════════════════════');
  const phones = all.map(c => c.phone).filter(Boolean);
  const phoneLens = phones.map(p => p.length);
  console.log(`Total with phone: ${phones.length}/${all.length}`);
  console.log(`Min length: ${Math.min(...phoneLens)}, Max: ${Math.max(...phoneLens)}`);
  
  // Multiple phones (contains comma, /, ;)
  const multiPhone = phones.filter(p => /[,;\/]/.test(p));
  console.log(`Multi-phone (contains , ; /): ${multiPhone.length}`);
  multiPhone.slice(0, 10).forEach(p => console.log(`  "${p}" (${p.length} chars)`));
  
  // Phone formats
  const formats = {};
  phones.forEach(p => {
    if (p.startsWith('+995')) formats['+995xxx'] = (formats['+995xxx'] || 0) + 1;
    else if (p.startsWith('0')) formats['0xxx'] = (formats['0xxx'] || 0) + 1;
    else if (p.startsWith('5') || p.startsWith('2')) formats['local'] = (formats['local'] || 0) + 1;
    else formats['other'] = (formats['other'] || 0) + 1;
  });
  console.log('Formats:', formats);
  
  // Very long phone strings
  phones.filter(p => p.length > 20).forEach(p => console.log(`  LONG PHONE: "${p}" (${p.length})`));
  
  // 3. Address lengths
  console.log('\n═══════════════════════════════════════');
  console.log('3. ADDRESS LENGTH ANALYSIS');
  console.log('═══════════════════════════════════════');
  const addrs = all.map(c => c.metadata?.gm?.address || c.address).filter(Boolean);
  const addrLens = addrs.map(a => a.length);
  console.log(`Total with address: ${addrs.length}`);
  console.log(`Min: ${Math.min(...addrLens)}, Max: ${Math.max(...addrLens)}, Avg: ${Math.round(addrLens.reduce((a,b)=>a+b,0)/addrLens.length)}`);
  addrs.filter(a => a.length > 60).slice(0, 5).forEach(a => console.log(`  LONG: "${a}" (${a.length})`));
  addrs.filter(a => a.length < 10).slice(0, 5).forEach(a => console.log(`  SHORT: "${a}" (${a.length})`));
  
  // 4. Category analysis
  console.log('\n═══════════════════════════════════════');
  console.log('4. CATEGORY ANALYSIS');
  console.log('═══════════════════════════════════════');
  const cats = all.map(c => c.category).filter(Boolean);
  const catLens = cats.map(c => c.length);
  console.log(`With category: ${cats.length}/${all.length}`);
  console.log(`Without category: ${all.filter(c => !c.category).length}`);
  console.log(`Min: ${Math.min(...catLens)}, Max: ${Math.max(...catLens)}`);
  cats.filter(c => c.length > 30).forEach(c => console.log(`  LONG: "${c}"`));
  
  // Unique categories
  const uniqCats = [...new Set(cats)];
  console.log(`Unique categories: ${uniqCats.length}`);
  
  // 5. Description analysis
  console.log('\n═══════════════════════════════════════');
  console.log('5. DESCRIPTION ANALYSIS');
  console.log('═══════════════════════════════════════');
  const descs = all.map(c => {
    const gm = c.metadata?.gm || {};
    const yell = c.metadata?.yell || {};
    return gm.description || yell.description || '';
  });
  const noDesc = descs.filter(d => !d || d.length === 0).length;
  const emptyStr = descs.filter(d => d === '').length;
  const withDesc = descs.filter(d => d && d.length > 0);
  console.log(`No description: ${noDesc}/${all.length}`);
  console.log(`Empty string: ${emptyStr}`);
  if (withDesc.length) {
    const dLens = withDesc.map(d => d.length);
    console.log(`With desc - Min: ${Math.min(...dLens)}, Max: ${Math.max(...dLens)}, Avg: ${Math.round(dLens.reduce((a,b)=>a+b,0)/dLens.length)}`);
  }
  
  // 6. Review analysis
  console.log('\n═══════════════════════════════════════');
  console.log('6. REVIEW DATA ANALYSIS');
  console.log('═══════════════════════════════════════');
  let totalReviews = 0;
  let maxRevLen = 0;
  let minRevLen = 99999;
  let authorLens = [];
  let reviewRatings = {};
  let noReviews = 0;
  let dupReviews = 0;
  
  all.forEach(c => {
    const gm = c.metadata?.gm || {};
    const revs = gm.reviews || [];
    if (revs.length === 0) { noReviews++; return; }
    
    totalReviews += revs.length;
    
    // Check duplicates
    const seen = new Set();
    revs.forEach(r => {
      const key = r.author + '|' + (r.text || '').substring(0, 50);
      if (seen.has(key)) dupReviews++;
      seen.add(key);
      
      if (r.text) {
        if (r.text.length > maxRevLen) maxRevLen = r.text.length;
        if (r.text.length < minRevLen) minRevLen = r.text.length;
      }
      if (r.author) authorLens.push(r.author.length);
      reviewRatings[r.rating] = (reviewRatings[r.rating] || 0) + 1;
    });
  });
  
  console.log(`Companies without reviews: ${noReviews}/${all.length}`);
  console.log(`Total review entries: ${totalReviews}`);
  console.log(`Duplicate reviews: ${dupReviews}`);
  console.log(`Review text - Min: ${minRevLen}, Max: ${maxRevLen}`);
  console.log(`Author name lengths - Min: ${Math.min(...authorLens)}, Max: ${Math.max(...authorLens)}`);
  console.log(`Rating distribution:`, reviewRatings);
  
  // Long author names
  all.forEach(c => {
    const revs = c.metadata?.gm?.reviews || [];
    revs.forEach(r => {
      if (r.author && r.author.length > 25) console.log(`  LONG AUTHOR: "${r.author}" (${r.author.length})`);
    });
  });
  
  // 7. Images analysis
  console.log('\n═══════════════════════════════════════');
  console.log('7. IMAGE ANALYSIS');
  console.log('═══════════════════════════════════════');
  const imgCounts = all.map(c => (c.metadata?.gm?.image_urls || []).length);
  const noImgs = imgCounts.filter(n => n === 0).length;
  console.log(`No images: ${noImgs}/${all.length}`);
  console.log(`Image count distribution:`);
  const imgDist = {};
  imgCounts.forEach(n => { imgDist[n] = (imgDist[n] || 0) + 1; });
  Object.keys(imgDist).sort((a,b) => a-b).forEach(k => console.log(`  ${k} images: ${imgDist[k]} companies`));
  
  // 8. Rating edge cases
  console.log('\n═══════════════════════════════════════');
  console.log('8. RATING EDGE CASES');
  console.log('═══════════════════════════════════════');
  const ratings = all.map(c => c.rating);
  const ratingDist = {};
  ratings.forEach(r => { ratingDist[r === null ? 'null' : r === undefined ? 'undef' : r] = (ratingDist[r === null ? 'null' : r === undefined ? 'undef' : r] || 0) + 1; });
  console.log('Rating distribution:', ratingDist);
  console.log(`Rating = 0: ${ratings.filter(r => r === 0).length}`);
  console.log(`Rating = null: ${ratings.filter(r => r === null).length}`);
  console.log(`Rating undefined: ${ratings.filter(r => r === undefined).length}`);
  console.log(`Rating with decimals: ${ratings.filter(r => r && r % 1 !== 0).length}`);
  
  // 9. Working hours analysis
  console.log('\n═══════════════════════════════════════');
  console.log('9. WORKING HOURS ANALYSIS');
  console.log('═══════════════════════════════════════');
  let hrsString = 0, hrsObject = 0, hrsArray = 0, hrsNull = 0;
  let hrsSamples = [];
  all.forEach(c => {
    const wh = c.metadata?.gm?.working_hours;
    const yellWh = c.metadata?.yell?.working_hours;
    const used = wh || yellWh;
    if (!used) { hrsNull++; return; }
    if (typeof used === 'string') { hrsString++; if (hrsSamples.length < 5) hrsSamples.push({ name: c.name, val: used.substring(0, 100) }); }
    else if (Array.isArray(used)) hrsArray++;
    else hrsObject++;
  });
  console.log(`String: ${hrsString}, Object: ${hrsObject}, Array: ${hrsArray}, Null: ${hrsNull}`);
  console.log('String samples:');
  hrsSamples.forEach(s => console.log(`  ${s.name}: "${s.val}"`));
  
  // Check yell working hours format
  let yellHrsSamples = [];
  all.forEach(c => {
    const yellWh = c.metadata?.yell?.working_hours;
    if (yellWh && typeof yellWh === 'object' && !Array.isArray(yellWh)) {
      if (yellHrsSamples.length < 3) yellHrsSamples.push({ name: c.name, val: JSON.stringify(yellWh).substring(0, 200) });
    }
  });
  if (yellHrsSamples.length) {
    console.log('Yell working_hours object samples:');
    yellHrsSamples.forEach(s => console.log(`  ${s.name}: ${s.val}`));
  }
  
  // 10. Website analysis
  console.log('\n═══════════════════════════════════════');
  console.log('10. WEBSITE ANALYSIS');
  console.log('═══════════════════════════════════════');
  const sites = all.filter(c => c.website);
  console.log(`With website: ${sites.length}/${all.length}`);
  const longSites = sites.filter(c => c.website.length > 40);
  console.log(`Long URLs (>40): ${longSites.length}`);
  longSites.slice(0, 5).forEach(c => console.log(`  "${c.website}" (${c.website.length})`));
  
  // 11. Email analysis
  console.log('\n═══════════════════════════════════════');
  console.log('11. EMAIL ANALYSIS');
  console.log('═══════════════════════════════════════');
  const emails = all.filter(c => c.email).map(c => c.email);
  console.log(`With email: ${emails.length}/${all.length}`);
  const longEmails = emails.filter(e => e.length > 30);
  console.log(`Long emails (>30): ${longEmails.length}`);
  longEmails.slice(0, 5).forEach(e => console.log(`  "${e}" (${e.length})`));
  
  // Multi-email
  const multiEmail = emails.filter(e => /[,;]/.test(e));
  console.log(`Multi-email: ${multiEmail.length}`);
  multiEmail.slice(0, 5).forEach(e => console.log(`  "${e}"`));
  
  // 12. Social links analysis
  console.log('\n═══════════════════════════════════════');
  console.log('12. SOCIAL LINKS ANALYSIS');
  console.log('═══════════════════════════════════════');
  let hasFb = 0, hasIg = 0, hasYt = 0, hasWa = 0, hasViber = 0, noSocial = 0;
  all.forEach(c => {
    const s = c.metadata?.social || {};
    if (s.facebook) hasFb++;
    if (s.instagram) hasIg++;
    if (s.youtube) hasYt++;
    if (s.whatsapp) hasWa++;
    if (s.viber) hasViber++;
    if (!s.facebook && !s.instagram && !s.youtube) noSocial++;
  });
  console.log(`Facebook: ${hasFb}, Instagram: ${hasIg}, YouTube: ${hasYt}, WhatsApp: ${hasWa}, Viber: ${hasViber}`);
  console.log(`No social at all: ${noSocial}`);
  
  // 13. Georgian vs Latin names
  console.log('\n═══════════════════════════════════════');
  console.log('13. LANGUAGE ANALYSIS');
  console.log('═══════════════════════════════════════');
  const geoRegex = /[\u10A0-\u10FF]/;
  const gmNames = all.map(c => c.metadata?.gm?.name).filter(Boolean);
  const geoGmNames = gmNames.filter(n => geoRegex.test(n));
  const latGmNames = gmNames.filter(n => !geoRegex.test(n));
  console.log(`GM names - Georgian: ${geoGmNames.length}, Latin only: ${latGmNames.length}`);
  console.log(`Mixed (geo+lat): ${gmNames.filter(n => geoRegex.test(n) && /[a-zA-Z]/.test(n)).length}`);
  geoGmNames.filter(n => n.length > 40).slice(0, 5).forEach(n => console.log(`  LONG GEO: "${n.substring(0, 60)}" (${n.length})`));
  
  // DB names
  const dbNames = all.map(c => c.name).filter(Boolean);
  const geoDbNames = dbNames.filter(n => geoRegex.test(n));
  console.log(`DB names - Georgian: ${geoDbNames.length}, Latin: ${dbNames.length - geoDbNames.length}`);
}

run().catch(console.error);
