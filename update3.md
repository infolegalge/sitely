# Sitely CRM / CMS — Master Execution Plan v3

ეს დოკუმენტი არის Sitely-ის განვითარების საბოლოო, ქრონოლოგიური და ტექნიკურად ზუსტი გეგმა. თითოეული ეტაპი აღწერს **რა** უნდა გაკეთდეს, **რატომ**, **სად** (კონკრეტული ფაილები), **როგორ** ტესტირდება და **როგორ** ბრუნდება უკან თუ რამე ჩაიშალა.

> **პრინციპი:** არცერთი ეტაპი არ იწყება წინას ტესტების გარეშე. ყველა DB ცვლილებას თან ახლავს Migration + Rollback SQL.

---

## ეტაპი 1: Auth და Middleware — Fail-Closed უსაფრთხოება

**მიზანი:** სანამ სისტემას გავაფართოვებთ, უნდა დაიხუროს ყველა კრიტიკული ხვრელი.

### 1.1 Middleware Protection (root `middleware.ts`)

**პრობლემა:** ამჟამად `SecureAccessLayout` (Server Component) ამოწმებს სესიას — მაგრამ Layout-ში Early Return-ით შესაძლოა Child Components მაინც დარენდერდეს (Privilege Escalation).

**გამოსწორება:**
- root `middleware.ts`-ში (უკვე არსებობს `src/lib/supabase/middleware.ts`, მაგრამ ამჟამად მხოლოდ redirect-ს აკეთებს) დაემატოს **ტყვიაგაუმტარი** ავტორიზაციის შემოწმება:
  - Edge-ზე ვკითხულობთ `supabase.auth.getUser()` (არა `getSession()` — session JWT შეიძლება ვადაგასული იყოს).
  - ვამოწმებთ `user.app_metadata.role === 'super_admin'` (და **არა** `user_metadata` — რადგან `user_metadata`-ს მომხმარებელი თავად ცვლის `supabase.auth.updateUser()`-ით).
  - თუ ვერ გაიარა — `NextResponse.redirect('/secure-access/login')`.
  - თუ route არ არის `/secure-access/*` — middleware არაფერს აკეთებს (Performance).

**ფაილები:**
- `middleware.ts` (root) — routing config + matcher
- `src/lib/supabase/middleware.ts` — auth logic refactor
- `src/lib/auth.ts` — `verifyAdmin()` ფუნქცია: `user_metadata` → `app_metadata`-ზე გადასვლა

**შეუსაბამობის Rollback:**
- Supabase Dashboard-ში: `auth.users`-ის `raw_app_meta_data` ველში ხელით ან SQL-ით `{"role": "super_admin"}` მინიჭება არსებულ ადმინ ანგარიშებზე, რომ middleware-მ არ დაბლოკოს:
  ```sql
  UPDATE auth.users 
  SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
  WHERE email = 'your@email.com';
  ```

### 1.2 Service Role Client-ის მოხსნა საჯარო Route-დან

**პრობლემა:** `src/app/demo/[hash]/route.ts` იყენებს `createServiceRoleClient()` — ეს RLS-ს ავლაგდება და საჯარო endpoint-ზე სრულ DB წვდომას ხსნის.

**გამოსწორება:**
- შევქმნათ Anonymous (non-authenticated) Supabase client ან `createServerClient()` (cookie-based, RLS-ით).
- Supabase-ში `demos` ცხრილზე RLS policy: `SELECT` ნებადართულია `anon` role-სთვის, `hash`-ით ფილტრაციით.
- View Count-ის მომატება და სხვა write ოპერაციები გადავიტანოთ `waitUntil()`-ში (Next.js 15+ API) — Serverless function პასუხს გასცემს, მაგრამ write-ს ფონურად ასრულებს.

**`waitUntil()` შეზღუდვა:** ეს API მხოლოდ Vercel-სა და Edge Runtime-ში მუშაობს. თუ self-hosted გარემო დაგვჭირდა, ალტერნატივა: `process.nextTick()` wrapper ან fire-and-forget `fetch()` შიდა API endpoint-ზე.

**RLS Policy SQL:**
```sql
-- demos: ნებისმერ ადამიანს (anon) შეუძლია hash-ით წაიკითხოს
CREATE POLICY "Public demo read by hash" ON demos
  FOR SELECT USING (true);

-- demos: მხოლოდ authenticated + super_admin-ს შეუძლია ჩაწერა
CREATE POLICY "Admin demo write" ON demos
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
```

### 1.3 ტესტირება (ეტაპი 1)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `middleware.test.ts` | Unit | არაავტორიზებული request → redirect; ვალიდური admin → pass-through; `user_metadata` role → rejected |
| `demo-route.test.ts` | Integration | Service Role აღარ გამოიყენება; RLS policy ამუშავდა; view_count ფონურად იმატებს |
| Manual QA | E2E | ბრაუზერიდან `/secure-access/dashboard`-ზე პირდაპირი URL → redirect login-ზე |

---

## ეტაპი 2: მონაცემთა ბაზის ჰიგიენა და სტრუქტურა

**მიზანი:** 22,000+ ჩანაწერის სწრაფი ფილტრაციისა და Sales Pipeline-ის აწყობა.

### 2.1 Migration Framework

**გამოსწორება:** ყველა DB ცვლილება Supabase Migration ფაილებით (`supabase/migrations/`), რომ:
- ვერსიონირება მოხდეს Git-ში
- Rollback SQL ყოველთვის თან ახლდეს
- `supabase db push` ან `supabase migration up` — ერთი ბრძანებით deploy

### 2.2 სტატუსების გაფართოება

**ახლანდელი:** `new` → `demo_generated` → `demo_sent` → `interested`

**ახალი Pipeline:**
```
lead → locked → demo_ready → contacted → engaged → converted → dnc
```

| სტატუსი | მნიშვნელობა | ვინ ადგენს |
|---------|-------------|-----------|
| `lead` | ახალი, დაუმუშავებელი | Default (იმპორტის დროს) |
| `locked` | ადმინის მიერ "დაჭერილი", მუშავდება | ადმინი ხელით |
| `demo_ready` | HTML დაგენერირდა, მზადაა გასაგზავნად | სისტემა (generate-ის შემდეგ) |
| `contacted` | მეილი გაგზავნილია | სისტემა (email send-ის შემდეგ) |
| `engaged` | კლიენტმა ნახა (engagement_score > 0) | სისტემა (tracking-ის შემდეგ) |
| `converted` | პროექტი დაიწყო | ადმინი ხელით |
| `dnc` | Do Not Contact (bounce/unsubscribe) | სისტემა ან ადმინი |

**Migration SQL:**
```sql
-- UP
ALTER TABLE companies 
  DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE companies 
  ADD CONSTRAINT companies_status_check 
  CHECK (status IN ('lead','locked','demo_ready','contacted','engaged','converted','dnc'));

-- Migrate old statuses
UPDATE companies SET status = 'lead' WHERE status = 'new';
UPDATE companies SET status = 'demo_ready' WHERE status = 'demo_generated';
UPDATE companies SET status = 'contacted' WHERE status = 'demo_sent';
UPDATE companies SET status = 'engaged' WHERE status = 'interested';
```

```sql
-- DOWN (Rollback)
UPDATE companies SET status = 'new' WHERE status = 'lead';
UPDATE companies SET status = 'demo_generated' WHERE status IN ('locked','demo_ready');
UPDATE companies SET status = 'demo_sent' WHERE status = 'contacted';
UPDATE companies SET status = 'interested' WHERE status IN ('engaged','converted');
DELETE FROM companies WHERE status = 'dnc';

ALTER TABLE companies DROP CONSTRAINT companies_status_check;
ALTER TABLE companies ADD CONSTRAINT companies_status_check 
  CHECK (status IN ('new','demo_generated','demo_sent','interested'));
```

### 2.3 ახალი ველები

```sql
-- UP
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS secure_link_id UUID DEFAULT gen_random_uuid() UNIQUE;

-- DOWN
ALTER TABLE companies DROP COLUMN IF EXISTS last_contacted_at;
ALTER TABLE companies DROP COLUMN IF EXISTS engagement_score;
ALTER TABLE companies DROP COLUMN IF EXISTS secure_link_id;
```

### 2.4 ინდექსაცია

```sql
-- სწრაფი ფილტრაციისთვის (CMS-ის ცხრილი)
CREATE INDEX CONCURRENTLY idx_companies_status ON companies(status);
CREATE INDEX CONCURRENTLY idx_companies_category ON companies(category);
CREATE INDEX CONCURRENTLY idx_companies_status_category ON companies(status, category);
CREATE INDEX CONCURRENTLY idx_companies_engagement ON companies(engagement_score DESC);
CREATE INDEX CONCURRENTLY idx_demos_hash ON demos(hash);
CREATE INDEX CONCURRENTLY idx_demos_expires ON demos(expires_at);
```

### 2.5 Deduplication (დუბლიკატების გაერთიანება)

**კრიტერიუმი (Fuzzy Matching):**
1. **ზუსტი შესატყვისი:** ერთი და იგივე `phone` ან `email` → 100% დუბლიკატი → ავტომატური merge.
2. **სახელის მსგავსება:** `pg_trgm` extension + `similarity()` ფუნქცია (threshold ≥ 0.7) + ერთი და იგივე `category` → კანდიდატი → ადმინის დასტური CMS-ში.
3. **Merge ლოგიკა:**
   - ინახება ის ჩანაწერი, რომელსაც მეტი მონაცემი აქვს (reviews_count, metadata ველების სიმდიდრე).
   - მეორე ჩანაწერის უნიკალური ველები (მაგ: yell-ის description, gm-ის reviews) ემატება გამარჯვებულის `metadata`-ში.
   - დუბლიკატის `id` ინახება `merged_into` ველში (soft delete, არა წაშლა) — rollback-ისთვის.

```sql
-- pg_trgm extension (ერთჯერადი)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Dedup კანდიდატების მოძიება
SELECT a.id, b.id, similarity(a.name, b.name) AS sim
FROM companies a
JOIN companies b ON a.id < b.id 
  AND a.category = b.category
  AND similarity(a.name, b.name) > 0.7
ORDER BY sim DESC;
```

### 2.6 ტესტირება (ეტაპი 2)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `migration.test.ts` | Integration | UP migration რბება წარმატებით; DOWN rollback აბრუნებს ძველ სქემას |
| `dedup.test.ts` | Unit | Merge ლოგიკა ინარჩუნებს მეტ-მონაცემებიან ჩანაწერს; `merged_into` ივსება |
| Index verification | SQL | `EXPLAIN ANALYZE` ადასტურებს index scan-ს seq scan-ის ნაცვლად |

---

## ეტაპი 3: Template Engine გაძლიერება და Storage არქიტექტურა

**მიზანი:** Postgres Bloat-ის აღმოფხვრა, XSS ინექციების სრული გამორიცხვა, <100ms ჩატვირთვის მიღწევა.

### 3.1 HTML Storage-ზე გადასვლა

**პრობლემა:** `demos.html_snapshot` TEXT ველი — თითო HTML ~50-150KB. 22,000 დემო = ~2-3GB მხოლოდ ტექსტისთვის Postgres-ში.

**გამოსწორება:**
- Supabase Storage Bucket: `demo-snapshots` (public read, authenticated write).
- `demos` ცხრილში `html_snapshot` TEXT → `snapshot_url` TEXT (Storage URL).
- გენერაციის დროს (`/api/demos/generate`): HTML ატვირთულია Storage-ში → URL ინახება ბაზაში.

**Migration გეგმა (ნულოვანი Downtime):**
1. დაამატე `snapshot_url` ველი (nullable).
2. Background script: არსებული `html_snapshot`-ები ატვირთე Storage-ში, `snapshot_url` შეავსე.
3. `route.ts` ლოგიკა: სცადე `snapshot_url`-დან წაკითხვა; fallback `html_snapshot`-ზე.
4. მას შემდეგ, რაც ყველა ჩანაწერი მიგრირებულია → `html_snapshot` ველი DROP.

```sql
-- Step 1
ALTER TABLE demos ADD COLUMN snapshot_url TEXT;

-- Step 4 (მხოლოდ მიგრაციის შემდეგ)
ALTER TABLE demos DROP COLUMN html_snapshot;
```

### 3.2 XSS Prevention — Template Compilation Security

**პრობლემა:** ამჟამად `template-engine.ts` Handlebars-ს `{{{ }}}` (triple-stache, unescaped) არ იყენებს, მაგრამ `compileTemplate`-ში ხდება `html.replace('</body>', trackingScript + '</body>')` — string replacement, რომელიც XSS-ისთვის ღიაა თუ ბაზაში ბინძური მონაცემი (მაგ: review ტექსტი `<script>alert(1)</script>`) შემოვიდა.

**გამოსწორება — 2 დონის დაცვა:**

1. **Build-time injection ტეგები:**
   - `.hbs` შაბლონებში tracking script-ისა და CTA-ის ადგილი დეკლარატიულად:
     ```html
     <!-- შაბლონის ბოლოში -->
     {{> tracking_partial }}
     {{> cta_partial }}
     ```
   - Handlebars Partials სისტემა: `registerPartial('tracking_partial', safeTrackingHTML)` — კომპილაციის დროს, სანდო კოდით.
   - `html.replace()` მთლიანად ამოღებული.

2. **Data Sanitization ფენა:**
   - `buildCompanyData()` ფუნქციაში (უკვე არსებობს) ყველა user-facing string-ის sanitize:
     ```typescript
     import { escape } from 'handlebars';
     // review ტექსტი, company name, description — escaped
     const safeName = escape(company.name);
     ```
   - Handlebars-ის `{{ }}` (double-stache) ავტომატურად escape-ავს HTML-ს — ეს უკვე სწორად მუშაობს.
   - `{{{ }}}` (triple-stache) გამოიყენება **მხოლოდ** Partials-ისთვის (tracking/CTA), რომელიც build-time serverside კოდია, არა user input.

### 3.3 Route Caching (demo/[hash])

**მიმდინარე:** ყოველ request-ზე DB query + HTML read.

**გამოსწორება:**
```typescript
// demo/[hash]/route.ts
export const dynamic = 'force-static';        // ან ISR
export const revalidate = 3600;                // 1 საათი

// ალტერნატივა: generateStaticParams() + on-demand revalidation
```

- პირველი request: Storage-დან HTML-ის წაკითხვა + cache.
- მეორე+ request: Edge CDN cache → 0ms latency.
- CMS-ში ცვლილებისას: `revalidatePath('/demo/' + hash)` ან `revalidateTag('demo-' + hash)`.

### 3.4 Auto-Regeneration

CMS-ში კომპანიის შეცვლისას (`PATCH /api/companies/[id]`):
1. შეამოწმე, აქვს თუ არა აქტიური demo (`WHERE company_id = X AND status != 'expired'`).
2. თუ აქვს — regenerate: template + ახალი data → ახალი HTML → Storage-ში overwrite.
3. `revalidatePath('/demo/' + hash)` — CDN cache invalidation.

ეს ლოგიკა sync-ად ემატება `PATCH` route-ს (არა queue, რადგან ერთი კომპანიის რეგენერაცია <500ms).

### 3.5 ტესტირება (ეტაპი 3)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `template-xss.test.ts` | Unit | `<script>` ტეგი review-ში → escaped output; Partial injection მუშაობს |
| `storage-upload.test.ts` | Integration | HTML ატვირთულია Storage-ში; URL ვალიდურია; ფაილი იკითხება |
| `demo-route-cache.test.ts` | Integration | მეორე request ქეშიდან; revalidation მუშაობს |
| `auto-regen.test.ts` | Integration | company PATCH → demo HTML განახლდა |

---

## ეტაპი 4: Tracking, Bot Filtering და Rate Limiting

**მიზანი:** ზუსტი ანალიტიკა ყალბი Engagement-ის გარშე, API-ს აბიუზისგან დაცვა.

### 4.1 Bot Filtering

**პრობლემა:** Email სკანერები (Google Safe Browsing, Microsoft Defender) ავტომატურად ხსნიან ლინკებს — ეს ცრუ "page_open" ივენთს ქმნის.

**გამოსწორება (server-side, `/api/tracking`):**
```typescript
const BOT_UA_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /facebookexternalhit/i, /linkedinbot/i,
  /google-safety/i, /microsoft office/i,
  /wget/i, /curl/i, /python-requests/i
];

const isBot = (ua: string) => BOT_UA_PATTERNS.some(p => p.test(ua));
```

**Client-side Engagement Validation:**
- `engagement_score` არ იმატება `page_open`-ზე — მხოლოდ:
  - `scroll_25+` (სქროლი მოხდა)
  - `time_10s+` (10+ წამი აქტიურ ფანჯარაში — Page Visibility API)
  - `click_*` (ნებისმიერი ღილაკის კლიკი)
- ბოტები ვერ ასრულებენ ამ მოქმედებებს.

### 4.2 Event Batching (Beacon API)

**პრობლემა:** ამჟამად ყოველი ივენთი ცალ-ცალკე request-ს გზავნის.

**გამოსწორება:**
- Client-side: ივენთების დაგროვება array-ში.
- გაგზავნა 2 შემთხვევაში:
  1. ყოველ **15 წამში** (setInterval).
  2. გვერდის დატოვებისას (`visibilitychange` + `navigator.sendBeacon()`).
- სერვერი იღებს batch-ს (`event[]`) და ერთი `INSERT INTO ... VALUES (...), (...), (...)` ბრძანებით ინახავს.

**Endpoint ცვლილება:**
```typescript
// /api/tracking/route.ts
// ამჟამინდელი: { event_type, session_id, ... }
// ახალი: { events: [{ event_type, session_id, ... }, ...] }
// Backward compatibility: თუ `events` არ არის, single event-ად interpret
```

### 4.3 Rate Limiting (`/api/tracking`)

**პრობლემა:** ღია endpoint — სკრიპტით შეიძლება მილიონობით ყალბი ივენთის გაგზავნა.

**გამოსწორება:**
- **Upstash Redis** + `@upstash/ratelimit`:
  - ლიმიტი: **30 requests / IP / წუთი** (batch-ით ეს საკმარისია რეალური მომხმარებლისთვის).
  - 429 Too Many Requests → ივენთი იგნორირდება.
- **Zod Validation:**
  - `event_type` — enum (მხოლოდ ცნობილი ტიპები).
  - `session_id` — UUID format.
  - `duration_ms` — positive integer, max 600000 (10 წთ).
  - `scroll_depth` — 0-100.
  - batch max size: 50 ივენთი.

```typescript
const EventSchema = z.object({
  event_type: z.enum(['page_open','page_leave','scroll_25','scroll_50',...]),
  session_id: z.string().uuid(),
  demo_id: z.number().int().positive(),
  duration_ms: z.number().int().min(0).max(600000).optional(),
  scroll_depth: z.number().min(0).max(100).optional(),
});

const BatchSchema = z.object({
  events: z.array(EventSchema).max(50),
});
```

### 4.4 Cross-Platform Session

**მექანიზმი:**
- დემოს CTA ღილაკზე დაჭერისას (`click_sitely`), redirect URL-ში ემატება `?ref={secure_link_id}`.
- `sitely.ge`-ზე: middleware ამოწმებს `ref` parameter-ს, ბაზაში პოულობს კომპანიას `secure_link_id`-ით, აყენებს first-party cookie-ს.
- შემდეგი მოქმედებები (portfolio ნახვა, ფასების ნახვა) ინახება ამ session-ში.

### 4.5 ტესტირება (ეტაპი 4)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `bot-filter.test.ts` | Unit | Googlebot UA → event ignored; Chrome UA → event recorded |
| `rate-limit.test.ts` | Integration | 31-ე request 1 წუთში → 429; ლიმიტის შემდეგ reset |
| `batch-tracking.test.ts` | Integration | 10 ივენთიანი batch → 10 row DB-ში; 51 ივენთიანი → rejected |
| `zod-validation.test.ts` | Unit | არავალიდური event_type → 400; negative duration → 400 |

---

## ეტაპი 5: Queue სისტემა და Email Delivery

**მიზანი:** მასიური ოპერაციების (generate, send) სტაბილური შესრულება Vercel Serverless-ზე.

### 5.1 Queue ინფრასტრუქტურა — Inngest

**რატომ Inngest:**
- Vercel-ის native ინტეგრაცია (SDK + Dashboard).
- Retry, concurrency control, step functions — built-in.
- არ სჭირდება Redis ან ცალკე სერვერი.
- უფასო tier: 25,000 runs/თვეში (საკმარისი ადრეული ეტაპისთვის).

**ალტერნატივა:** Upstash QStash — უფრო მარტივი, HTTP-based. რეკომენდებულია თუ Inngest-ის step function-ები არ დაგვჭირდა.

**არქიტექტურა:**
```
CMS Admin → POST /api/demos/generate → Inngest Event: "demo/batch.generate"
  → Step 1: companies-ის fetch (50-ობით)
  → Step 2: თითოეული company-ისთვის HTML compile + Storage upload
  → Step 3: demos row insert (snapshot_url)
  → Step 4: company status → 'demo_ready'
  
CMS Admin → POST /api/email/send → Inngest Event: "email/batch.send"
  → Step 1: მეილების fetch (campaign_id-ით)
  → Step 2: Zoho SMTP გაგზავნა (throttled: 50/საათში)
  → Step 3: company status → 'contacted', last_contacted_at = now()
  → Step 4: bounce → DLQ event
```

### 5.2 Queue Command Center (CMS)

**ახალი CMS გვერდი: `/secure-access/queue`**

**კომპონენტები:**
- `QueuePage/QueuePage.tsx` — მთავარი gutter
- `QueueProgress/QueueProgress.tsx` — Live Progress Bar (Inngest API polling ან SSE)
- `QueueControls/QueueControls.tsx` — Start/Pause/Cancel ღილაკები

**Panic Button:**
- "შეჩერება" ღილაკი → Inngest `cancel` API → მიმდინარე batch ჩერდება.
- გაგზავნილი მეილები არ წაიშლება — მხოლოდ დარჩენილი რიგი ჩერდება.

**Progress მექანიზმი:**
- Inngest-ის `onStepComplete` callback → Supabase `email_campaigns.sent_count` = sent_count + 1.
- CMS: Supabase Realtime subscription `email_campaigns` ცხრილზე → UI-ში ცოცხალი counter.

### 5.3 Email Deliverability

**DNS (ერთჯერადი კონფიგურაცია):**
- SPF: `v=spf1 include:zoho.com ~all`
- DKIM: Zoho-ს მოწოდებული public key → DNS TXT record
- DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@sitely.ge`

**Throttling:**
- Inngest step-ებს შორის `sleep(72)` წამი (= ~50 მეილი/საათში).
- Zoho-ს დღიური ლიმიტის მონიტორინგი (API-დან).

**Bounce Management:**
- Zoho Webhook → `/api/email/webhook` → Inngest Event: `"email/bounce"`.
- Soft Bounce (temporary): retry 2-ჯერ, 24 სთ-ის ინტერვალით.
- Hard Bounce (permanent): `company.status → 'dnc'`, `company.email` → null.
- ჩავარდნილი მეილი → `dead_letter_queue` ცხრილი (debugging-ისთვის).

**Anti-Spam:**
- გაგზავნამდე: `last_contacted_at`-ის შემოწმება — 30 დღეში 1-ზე მეტჯერ არ გაიგზავნება.
- Unsubscribe link ყველა მეილში (CAN-SPAM / GDPR compliance).

### 5.4 ტესტირება (ეტაპი 5)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `inngest-generate.test.ts` | Integration | batch event → N HTML files Storage-ში; N demos rows |
| `inngest-email.test.ts` | Integration | throttling: 50/სთ; bounce → DNC status |
| `panic-button.test.ts` | Integration | cancel → დარჩენილი queue items არ გაიგზავნა |
| `anti-spam.test.ts` | Unit | 30-დღიანი cooldown-ის დარღვევა → skip |

---

## ეტაპი 6: CMS Dashboard — Enterprise-Grade

**მიზანი:** 22,000+ ჩანაწერის 0-lag ნავიგაცია, Realtime Engagement, URL-based ფილტრები.

### 6.1 TanStack Table + Virtualization

**პრობლემა:** ამჟამად CompaniesTable ჩვეულებრივ `<tr>`-ებს რენდერავს — 1000+ row-ზე DOM იჭედება.

**გამოსწორება:**
- `@tanstack/react-table` — column definitions, sorting, filtering.
- `@tanstack/react-virtual` — მხოლოდ ეკრანზე ხილული 30 row-ის render.
- Server-side pagination (უკვე არსებობს API-ში) + client-side virtualization.

**კომპონენტები:**
- `CompaniesTable/CompaniesTable.tsx` — refactor TanStack-ზე
- `VirtualRow/VirtualRow.tsx` — virtualized row renderer

### 6.2 React Query (State Management)

**პრობლემა:** `CompaniesProvider` ამჟამად `useEffect`-ით fetch-ავს — სწრაფი ფილტრაცია/ძებნა იწვევს Race Condition-ს (ძველი response ახალს გადაეწერება).

**გამოსწორება:**
- `@tanstack/react-query` შეცვლის `useEffect` + `useState` პატერნს.
- **Automatic deduplication:** იგივე query 2-ჯერ არ გაიგზავნება.
- **Stale-while-revalidate:** ძველ data-ს აჩვენებს, ახალს ფონურად ტვირთავს.
- **AbortController:** built-in — წინა request ავტომატურად cancel-დება ახლის დაწყებისას.

```typescript
// ნაცვლად useEffect + fetch
const { data, isLoading } = useQuery({
  queryKey: ['companies', { status, category, page, search }],
  queryFn: ({ signal }) => fetchCompanies({ status, category, page, search }, signal),
  placeholderData: keepPreviousData,  // ციმციმის თავიდან აცილება
});
```

### 6.3 URL-Based ფილტრები

- ფილტრები sync-დება `searchParams`-თან: `?status=lead&category=dental&page=2&q=aurora`.
- გვერდის refresh → იგივე ფილტრები; URL copy/paste → გაზიარება.
- `useSearchParams()` + `router.replace()` (scroll: false).

### 6.4 Realtime (Supabase CDC)

**Supabase Realtime Subscription:**
```typescript
supabase
  .channel('company-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'companies',
    filter: 'engagement_score=gt.0'
  }, (payload) => {
    queryClient.setQueryData(['companies', ...], /* update row */);
  })
  .subscribe();
```

- კლიენტმა დემო ნახა → `engagement_score` გაიზარდა → CMS-ში row მწვანედ ციმციმებს (CSS animation).
- ცალკე **Hot Leads** tab: `engagement_score > 20`-ის მქონე კომპანიები, დალაგებული ქულის მიხედვით.

### 6.5 ტესტირება (ეტაპი 6)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `companies-table.test.tsx` | Component | ფილტრის ცვლილება → ახალი data; URL sync |
| `race-condition.test.tsx` | Integration | სწრაფი 5 ფილტრის ცვლილება → ბოლო შედეგი სწორია |
| `realtime.test.tsx` | Integration | DB update → UI row განახლდა refresh-ის გარეშე |
| `virtualization.test.tsx` | Component | 10,000 row → DOM-ში მხოლოდ ~30 `<tr>` |

---

## ეტაპი 7: Client Onboarding და Portal

**მიზანი:** Lead → Client კონვერსია Magic Link-ით, ბოტების გარეშე.

### 7.1 CTA Flow

```
დემო გვერდი → "მოვითხოვოთ ვებსაიტი" ღილაკი
  → Contact/Brief გვერდი (/onboard?ref={secure_link_id})
  → ფორმა (prefilled: name, phone, email ბაზიდან)
  → Submit → Magic Link მეილზე
  → GET: Welcome გვერდი (არ ააქტიურებს სესიას — ბოტების დაცვა)
  → POST (ღილაკის დაჭერა): სესია აქტიურდება → Client Portal
```

### 7.2 Magic Link Anti-Bot

**პრობლემა:** Email სკანერები GET request-ით "ხსნიან" magic link-ს და მომხმარებელს ეხარჯება.

**გამოსწორება:**
- GET `/auth/verify?token=xxx` → აჩვენებს გვერდს: "დააჭირეთ ღილაკს შესასვლელად". სესიას **არ** ქმნის.
- ღილაკის დაჭერა → POST `/api/auth/activate` (token body-ში) → session cookie → redirect `/portal`.
- Token TTL: 30 წუთი, ერთჯერადი.

### 7.3 Client Portal

**Route:** `/portal` (protected by middleware — client role)

**კომპონენტები:**
- `PortalDashboard/PortalDashboard.tsx` — მთავარი გვერდი
- `ProjectTimeline/ProjectTimeline.tsx` — პროექტის სტატუსი (მოთხოვნა → დიზაინი → შექმნა → ჩაბარება)
- `DemoArchive/DemoArchive.tsx` — კლიენტის ძველი დემოები
- `ContactManager/ContactManager.tsx` — მენეჯერის დეტალები

### 7.4 ტესტირება (ეტაპი 7)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `magic-link.test.ts` | Integration | GET → სესია არ იქმნება; POST → სესია + cookie |
| `onboard-prefill.test.ts` | Integration | `ref` parameter → ფორმა prefilled |
| `portal-auth.test.ts` | Integration | client role → portal access; no role → redirect |

---

## ეტაპი 8: Analytics Optimization და Data Retention

**მიზანი:** ბაზის ზომის კონტროლი, ძველი ლოგების ავტომატური გასუფთავება.

### 8.1 Active Time Tracking

- **Page Visibility API**: `document.hidden` → timer pause/resume.
- `total_active_seconds` ინახება (არა tab-ში უმოქმედოდ გატარებული დრო).

### 8.2 Data Retention / Garbage Collection

**Cron Job (Inngest scheduled function, ყოველდღე 03:00):**

```
Step 1: ვადაგასული დემოები
  → demos WHERE expires_at < now() 
  → Storage-დან HTML წაშლა
  → demos.status = 'expired'

Step 2: ძველი ივენთები (30+ დღე)
  → demo_events WHERE created_at < now() - 30 days
  → ჯამური engagement_score-ის გამოთვლა და companies.engagement_score-ში ჩაწერა
  → demo_events DELETE

Step 3: DNC კომპანიების cleanup
  → 90+ დღე DNC სტატუსში → metadata nullify (GDPR)
```

**Rollback:** ძველი ივენთების წაშლამდე aggregate ინახება — individual events აღარ აღდგება, მაგრამ ჯამური ქულა შენარჩუნებულია.

### 8.3 ტესტირება (ეტაპი 8)

| ტესტი | ტიპი | რას ამოწმებს |
|--------|------|-------------|
| `gc-cron.test.ts` | Integration | expired demo → Storage file deleted; status = 'expired' |
| `retention.test.ts` | Integration | 30-day events → score aggregated → events deleted |
| `active-time.test.ts` | Unit | hidden tab → timer paused; visible → resumed |

---

## განივი საკითხები (Cross-Cutting, ყველა ეტაპზე)

### ტესტირების სტრატეგია

**სტეკი (უკვე კონფიგურირებულია):**
- **Vitest** — unit & integration tests
- **@testing-library/react** — component tests
- **jsdom** — DOM simulation

**წესები:**
- ყველა ახალი ფაილს (`*.ts`, `*.tsx`) თან ახლავს `*.test.ts(x)`.
- ეტაპი არ ითვლება დასრულებულად, სანამ ტესტები არ გაივლის.
- CI pipeline (`npm test`) — ყოველ push-ზე.
- Test coverage target: >70% ახალ კოდზე.

**ტესტ ფოლდერ სტრუქტურა:**
```
src/__tests__/
  hooks/          ← უკვე არსებობს
  lib/            ← auth, template-engine, utils
  api/            ← route handler tests
  components/     ← CMS component tests
```

### Migration & Rollback Protocol

1. ყოველი DB ცვლილება → `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. ყოველ UP migration-ს თან ახლავს DOWN (rollback) ბლოკი — კომენტარში ან ცალკე ფაილში.
3. Production-ზე deploy-მდე → staging-ზე migration-ის ტესტი.
4. Critical failure → `supabase migration down` → წინა მდგომარეობაზე დაბრუნება.

### CI/CD Pipeline

```
push → GitHub Actions:
  1. npm run lint
  2. npm test (vitest)
  3. npm run build (Next.js)
  4. supabase db push --dry-run (migration validation)
  5. Deploy to Vercel (auto)
```

### Monitoring & Alerting

- **Vercel Analytics** — serverless function duration, errors.
- **Supabase Dashboard** — DB size, connection count, slow queries.
- **Inngest Dashboard** — queue health, failed jobs, retry rates.
- **Custom:** `/api/health` endpoint — DB connectivity + Storage accessibility check.

---

## ეტაპების შეჯამება და დამოკიდებულებები

```
ეტაპი 1: Auth/Middleware          ← არაფერზე არ არის დამოკიდებული
    ↓
ეტაპი 2: DB Schema/Migration      ← 1-ის auth სჭირდება API-ებისთვის
    ↓
ეტაპი 3: Storage/Templates        ← 2-ის schema სჭირდება (snapshot_url, secure_link_id)
    ↓
ეტაპი 4: Tracking/Rate Limit      ← 3-ის Storage route სჭირდება
    ↓
ეტაპი 5: Queue/Email              ← 2+3 სჭირდება (statuses, Storage, template engine)
    ↓
ეტაპი 6: CMS Dashboard            ← 2-ის schema + 4-ის tracking data + 5-ის queue status
    ↓
ეტაპი 7: Client Portal            ← 3-ის secure_link_id + 4-ის cross-session
    ↓
ეტაპი 8: Data Retention           ← 4-ის analytics_events + 5-ის Inngest cron
```

> **პარალელიზაცია:** ეტაპი 4 და 5 შეიძლება პარალელურად — ერთმანეთზე არ არიან დამოკიდებული. ეტაპი 6 და 7-ც შეიძლება პარალელურად — სხვადასხვა UI-ს აწყობენ.
