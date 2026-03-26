import 'dotenv/config';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const H = {
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY
};
const base = 'https://gjjtxkwycehvdwqwvurw.supabase.co/rest/v1/companies';

// 1) Deep-dive SMILE
const smile = await fetch(base + '?id=eq.e5932d5f-5cf0-450e-83c5-4416ef2806b5&select=*', { headers: H }).then(r => r.json());
const c = smile[0];
const gm = c.metadata?.gm || {};
const yell = c.metadata?.yell || {};

console.log('=== SMILE DEEP DIVE ===');
console.log('review_count (top-level):', c.review_count);
console.log('gm keys:', Object.keys(gm).join(', '));
console.log('metadata keys:', Object.keys(c.metadata || {}).join(', '));
console.log('gm.review_count:', gm.review_count);
console.log('gm.total_reviews:', gm.total_reviews);
console.log('review snippet [0]:', JSON.stringify(gm.review_snippets?.[0]));
console.log('working_hours type:', typeof gm.working_hours, 'isArr:', Array.isArray(gm.working_hours));
if (gm.working_hours) console.log('working_hours:', JSON.stringify(gm.working_hours).substring(0, 300));
console.log('description length:', gm.description?.length);
console.log('description sample:', gm.description?.substring(0, 200));
console.log('social:', JSON.stringify(c.metadata?.social));
console.log('gm.phone:', gm.phone);
console.log('gm.address:', gm.address);
console.log('gm.name:', gm.name);

// 2) Check a company with rating=0
console.log('\n=== UNIVERSAL DENT (rating=0) ===');
const ud = await fetch(base + '?name=eq.UNIVERSAL DENT&select=*', { headers: H }).then(r => r.json());
if (ud[0]) {
  const g2 = ud[0].metadata?.gm || {};
  console.log('review_count:', ud[0].review_count);
  console.log('rating:', ud[0].rating);
  console.log('reviews length:', (g2.review_snippets || []).length);
  console.log('description:', g2.description?.substring(0, 100));
}

// 3) Check some companies with possibly NO description
console.log('\n=== COMPANIES WITHOUT DESCRIPTION ===');
const all = await fetch(base + '?or=(category.ilike.%25dental%25,category.ilike.%25dentist%25)&select=name,metadata&limit=30', { headers: H }).then(r => r.json());
for (const co of all) {
  const g = co.metadata?.gm || {};
  const y = co.metadata?.yell || {};
  if (!g.description && !y.description) {
    console.log('  NO DESC:', co.name);
  }
}
console.log('Total dental companies checked:', all.length);

// 4) Check name issues - very long names
console.log('\n=== LONG NAMES ===');
for (const co of all) {
  if (co.name.length > 25) console.log('  LONG:', co.name, '(' + co.name.length + ' chars)');
}

// 5) Check working_hours structure  
console.log('\n=== WORKING HOURS STRUCTURE ===');
if (gm.working_hours) {
  if (Array.isArray(gm.working_hours)) {
    console.log('Array format, first:', JSON.stringify(gm.working_hours[0]));
  } else {
    console.log('Object format, keys:', Object.keys(gm.working_hours).join(', '));
    const firstKey = Object.keys(gm.working_hours)[0];
    console.log('Sample:', firstKey, '=>', gm.working_hours[firstKey]);
  }
}

// Check another company's working hours
const sec = await fetch(base + '?name=eq.SECTOR&select=metadata', { headers: H }).then(r => r.json());
if (sec[0]) {
  const g3 = sec[0].metadata?.gm || {};
  if (g3.working_hours) {
    console.log('SECTOR hours type:', typeof g3.working_hours, 'isArr:', Array.isArray(g3.working_hours));
    console.log('SECTOR hours:', JSON.stringify(g3.working_hours).substring(0, 300));
  }
}
