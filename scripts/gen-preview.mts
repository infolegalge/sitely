import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const { buildCompanyData, compileTemplate } = await import('../src/lib/template-engine.ts');

import 'dotenv/config';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(
  'https://gjjtxkwycehvdwqwvurw.supabase.co',
  KEY
);

const companyId = process.argv[2] || 'e5932d5f-5cf0-450e-83c5-4416ef2806b5'; // SMILE dental
const templateId = 'd116f16e-68a8-458c-8ab3-4a62cc1f0b6f';

const [tplRes, coRes] = await Promise.all([
  sb.from('templates').select('html_content, fallback_images').eq('id', templateId).single(),
  sb.from('companies').select('*').eq('id', companyId).single(),
]);

if (!tplRes.data || !coRes.data) {
  console.error('Company or template not found');
  process.exit(1);
}

const tpl = fs.readFileSync('src/lib/templates/concept-c-kinetic.hbs', 'utf8');
const data = buildCompanyData(coRes.data as any, tplRes.data.fallback_images || []);
const html = compileTemplate(tpl, data);

const filename = `preview-${data.company_name.toLowerCase().replace(/\s+/g, '-')}.html`;
fs.writeFileSync(filename, html);
console.log(`Saved: ${filename}`);
console.log(`Company: ${data.company_name}`);
console.log(`Reviews: ${data.reviews.length}`);
console.log(`Size: ${html.length} chars`);
