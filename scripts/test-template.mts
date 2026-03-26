import { createClient } from '@supabase/supabase-js';

// Dynamic import to work around moduleResolution issues
const engineModule = await import('../src/lib/template-engine.ts');
const { buildCompanyData, compileTemplate } = engineModule;

import 'dotenv/config';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(
  'https://gjjtxkwycehvdwqwvurw.supabase.co',
  KEY
);

const [tplRes, coRes] = await Promise.all([
  sb.from('templates').select('html_content, fallback_images').eq('id', 'd116f16e-68a8-458c-8ab3-4a62cc1f0b6f').single(),
  sb.from('companies').select('*').eq('id', 'd107c1d6-d6a1-4b6d-b163-575049548b82').single(),
]);

if (!tplRes.data || !coRes.data) {
  console.error('Failed to fetch data');
  process.exit(1);
}

// Read template from local file instead of DB (since we haven't pushed yet)
const fs = await import('fs');
const localTemplate = fs.readFileSync('src/lib/templates/dental-luxe-3d.hbs', 'utf8');

const data = buildCompanyData(coRes.data as any, tplRes.data.fallback_images || []);
console.log('=== COMPILED DATA ===');
console.log('company_name:', data.company_name);
console.log('company_name_class:', data.company_name_class);
console.log('categories:', JSON.stringify(data.categories));
console.log('phone:', data.phone);
console.log('phone_display:', data.phone_display);
console.log('rating:', data.rating);
console.log('review_count:', data.review_count);
console.log('working_hours:', JSON.stringify(data.working_hours));
console.log('working_hours_text:', data.working_hours_text);
console.log('reviews:', data.reviews.length, 'reviews');
console.log('review_snippets:', data.review_snippets.length, 'snippets');
console.log('google_maps_url:', data.google_maps_url ? 'YES' : 'NO');
console.log('menu_link:', data.menu_link || 'none');
console.log('lat:', data.lat, 'lng:', data.lng);
console.log('social:', JSON.stringify(data.social));

// Check owner responses
const withOwner = data.reviews.filter(r => r.owner_response.length > 0);
console.log('Reviews with owner response:', withOwner.length);

const html = compileTemplate(localTemplate, data);
console.log('\n=== RENDER RESULT ===');
console.log('HTML length:', html.length);
console.log('Has DOCTYPE:', html.startsWith('<!DOCTYPE'));
console.log('Has </html>:', html.includes('</html>'));
console.log('Has JSON-LD:', html.includes('application/ld+json'));
console.log('Has og:title:', html.includes('og:title'));
console.log('Has cat-tags:', html.includes('cat-tag'));
console.log('Has about-quote:', html.includes('about-quote'));
console.log('Has gm-btn:', html.includes('gm-btn'));
console.log('Has owner-resp:', html.includes('owner-resp'));
console.log('Has wh-text:', html.includes('wh-text') || html.includes('hrs-row'));
console.log('Has name-short:', html.includes('name-short'));
console.log('Has rev-grid:', html.includes('rev-grid'));

// Check for unresolved Handlebars
const unresolved = html.match(/\{\{[^}]+\}\}/g);
console.log('Unresolved Handlebars:', unresolved ? unresolved.length : 0);
if (unresolved) console.log('  Examples:', unresolved.slice(0, 10));

console.log('\n=== TEST PASSED ===');
