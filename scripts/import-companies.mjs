import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_FILE = 'prioritized_2026-03-22T18-18-47 (1).json';
const BATCH_SIZE = 500;

function slugify(name, id) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  return `${base || 'company'}-${id}`.substring(0, 80);
}

function mapRecord(item) {
  const yellId = item.yellId || `gm_${item.gm_placeId}`;
  const slug = slugify(item.name || item.gm_name || 'unknown', yellId);

  // Prefer Google Maps data, fall back to Yell.ge
  const rating = item.gm_rating != null ? item.gm_rating : parseFloat(item.rating) || null;
  const reviewsCount = item.gm_reviewsCount != null ? item.gm_reviewsCount : parseInt(item.reviews) || null;
  const lat = item.gm_lat != null ? parseFloat(item.gm_lat) : parseFloat(item.lat) || null;
  const lng = item.gm_lng != null ? parseFloat(item.gm_lng) : parseFloat(item.lng) || null;

  return {
    yell_id: yellId,
    name: item.name || item.gm_name || 'Unknown',
    slug,
    tier: item._tier ?? null,
    tier_label: item._tierLabel || null,
    score: item._score ?? null,
    email: item.emails || null,
    phone: item.phones || item.gm_phone || null,
    website: item.website || item.gm_website || null,
    address: item.address || item.gm_address || null,
    category: item.gm_category || null,
    categories: item.categories || null,
    source_category: item.sourceCategory || null,
    rating,
    reviews_count: reviewsCount,
    lat,
    lng,
    gm_place_id: item.gm_placeId || null,
    status: 'new',
    metadata: {
      social: {
        facebook: item.facebook || '',
        instagram: item.instagram || '',
        youtube: item.youtube || '',
        whatsapp: item.whatsapp || '',
        viber: item.viber || '',
      },
      yell: {
        url: item.yellUrl || '',
        rating: item.rating || '',
        reviews: item.reviews || '',
        description: item.description || '',
        working_hours: item.workingHours || '',
        identification_number: item.identificationNumber || '',
        legal_name: item.legalName || '',
        source_category_id: item.sourceCategoryId || '',
      },
      gm: {
        name: item.gm_name || '',
        phone: item.gm_phone || '',
        website: item.gm_website || '',
        address: item.gm_address || '',
        working_hours: item.gm_workingHours || '',
        plus_code: item.gm_plusCode || '',
        description: item.gm_description || '',
        price_level: item.gm_priceLevel || '',
        all_categories: item.gm_allCategories || [],
        image_urls: item.gm_imageUrls || [],
        social_links: item.gm_socialLinks || [],
        menu_link: item.gm_menuLink || '',
        booking_link: item.gm_bookingLink || '',
        url: item.gm_url || '',
        services: item.gm_services || [],
        amenities: item.gm_amenities || [],
        accessibility: item.gm_accessibility || [],
        reviews: item.gm_reviews || [],
        review_snippets: item.gm_reviewSnippets || [],
        matched: item.gm_matched ?? false,
        match_score: item.gm_matchScore ?? 0,
        phone_match: item.gm_phoneMatch ?? false,
        enriched_at: item.gm_enrichedAt || '',
        enrich_method: item.gm_enrichMethod || '',
      },
      source: item._source || '',
    },
  };
}

async function importData() {
  console.log('📂 Reading JSON data...');
  const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  console.log(`📊 Total records: ${raw.length}`);

  // Check for slug uniqueness — add index suffix for duplicates
  const slugMap = new Map();
  const records = raw.map((item) => {
    const rec = mapRecord(item);
    if (slugMap.has(rec.slug)) {
      const count = slugMap.get(rec.slug) + 1;
      slugMap.set(rec.slug, count);
      rec.slug = `${rec.slug}-${count}`;
    } else {
      slugMap.set(rec.slug, 1);
    }
    return rec;
  });

  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  let inserted = 0;
  let errors = 0;

  console.log(`🚀 Importing in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const { error, count } = await supabase
      .from('companies')
      .upsert(batch, { onConflict: 'yell_id', ignoreDuplicates: false })
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
      // Try individual inserts for failed batch
      for (const rec of batch) {
        const { error: singleErr } = await supabase
          .from('companies')
          .upsert(rec, { onConflict: 'yell_id' });
        if (singleErr) {
          console.error(`  ⚠️ Failed: ${rec.name} (${rec.yell_id}): ${singleErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      if (batchNum % 5 === 0 || batchNum === totalBatches) {
        console.log(`✅ Batch ${batchNum}/${totalBatches} — ${inserted} inserted, ${errors} errors`);
      }
    }
  }

  console.log(`\n🏁 Import complete!`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Verify count
  const { count: dbCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  console.log(`   📊 Total in DB: ${dbCount}`);
}

importData().catch(console.error);
