# CMS — Dynamic Demo Generation System (Final Plan)

## მიზანი
კომპანიების მონაცემთა ბაზის (22,610 ჩანაწერი) გამოყენებით, დინამიური ვებსაიტ-შაბლონების გენერაცია და პოტენციურ კლიენტებისთვის პერსონალიზებული დემო-გვერდების გაგზავნა. CMS-ში სრული Sales Pipeline, ანალიტიკა და ფილტრაცია/ძიება.

---

## 1. Supabase ცხრილები (Database Schema)

### 1.1 `companies` — კომპანიების ძირითადი ცხრილი (22,610 ჩანაწერი)

| სვეტი | ტიპი | დანიშნულება | Index |
|-------|------|-------------|-------|
| `id` | UUID (PK, default gen_random_uuid()) | ავტომატური ID | ✅ |
| `yell_id` | Text (Unique, NOT NULL) | Yell.ge-ის ID, დუბლიკატების თავიდან ასარიდებლად | ✅ |
| `name` | Text (NOT NULL) | კომპანიის სახელი | ✅ (GIN tsvector) |
| `slug` | Text (Unique, NOT NULL) | URL-ისთვის (მაგ: "wine-merchants-159051") | ✅ |
| `tier` | Integer | პრიორიტეტი (1=HOT, 2, 3...) | ✅ |
| `tier_label` | Text | Tier-ის აღწერა (მაგ: "HOT — Email + No Website + Good Rating") | |
| `score` | Integer | რეიტინგის/პრიორიტეტის ქულა | ✅ |
| `email` | Text | ელფოსტა | ✅ |
| `phone` | Text | ტელეფონი (Yell.ge-დან) | |
| `website` | Text | ვებსაიტი | ✅ |
| `address` | Text | მისამართი | ✅ (GIN tsvector) |
| `category` | Text | Google Maps-ის მთავარი კატეგორია (მაგ: "Wine bar") | ✅ |
| `categories` | Text | Yell.ge-ს ყველა კატეგორია (მაგ: "WINE BARS, RESTAURANTS,") | |
| `source_category` | Text | წყაროს კატეგორია (მაგ: "WINES & SPIRITS - SHOPS") | ✅ |
| `rating` | Real | Google Maps რეიტინგი (მაგ: 4.6) | ✅ |
| `reviews_count` | Integer | Google Maps რევიუების რაოდენობა | |
| `lat` | Double Precision | გეოგრაფიული განედი | |
| `lng` | Double Precision | გეოგრაფიული გრძედი | |
| `gm_place_id` | Text | Google Maps-ის Place ID | |
| `status` | Text (default 'new') | Sales Pipeline სტატუსი (იხ. ქვემოთ) | ✅ |
| `notes` | Text | ადმინის შენიშვნები კომპანიის შესახებ | |
| `last_contacted_at` | Timestamptz | ბოლოს კონტაქტის თარიღი | |
| `metadata` | JSONB | დამატებითი და ნაკლებად ძებნადი დეტალები (იხ. სტრუქტურა ქვემოთ) | |
| `search_vector` | tsvector (generated) | Full-Text Search ინდექსი (name + address + category) | ✅ GIN |
| `created_at` | Timestamptz (default now()) | შექმნის თარიღი | |
| `updated_at` | Timestamptz (default now()) | ბოლო განახლების თარიღი (trigger-ით ავტო) | |

#### `status` მნიშვნელობები (Sales Pipeline):
| სტატუსი | აღწერა | ფერი CMS-ში |
|---------|--------|------------|
| `new` | ახალი, ჯერ არ მიწერილა | ნაცრისფერი |
| `contacted` | მეილი/შეტყობინება გაგზავნილია | ლურჯი |
| `viewed` | დემო ლინკი გახსნა | ყვითელი |
| `interested` | გამოეხმაურა / CTA-ზე დააჭირა | ნარინჯისფერი |
| `negotiating` | მოლაპარაკების ეტაპზეა | იასამნისფერი |
| `converted` | კლიენტი გახდა (დილი დაიხურა) | მწვანე |
| `rejected` | უარი თქვა | წითელი |
| `not_relevant` | არ არის რელევანტური (საიტი უკვე აქვს / გაკოტრდა / და ა.შ.) | მუქი ნაცრისფერი |

#### `metadata` (JSONB) სტრუქტურა:
```json
{
  "social": {
    "facebook": "https://www.facebook.com/...",
    "instagram": "",
    "youtube": "",
    "whatsapp": "",
    "viber": ""
  },
  "yell": {
    "url": "https://www.yell.ge/company.php?...",
    "rating": "0",
    "reviews": "0",
    "description": "WINE MERCHANTS - Tbilisi...",
    "working_hours": "კვირა – ხუთშაბათი 15:00 – 00:00...",
    "identification_number": "",
    "legal_name": "",
    "source_category_id": "3452"
  },
  "gm": {
    "name": "Wine Merchants",
    "phone": "592 00 24 01",
    "website": "",
    "address": "46 Ivane Javakhishvili St, Tbilisi 0102",
    "working_hours": "Closed · Opens 3 pm · See more hours",
    "plus_code": "PR43+Q8 Tbilisi",
    "description": "",
    "price_level": "",
    "all_categories": ["Wine bar"],
    "image_urls": [
      "https://lh3.googleusercontent.com/..."
    ],
    "social_links": [],
    "menu_link": "https://winemerchantsmenu.kovzy.com/...",
    "booking_link": "",
    "url": "https://www.google.com/maps/place/...",
    "services": [],
    "amenities": [],
    "accessibility": [],
    "reviews": [
      {
        "author": "Hannah Samford",
        "rating": 5,
        "date": "5 months ago",
        "text": "Amazing wine bar...",
        "ownerResponse": ""
      }
    ],
    "review_snippets": ["Amazing wine bar in Tbilisi..."],
    "matched": true,
    "match_score": 1,
    "phone_match": false,
    "enriched_at": "2026-03-22T00:09:49.352Z",
    "enrich_method": ""
  },
  "source": "yellge+gmaps"
}
```

#### Full-Text Search (სწრაფი ძებნა):
```sql
-- Generated column for search
ALTER TABLE companies ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(address, '') || ' ' || coalesce(category, '') || ' ' || coalesce(categories, ''))
  ) STORED;

CREATE INDEX idx_companies_search ON companies USING GIN (search_vector);
```
ეს საშუალებას მოგცემს CMS-ში ჩაწერო "wine tbilisi" და მომენტალურად იპოვოს ყველა შესაბამისი კომპანია 22,000-დან.

---

### 1.2 `templates` — შაბლონების ცხრილი

| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK, default gen_random_uuid()) | ავტომატური ID |
| `name` | Text (NOT NULL) | შაბლონის სახელი (მაგ: "Kinetic Restaurant Theme") |
| `description` | Text | მოკლე აღწერა |
| `industry` | Text (NOT NULL) | რომელი ინდუსტრიისთვის (Restaurant, Dental, Beauty, etc.) |
| `thumbnail_url` | Text | Preview სურათის URL (CMS-ში ვიზუალური არჩევისთვის) |
| `html_content` | Text (NOT NULL) | Handlebars HTML კოდი (დინამიური ცვლადებით) |
| `fallback_images` | Text[] | სარეზერვო სურათების URL-ები (Cloudinary ან სხვა CDN) |
| `is_active` | Boolean (default true) | აქტიურია თუ არა (წაშლის მაგივრად გამორთვა) |
| `created_at` | Timestamptz (default now()) | შექმნის თარიღი |
| `updated_at` | Timestamptz (default now()) | ბოლო განახლება (trigger) |

---

### 1.3 `demos` — დაგენერირებული დემო ლინკები

| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK, default gen_random_uuid()) | ავტომატური ID |
| `hash` | Text (Unique, NOT NULL) | URL-ის უნიკალური hash (მაგ: "a7x9k2m4") |
| `company_id` | UUID (FK → companies.id ON DELETE CASCADE) | რომელი კომპანიისთვის |
| `template_id` | UUID (FK → templates.id ON DELETE SET NULL) | რომელი შაბლონით |
| `campaign_id` | UUID (FK → email_campaigns.id ON DELETE SET NULL) | რომელი კამპანიის ფარგლებში გაიგზავნა |
| `status` | Text (default 'pending') | "pending" / "sent" / "viewed" / "clicked_cta" / "form_submitted" / "converted" |
| `html_snapshot` | Text | გაგზავნის მომენტში კომპილირებული HTML-ის სრული ასლი |
| `sent_at` | Timestamptz | მეილის გაგზავნის თარიღი |
| `first_viewed_at` | Timestamptz | პირველად გახსნის თარიღი |
| `last_viewed_at` | Timestamptz | ბოლოს გახსნის თარიღი |
| `view_count` | Integer (default 0) | რამდენჯერ გაიხსნა |
| `expires_at` | Timestamptz | ლინკის ვადა (default: created_at + 30 days) |
| `created_at` | Timestamptz (default now()) | შექმნის თარიღი |

#### ინდექსები:
```sql
CREATE INDEX idx_demos_hash ON demos (hash);
CREATE INDEX idx_demos_company ON demos (company_id);
CREATE INDEX idx_demos_campaign ON demos (campaign_id);
CREATE INDEX idx_demos_status ON demos (status);
```

---

### 1.4 `demo_events` — დემო ანალიტიკის ცხრილი (სრული ტრექინგი)

| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK, default gen_random_uuid()) | ავტომატური ID |
| `demo_id` | UUID (FK → demos.id ON DELETE CASCADE, NOT NULL) | რომელ დემოს ეკუთვნის |
| `event_type` | Text (NOT NULL) | მოვლენის ტიპი (იხ. ქვემოთ) |
| `page_url` | Text | რომელ გვერდზე მოხდა მოვლენა |
| `referrer` | Text | საიდან მოვიდა (email / direct / social / google) |
| `duration_ms` | Integer | გვერდზე გატარებული დრო (მილიწამებში) |
| `scroll_depth` | Integer | რამდენ %-ზე დასქროლა (0-100) |
| `user_agent` | Text | ბრაუზერის ინფორმაცია (device type, OS, browser) |
| `ip_country` | Text | ქვეყანა (IP-ს მიხედვით, არა სრული IP) |
| `session_id` | Text | სესიის ID (ერთი ვიზიტის ყველა მოვლენის დასაკავშირებლად) |
| `extra` | JSONB | დამატებითი ინფორმაცია |
| `created_at` | Timestamptz (default now()) | მოვლენის თარიღი |

#### `event_type` მნიშვნელობების სრული სია:

**გვერდის ვიზიტი:**
- `page_open` — გვერდი გაიხსნა
- `page_leave` — გვერდი დაიხურა / სხვაგან გადავიდა

**გვერდზე დრო:**
- `time_10s` — 10 წამი გაატარა
- `time_30s` — 30 წამი გაატარა
- `time_60s` — 1 წუთი გაატარა
- `time_180s` — 3 წუთი გაატარა
- `time_300s` — 5 წუთი+ გაატარა

**სქროლის სიღრმე:**
- `scroll_25` — 25%-ზე ჩავიდა
- `scroll_50` — 50%-ზე ჩავიდა
- `scroll_75` — 75%-ზე ჩავიდა
- `scroll_100` — ბოლომდე დასქროლა

**კლიკები:**
- `click_cta` — "მინდა ეს საიტი" ღილაკზე დაჭერა
- `click_phone` — ტელეფონის ნომერზე დაჭერა (tel: link)
- `click_email` — ელფოსტაზე დაჭერა (mailto: link)
- `click_menu` — მენიუს ლინკზე დაჭერა
- `click_booking` — ჯავშნის ლინკზე დაჭერა
- `click_map` — რუკაზე / მისამართზე დაჭერა
- `click_social` — სოციალურ ქსელზე დაჭერა
- `click_gallery` — სურათის გალერეაზე დაჭერა

**ნავიგაცია:**
- `navigate_sitely` — sitely.ge-ს სხვა გვერდზე გადასვლა (მაგ: portfolio, contact)
- `navigate_external` — გარე ლინკზე გადასვლა

**ფორმა:**
- `form_open` — CTA ფორმა გაიხსნა
- `form_submit` — CTA ფორმა გაიგზავნა (სახელი, ტელეფონი, შეტყობინება)

**`extra` JSONB მაგალითები:**
```json
// click_cta event
{ "button_text": "მინდა ეს საიტი", "viewport": "1920x1080", "device": "desktop" }

// form_submit event  
{ "name": "გიორგი", "phone": "599123456", "message": "მაინტერესებს" }

// navigate_sitely event
{ "destination": "/portfolio", "from_section": "footer" }
```

#### ინდექსები:
```sql
CREATE INDEX idx_events_demo ON demo_events (demo_id);
CREATE INDEX idx_events_type ON demo_events (event_type);
CREATE INDEX idx_events_session ON demo_events (session_id);
CREATE INDEX idx_events_created ON demo_events (created_at);
```

---

### 1.5 `email_campaigns` — მეილის კამპანიები

| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK, default gen_random_uuid()) | ავტომატური ID |
| `name` | Text | კამპანიის სახელი (მაგ: "Restaurant Tier 1 - მარტი 2026") |
| `subject` | Text | მეილის სათაური |
| `body_template` | Text | მეილის ტექსტის შაბლონი (Handlebars) |
| `template_id` | UUID (FK → templates.id) | რომელ საიტის შაბლონს იყენებს |
| `total_count` | Integer (default 0) | სულ მიმღები კომპანიები |
| `sent_count` | Integer (default 0) | რამდენი გაიგზავნა |
| `opened_count` | Integer (default 0) | რამდენმა გახსნა მეილი |
| `clicked_count` | Integer (default 0) | რამდენმა დააჭირა ლინკს |
| `status` | Text (default 'draft') | "draft" / "sending" / "completed" / "paused" |
| `created_at` | Timestamptz (default now()) | შექმნის თარიღი |

---

## 2. Supabase RLS (Row Level Security)

### უსაფრთხოების პოლიტიკა:
```sql
-- companies: მხოლოდ ავტორიზებული super_admin
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON companies
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- templates: მხოლოდ super_admin
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON templates
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- demos: super_admin-ს სრული წვდომა
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON demos
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );
-- demos: ანონიმურ მომხმარებლებს მხოლოდ hash-ით კითხვა (დემო გვერდისთვის)
CREATE POLICY "public_read_by_hash" ON demos
  FOR SELECT USING (true);

-- demo_events: ვინმეს შეუძლია INSERT (tracking), მხოლოდ admin-ს SELECT
ALTER TABLE demo_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert" ON demo_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read" ON demo_events
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- email_campaigns: მხოლოდ super_admin
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON email_campaigns
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );
```

---

## 3. API Routes (Next.js App Router)

### 3.1 კომპანიები (Companies)
| Method | Route | დანიშნულება | პარამეტრები |
|--------|-------|-------------|-------------|
| `GET` | `/api/companies` | სია + ფილტრაცია + ძებნა + პაგინაცია | `?page=1&limit=50&tier=1&category=Restaurant&has_email=true&has_website=false&status=new&q=wine+tbilisi&sort=score&order=desc` |
| `GET` | `/api/companies/[id]` | ერთი კომპანიის სრული დეტალი (metadata-სთან ერთად) | |
| `PATCH` | `/api/companies/[id]` | სტატუსის, ნოტების, last_contacted_at-ის შეცვლა | `{ status, notes }` |
| `GET` | `/api/companies/stats` | სტატისტიკა: რამდენია თითო tier-ში, კატეგორიაში, სტატუსში | |
| `GET` | `/api/companies/categories` | უნიკალური კატეგორიების სია (dropdown-ისთვის) | |

### 3.2 შაბლონები (Templates)
| Method | Route | დანიშნულება |
|--------|-------|-------------|
| `GET` | `/api/templates` | ყველა შაბლონის სია (thumbnail + name + industry) |
| `GET` | `/api/templates/[id]` | ერთი შაბლონის სრული კოდი |
| `POST` | `/api/templates` | ახალი შაბლონის დამატება |
| `PUT` | `/api/templates/[id]` | შაბლონის რედაქტირება |
| `DELETE` | `/api/templates/[id]` | შაბლონის წაშლა (soft delete → is_active=false) |

### 3.3 დემოების გენერაცია (Demos)
| Method | Route | დანიშნულება |
|--------|-------|-------------|
| `POST` | `/api/demos/generate` | Batch გენერაცია: `{ template_id, company_ids: [...] }` → აბრუნებს hash-ებს |
| `GET` | `/api/demos/preview/[company_id]/[template_id]` | Preview render (iframe-ისთვის) |
| `GET` | `/api/demos/[hash]` | (Public) დემო გვერდის მონაცემები |
| `GET` | `/api/demos` | (Admin) ყველა დემოს სია + სტატისტიკა |

### 3.4 ტრეკინგი (Tracking)
| Method | Route | დანიშნულება |
|--------|-------|-------------|
| `POST` | `/api/tracking` | (Public) event-ების მიღება დემო გვერდიდან: `{ demo_hash, event_type, ...data }` |

### 3.5 ანალიტიკა (Analytics)
| Method | Route | დანიშნულება |
|--------|-------|-------------|
| `GET` | `/api/analytics/overview` | Dashboard: სულ გაგზავნილი / გახსნილი / CTA / კონვერსია |
| `GET` | `/api/analytics/demo/[id]` | კონკრეტული დემოს ტაიმლაინი (ყველა event) |
| `GET` | `/api/analytics/campaign/[id]` | კამპანიის სტატისტიკა |
| `GET` | `/api/analytics/hot-leads` | Hot Leads: სორტირებული engagement-ით |

### 3.6 მეილი (Email) — TBD
| Method | Route | დანიშნულება |
|--------|-------|-------------|
| `POST` | `/api/email/send` | Batch email გაგზავნა |
| `POST` | `/api/email/preview` | მეილის preview (HTML render) |

---

## 4. CMS გვერდები (App Router Structure)

```
src/app/secure-access/
├── login/page.tsx                    # ლოგინი (არსებული)
├── dashboard/page.tsx                # მთავარი Dashboard
├── companies/
│   ├── page.tsx                      # კომპანიების სია + ფილტრაცია + ძებნა
│   └── [id]/page.tsx                 # კომპანიის დეტალური ხედი
├── templates/
│   ├── page.tsx                      # შაბლონების სია (thumbnails)
│   ├── new/page.tsx                  # ახალი შაბლონის დამატება (Monaco Editor)
│   └── [id]/edit/page.tsx            # შაბლონის რედაქტირება
├── demos/
│   ├── page.tsx                      # დემოების სია + სტატისტიკა
│   ├── generate/page.tsx             # დემოების გენერაცია (ფილტრი → არჩევა → preview → გაგზავნა)
│   └── [id]/page.tsx                 # კონკრეტული დემოს ანალიტიკა
├── analytics/page.tsx                # სრული ანალიტიკის Dashboard
└── campaigns/
    ├── page.tsx                      # კამპანიების ისტორია
    └── [id]/page.tsx                 # კამპანიის დეტალი
```

### Public Dynamic Route:
```
src/app/demo/[hash]/page.tsx          # კლიენტისთვის დემო გვერდი (public)
```

---

## 5. Workflow (სრული ნაკადი)

### ნაბიჯი 1: ბაზის მომზადება (Foundation)
1. Supabase-ში **5 ცხრილის** შექმნა SQL migration-ით:
   - `companies`, `templates`, `demos`, `demo_events`, `email_campaigns`
2. ინდექსების შექმნა (ყველა ✅ ველი + Full-Text Search GIN index)
3. RLS პოლიტიკების გააქტიურება
4. `updated_at` trigger-ის შექმნა (companies, templates)
5. **მთლიანი JSON-ის import:** 22,610 ჩანაწერი Supabase-ში
   - Node.js სკრიპტი: `scripts/import-companies.mjs`
   - JSON ფაილს წაიკითხავს Stream-ით (მეხსიერების დაზოგვა)
   - Batch Insert: 500 ჩანაწერი ერთ მოთხოვნაში
   - `slug` ავტომატური გენერაცია: `slugify(name) + "-" + yellId`
   - JSON-ის ველების mapping → companies სვეტები + metadata JSONB
   - ყველა კომპანიის `status` = `new`
6. იმპორტის ვალიდაცია: სულ 22,610 row არის ბაზაში

### ნაბიჯი 2: შაბლონის გადინამიურება (Templating)
1. `concept-c-kinetic.html`-ის Handlebars-ზე გადაწერა:
   - სტატიკური ტექსტები → `{{company.name}}`, `{{company.metadata.gm.address}}` და ა.შ.
   - სურათები → `{{company.metadata.gm.image_urls.[0]}}` / `{{template.fallback_images.[0]}}`
   - Fallback ლოგიკა → `{{#if ...}}...{{else}}...{{/if}}`
2. Next.js Server Component: `app/demo/[hash]/page.tsx`
   - hash-ით ამოიღებს `demos` + `companies` ჩანაწერებს
   - ჯერ შეამოწმებს `expires_at` (ვადაგასულია?)
   - თუ `html_snapshot` არსებობს → ის გამოიყენება (ვერსიონირება)
   - თუ არა → Handlebars-ით კომპილაცია რეალურ დროში
   - **Tracking Script ინჯექცია:** HTML-ში ავტომატურად ჩაისმება analytics.js
   - `view_count++` და `last_viewed_at` განახლება
3. Tracking Script (`public/js/demo-tracker.js`):
   - დემო გვერდში ჩაისმება `<script>` ტეგით
   - აგზავნის event-ებს `/api/tracking` endpoint-ზე
   - ტრეკავს: page_open, scroll depth, time on page, clicks, navigation, page_leave
   - session_id-ს ინახავს sessionStorage-ში

### ნაბიჯი 3: CMS ინტერფეისი (Admin Panel)

#### 3.1 Dashboard (`/secure-access/dashboard`)
- სწრაფი სტატისტიკა: სულ კომპანიები, Tier 1 რაოდენობა, გაგზავნილი დემოები, კონვერსია
- ბოლო აქტივობა: ახალი CTA submissions, გახსნილი დემოები
- Hot Leads: ტოპ 10 ყველაზე დაინტერესებული (engagement score-ით)

#### 3.2 Companies (`/secure-access/companies`)
- **ძებნის ზოლი:** Full-text search (სახელი, მისამართი, კატეგორია)
- **ფილტრები (Sidebar ან Toolbar):**
  - Tier (Dropdown: All / 1 / 2 / 3 / ...)
  - Status (Dropdown: All / new / contacted / viewed / ...)
  - Category (Dropdown: All / Restaurant / Dental / ...)
  - Source Category (Dropdown)
  - Has Email (Toggle: Yes / No / All)
  - Has Website (Toggle: Yes / No / All)
  - Rating Range (Slider: 0 – 5)
  - Score Range (Slider)
- **ცხრილი (Table):**
  - სვეტები: Name, Category, Tier, Score, Email, Rating, Status, Actions
  - **Server-Side Pagination:** 50 ჩანაწერი/გვერდი, Page 1, 2, 3...
  - სორტირება სვეტების მიხედვით (click header → ASC/DESC)
  - Checkbox-ები batch ოპერაციებისთვის
  - Expandable Row: დააჭერ კომპანიის სახელს → გაშლის სრულ დეტალს
    - ყველა საკონტაქტო (ტელეფონი, მეილი, სოციალური)
    - Google Maps სურათები (gallery)
    - რეიტინგი + რევიუები
    - სამუშაო საათები
    - Pipeline სტატუსი (dropdown შეცვლა)
    - Notes (ტექსტის ველი)
    - "Generate Demo" ღილაკი (პირდაპირ ამ კომპანიისთვის)

#### 3.3 Templates (`/secure-access/templates`)
- შაბლონების Grid ხედი: Thumbnail + Name + Industry + Created date
- **ახალი შაბლონის დამატება:**
  - Name, Description, Industry (dropdown)
  - **Monaco Editor:** HTML/Handlebars კოდის ჩასმა (syntax highlighting)
  - Thumbnail ატვირთვა
  - Fallback სურათების URL-ების მითითება
  - "Preview" ღილაკი (სატესტო კომპანიის მონაცემებით)
  - "Save" ღილაკი

#### 3.4 Demo Generation (`/secure-access/demos/generate`)
ეს არის მთავარი Workflow გვერდი — რამდენიმე ეტაპიანი:

**ეტაპი 1: შაბლონის არჩევა**
- Grid-ით აირჩევ შაბლონს (Thumbnail-ებით)

**ეტაპი 2: კომპანიების ფილტრაცია და მონიშვნა**
- იგივე ფილტრების სისტემა რაც Companies გვერდზე
- Checkbox-ებით ირჩევ კონკრეტულ კომპანიებს
- "Select All Filtered" ღილაკი (ყველა გაფილტრულის მონიშვნა)
- მონიშნული კომპანიების counter: "6 selected"

**ეტაპი 3: Preview & Review**
- ეკრანი იყოფა 2 ნაწილად:
  - **მარცხენა (30%):** მონიშნული კომპანიების ჩამონათვალი (სახელი, მეილი, რეიტინგი)
  - **მარჯვენა (70%):** iframe-ში რეალურ დროში Preview
- მარცხნივ კომპანიაზე დააჭერ → მარჯვნივ ჩანს მისი დემო
- "Exclude" ღილაკი → ამოაგდებს ცუდს
- **ეს ეტაპი სავალდებულოა** — ბრმად ვერ გაგზავნი

**ეტაპი 4: Approve**
- "Generate Demo Links" → უნიკალური hash-ების გენერაცია
- `html_snapshot` შენახვა ყველა დემოსთვის
- `expires_at` = now() + 30 days
- URL-ების ჩამონათვალი (copyable)
- (მომავალი) Email გაგზავნა

#### 3.5 Analytics (`/secure-access/analytics`)
- **Overview:** Funnel visualization (გაგზავნილი → გახსნილი → სქროლი → CTA → კონვერსია)
- **კამპანიების შედარება:** ცხრილით ან ბარ ჩარტით
- **Hot Leads რეიტინგი:** კომპანიები დალაგებული engagement-ით
  - Engagement score = view_count × 1 + scroll_100 × 3 + time_60s × 2 + click_cta × 10 + form_submit × 20
- **Individual Demo Timeline:** კონკრეტული demo-ს ევენტების ქრონოლოგიური ხედი

---

## 6. Fallback სისტემა (შაბლონის ხარისხის დაცვა)

| ველი | პირველადი წყარო | Fallback 1 | Fallback 2 | თუ არაფერია |
|------|-----------------|-----------|-----------|-------------|
| სახელი | `company.metadata.gm.name` | `company.name` | "Your Business" | ყოველთვის არის |
| აღწერა | `company.metadata.gm.description` | `company.metadata.yell.description` | შაბლონის default ტექსტი | შაბლონის ტექსტი |
| სურათები | `company.metadata.gm.image_urls` | `template.fallback_images` | Cloudinary stock URLs | იმალება სექცია |
| ტელეფონი | `company.phone` | `company.metadata.gm.phone` | — | იმალება |
| მისამართი | `company.metadata.gm.address` | `company.address` | — | იმალება |
| რეიტინგი | `company.rating` | — | — | იმალება |
| რევიუები | `company.metadata.gm.reviews` | `company.metadata.gm.review_snippets` | — | იმალება |
| მენიუ | `company.metadata.gm.menu_link` | — | — | იმალება |
| ჯავშანი | `company.metadata.gm.booking_link` | — | — | იმალება |
| სოციალური | `company.metadata.social.*` | — | — | იმალება |
| სამუშაო საათები | `company.metadata.gm.working_hours` | `company.metadata.yell.working_hours` | — | იმალება |

---

## 7. დემო გვერდი — CTA (Call-to-Action)

### Floating CTA ღილაკი:
- ფიქსირებული ღილაკი ეკრანის ქვედა მარჯვენა კუთხეში
- ტექსტი: **"მინდა ეს საიტი!"** ან **"შეუკვეთეთ ახლავე!"**
- დაჭერისას იხსნება მინი ფორმა (overlay/modal):
  - სახელი (required)
  - ტელეფონი (required)
  - შეტყობინება (optional)
  - "გაგზავნა" ღილაკი

### ფორმის გაგზავნისას:
1. `POST /api/tracking` → `event_type: "form_submit"`, `extra: { name, phone, message }`
2. `demos` ცხრილში `status` → `form_submitted`
3. `companies` ცხრილში `status` → `interested`
4. CMS Dashboard-ზე real-time notification (Supabase Realtime ან Polling)

### ვადაგასული ლინკის გვერდი:
- ლამაზი გვერდი: "ეს დემო ვადაგასულია"
- CTA: "დაგვიკავშირდით ახალი ვარიანტისთვის!" → sitely.ge/contact

---

## 8. შაბლონის ვერსიონირება

- `POST /api/demos/generate` → თითოეული დემოსთვის Handlebars compile
- კომპილირებული HTML ინახება `demos.html_snapshot`-ში
- ძველი ლინკები → `html_snapshot`-დან render (შეუცვლელი)
- ახალი ლინკები → `templates.html_content`-დან compile (განახლებული)
- შაბლონის რედაქტირება ძველ ლინკებზე **არ** მოქმედებს

---

## 9. Tracking Script ინჯექცია

### როგორ ხდება:
დემო გვერდის (`app/demo/[hash]/page.tsx`) Server Component:
1. ბაზიდან წამოიღებს `html_snapshot`-ს (ან ახლა compile-ს)
2. HTML-ს body-ს ბოლოს ჩაუმატებს tracking `<script>` ტეგს
3. Script-ი ავტომატურად დაიცავს (observe) გვერდს

### Tracking Script ლოგიკა (`demo-tracker.js`):
```
- pageload → POST /api/tracking { event: "page_open", referrer, user_agent }
- IntersectionObserver → scroll milestones (25%, 50%, 75%, 100%)
- setInterval → time milestones (10s, 30s, 60s, 180s, 300s)
- addEventListener("click") → CTA, phone, menu, map, social clicks
- beforeunload → POST /api/tracking { event: "page_leave", duration_ms, scroll_depth }
- navigation observer → sitely.ge links
- session_id → crypto.randomUUID() stored in sessionStorage
```

---

## 10. ტექნიკური სტეკი

| კომპონენტი | ტექნოლოგია |
|-----------|-----------|
| Database | Supabase (PostgreSQL) + JSONB + Full-Text Search |
| Auth | Supabase Auth (super_admin role) |
| Security | Row Level Security (RLS) |
| Template Engine | Handlebars.js (server-side compile) |
| Code Editor | Monaco Editor (შაბლონის HTML რედაქტირება CMS-ში) |
| Frontend | Next.js App Router, React Server Components |
| Styling | CSS Modules |
| Dynamic Route | `app/demo/[hash]/page.tsx` |
| Analytics | Custom tracking (Supabase `demo_events`) |
| Images | Google Maps URLs + Cloudinary fallback |
| Pagination | Server-side (Supabase .range()) |
| Search | PostgreSQL tsvector + GIN index |
| Email | TBD (მოგვიანებით — Resend / Gmail API / Other) |

---

## 11. იმპლემენტაციის რიგითობა (Build Order)

| # | ამოცანა | წინაპირობა | რას მოიცავს |
|---|---------|-----------|-------------|
| 1 | **DB Schema + Migration** | — | 5 ცხრილის SQL, ინდექსები, RLS, triggers |
| 2 | **Data Import Script** | #1 | `scripts/import-companies.mjs` — 22,610 ჩანაწერი |
| 3 | **API Routes: Companies** | #1, #2 | GET (list+filter+search+paginate), GET (detail), PATCH |
| 4 | **CMS: Companies Page** | #3 | ცხრილი + ფილტრები + ძებნა + პაგინაცია + expandable rows |
| 5 | **API Routes: Templates** | #1 | CRUD endpoints |
| 6 | **CMS: Templates Page** | #5 | Grid view + Monaco Editor + thumbnail + preview |
| 7 | **Template Engine** | #2, #5 | Handlebars compile + fallback logic + concept-c-kinetic conversion |
| 8 | **Dynamic Demo Route** | #7 | `app/demo/[hash]/page.tsx` + expiration check |
| 9 | **Tracking Script** | #8 | `demo-tracker.js` + `/api/tracking` endpoint |
| 10 | **API Routes: Demos** | #7 | Generate, Preview, List |
| 11 | **CMS: Demo Generation** | #4, #6, #10 | 4-ეტაპიანი wizard (Template → Filter → Preview → Approve) |
| 12 | **CMS: Analytics** | #9 | Dashboard + Hot Leads + Individual Demo Timeline |
| 13 | **CTA System** | #8, #9 | Floating button + Form + auto status update |
| 14 | **CMS: Dashboard** | #12 | Overview stats + notifications + recent activity |
| 15 | **Email Integration** | #11 | TBD — მოგვიანებით |
