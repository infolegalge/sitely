# CMS — Dynamic Demo Generation System

## მიზანი
კომპანიების მონაცემთა ბაზის (22,610 ჩანაწერი) გამოყენებით, დინამიური ვებსაიტ-შაბლონების გენერაცია და პოტენციურ კლიენტებისთვის პერსონალიზებული დემო-გვერდების გაგზავნა ელფოსტით.

---

## არქიტექტურა

### Supabase ცხრილები (Tables)

#### 1. `companies` — კომპანიების ძირითადი ცხრილი
| სვეტი | ტიპი | დანიშნულება | Index |
|-------|------|-------------|-------|
| `id` | UUID (PK) | ავტომატური ID | ✅ |
| `yell_id` | Text (Unique) | Yell.ge-ის ID, დუბლიკატების თავიდან ასარიდებლად | ✅ |
| `name` | Text | კომპანიის სახელი | ✅ |
| `slug` | Text (Unique) | URL-ისთვის (მაგ: "wine-merchants-159051") | ✅ |
| `tier` | Integer | პრიორიტეტი (1=HOT, 2, 3...) | ✅ |
| `tier_label` | Text | Tier-ის აღწერა | |
| `score` | Integer | რეიტინგის ქულა | ✅ |
| `email` | Text | ელფოსტა | ✅ |
| `phone` | Text | ტელეფონი | |
| `website` | Text | ვებსაიტი | ✅ |
| `address` | Text | მისამართი | |
| `category` | Text | Google Maps კატეგორია (მთავარი) | ✅ |
| `categories` | Text | Yell.ge-ს ყველა კატეგორია | |
| `source_category` | Text | წყაროს კატეგორია | ✅ |
| `rating` | Float | Google Maps რეიტინგი | ✅ |
| `reviews_count` | Integer | Google Maps რევიუების რაოდენობა | |
| `lat` | Float | გეოგრაფიული განედი | |
| `lng` | Float | გეოგრაფიული გრძედი | |
| `gm_place_id` | Text | Google Maps-ის Place ID | |
| `status` | Text | Sales Pipeline სტატუსი (იხ. ქვემოთ) | ✅ |
| `notes` | Text | ადმინის შენიშვნები კომპანიის შესახებ | |
| `last_contacted_at` | Timestamptz | ბოლოს კონტაქტის თარიღი | |
| `metadata` | JSONB | დამატებითი დეტალები (იხ. ქვემოთ) | |
| `created_at` | Timestamptz | შექმნის თარიღი (auto) | |

##### `status` მნიშვნელობები (Sales Pipeline):
- `new` — ახალი, ჯერ არ მიწერილა
- `contacted` — მეილი გაგზავნილია
- `viewed` — დემო ლინკი გახსნა
- `interested` — გამოეხმაურა / CTA-ზე დააჭირა
- `negotiating` — მოლაპარაკების ეტაპზეა
- `converted` — კლიენტი გახდა
- `rejected` — უარი თქვა
- `not_relevant` — არ არის რელევანტური (საიტი უკვე აქვს და ა.შ.)

##### `metadata` (JSONB) სტრუქტურა:
```json
{
  "social": {
    "facebook": "",
    "instagram": "",
    "youtube": "",
    "whatsapp": "",
    "viber": ""
  },
  "yell": {
    "url": "",
    "rating": "",
    "reviews": "",
    "description": "",
    "working_hours": "",
    "identification_number": "",
    "legal_name": ""
  },
  "gm": {
    "name": "",
    "phone": "",
    "website": "",
    "address": "",
    "working_hours": "",
    "plus_code": "",
    "description": "",
    "price_level": "",
    "all_categories": [],
    "image_urls": [],
    "social_links": [],
    "menu_link": "",
    "booking_link": "",
    "url": "",
    "services": [],
    "amenities": [],
    "accessibility": [],
    "reviews": [],
    "review_snippets": [],
    "matched": true,
    "match_score": 1,
    "phone_match": false,
    "enriched_at": "",
    "enrich_method": ""
  },
  "source": "yellge+gmaps"
}
```

#### 2. `templates` — შაბლონების ცხრილი
| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK) | ავტომატური ID |
| `name` | Text | შაბლონის სახელი (მაგ: "Kinetic Restaurant Theme") |
| `description` | Text | მოკლე აღწერა |
| `industry` | Text | რომელი ინდუსტრიისთვის (Restaurant, Dental, etc.) |
| `html_content` | Text | Handlebars HTML კოდი (დინამიური ცვლადებით) |
| `fallback_images` | Text[] | სარეზერვო სურათების URL-ები |
| `created_at` | Timestamptz | შექმნის თარიღი (auto) |
| `updated_at` | Timestamptz | ბოლო განახლება (auto) |

#### 3. `demos` — დაგენერირებული დემო ლინკები
| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK) | ავტომატური ID |
| `hash` | Text (Unique) | URL-ის უნიკალური hash (მაგ: "xyz123ab") |
| `company_id` | UUID (FK → companies) | რომელი კომპანიისთვის |
| `template_id` | UUID (FK → templates) | რომელი შაბლონით |
| `status` | Text | "pending" / "sent" / "viewed" / "clicked_cta" / "converted" |
| `html_snapshot` | Text | გაგზავნის მომენტში კომპილირებული HTML-ის ასლი (ვერსიონირება) |
| `sent_at` | Timestamptz | გაგზავნის თარიღი |
| `viewed_at` | Timestamptz | კლიენტმა გახსნა? |
| `expires_at` | Timestamptz | ლინკის ვადა (default: +30 დღე) |
| `created_at` | Timestamptz | შექმნის თარიღი (auto) |

#### 4. `demo_events` — დემო ანალიტიკის ცხრილი (სრული ტრექინგი)
| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK) | ავტომატური ID |
| `demo_id` | UUID (FK → demos) | რომელ დემოს ეკუთვნის |
| `event_type` | Text | მოვლენის ტიპი (იხ. ქვემოთ) |
| `page_url` | Text | რომელ გვერდზე მოხდა მოვლენა |
| `referrer` | Text | საიდან მოვიდა (email / direct / social) |
| `duration_ms` | Integer | გვერდზე გატარებული დრო (ms) |
| `scroll_depth` | Integer | რამდენ %-ზე დასქროლა (0-100) |
| `user_agent` | Text | ბრაუზერის ინფორმაცია |
| `ip_country` | Text | ქვეყანა (IP-ს მიხედვით) |
| `session_id` | Text | სესიის ID (ერთი ვიზიტის ყველა მოვლენის დასაკავშირებლად) |
| `extra` | JSONB | დამატებითი დეტალები (რაზე დააჭირა, viewport size და ა.შ.) |
| `created_at` | Timestamptz | მოვლენის თარიღი (auto) |

##### `event_type` მნიშვნელობები:
- `page_open` — გვერდი გაიხსნა
- `scroll_25` / `scroll_50` / `scroll_75` / `scroll_100` — სქროლის პროგრესი
- `time_10s` / `time_30s` / `time_60s` / `time_180s` — გვერდზე გატარებული დრო
- `click_cta` — "მინდა ეს საიტი" ღილაკზე დაჭერა
- `click_phone` — ტელეფონის ნომერზე დაჭერა
- `click_menu` — მენიუს ლინკზე დაჭერა
- `click_map` — რუკაზე დაჭერა
- `navigate_away` — სხვა გვერდზე გადასვლა (sitely.ge-ს ფარგლებში)
- `page_leave` — გვერდის დატოვება
- `form_submit` — CTA ფორმის გაგზავნა

#### 5. `email_campaigns` — მეილის კამპანიები (ისტორია)
| სვეტი | ტიპი | დანიშნულება |
|-------|------|-------------|
| `id` | UUID (PK) | ავტომატური ID |
| `subject` | Text | მეილის სათაური |
| `body_template` | Text | მეილის ტექსტის შაბლონი |
| `template_id` | UUID (FK → templates) | რომელ საიტის შაბლონს იყენებს |
| `company_ids` | UUID[] | მიმღები კომპანიები |
| `sent_count` | Integer | რამდენი გაიგზავნა |
| `created_at` | Timestamptz | შექმნის თარიღი (auto) |

---

## Workflow (ნაკადი)

### ნაბიჯი 1: ბაზის მომზადება (Foundation) ✅ (შემდეგი ამოცანა)
1. Supabase-ში `companies`, `templates`, `demos`, `email_campaigns` ცხრილების შექმნა SQL-ით.
2. JSON ფაილიდან (22,610 ჩანაწერი) მთლიანი ბაზის იმპორტი Supabase-ში.
   - Node.js სკრიპტი: Stream + Batch Insert (1000 ცალიანი პარტიებით).
   - `slug` ავტომატური გენერაცია სახელისა და `yellId`-ის კომბინაციით.
3. ინდექსების დამატება `tier`, `email`, `website`, `category`, `score`, `rating` სვეტებზე.

### ნაბიჯი 2: შაბლონის გადინამიურება (Templating)
1. `concept-c-kinetic.html`-ის კოდში Handlebars ცვლადების ჩასმა (`{{company.name}}`, `{{company.metadata.gm.image_urls.[0]}}` და ა.შ.).
2. Fallback ლოგიკის დამატება (`{{#if ...}}...{{else}}...{{/if}}`).
3. Next.js-ში დინამიური როუტის აწყობა: `app/demo/[hash]/page.tsx`.
4. სერვერზე Handlebars compile + `dangerouslySetInnerHTML` რენდერი.

### ნაბიჯი 3: CMS ინტერფეისი (Admin Panel)
1. **Templates სექცია:**
   - შაბლონების ნახვა/დამატება/რედაქტირება.
   - Monaco Editor (კოდ ედიტორის) ინტეგრაცია.
   - Fallback სურათების ატვირთვა.
2. **Leads / კომპანიები სექცია:**
   - ფილტრაცია: Tier, Category, Website (აქვს/არ აქვს), Email (აქვს/არ აქვს), Rating, Score.
   - კომპანიის დეტალების ნახვა (Dropdown / Expandable Row).
   - Checkbox-ებით მონიშვნა batch ოპერაციებისთვის.
3. **Demo Generation / Send სექცია:**
   - შაბლონის არჩევა.
   - კომპანიების ფილტრაცია და მონიშვნა.
   - **Preview / Review ეკრანი:**
     - მარცხენა: მონიშნული კომპანიების სია.
     - მარჯვენა: iframe-ში რეალურ დროში Preview.
     - Exclude ღილაკი (ცუდის გამოსარიცხად).
   - Email ტექსტის შეყვანა.
   - **"Approve & Send"** ღილაკი.

### ნაბიჯი 4: Email Integration
1. Email სერვისის ინტეგრაცია (Resend / SendGrid).
2. თითოეული კომპანიისთვის უნიკალური URL-ის (`sitely.ge/demo/[hash]`) გენერაცია.
3. პერსონალიზებული მეილის გაგზავნა (კომპანიის სახელით, URL-ით).
4. Tracking: `demos` ცხრილში `viewed_at` ველი (კლიენტმა გახსნა თუ არა ლინკი).

---

## Fallback სისტემა (შაბლონის ხარისხის დაცვა)

| ველი | პირველადი წყარო | Fallback 1 | Fallback 2 |
|------|-----------------|-----------|-----------|
| სახელი | `company.gm_name` | `company.name` | "Your Business" |
| აღწერა | `company.metadata.gm.description` | `company.metadata.yell.description` | შაბლონის default ტექსტი |
| სურათები | `company.metadata.gm.image_urls` | Template fallback images | Unsplash stock photos |
| ტელეფონი | `company.phone` | `company.metadata.gm.phone` | არ გამოჩნდეს |
| მისამართი | `company.metadata.gm.address` | `company.address` | არ გამოჩნდეს |
| რეიტინგი | `company.rating` (gm_rating) | არ გამოჩნდეს | - |
| რევიუები | `company.metadata.gm.reviews` | `company.metadata.gm.review_snippets` | არ გამოჩნდეს |
| მენიუ | `company.metadata.gm.menu_link` | არ გამოჩნდეს | - |

---

---

## დემო გვერდზე CTA (Call-to-Action)
ყველა დემო გვერდს ექნება Floating CTA ღილაკი ან ფიქსირებული footer:
> **"მოგეწონათ? შეუკვეთეთ ეს საიტი!"**
> [ღილაკი: "მინდა ეს საიტი" → მინი ფორმა (სახელი, ტელეფონი)]

ფორმიდან მოსული მოთხოვნა:
- ბაზაში `demos` ცხრილში `status` → `clicked_cta`
- `companies` ცხრილში `status` → `interested`
- CMS Dashboard-ზე გამოჩნდება notification

---

## ანალიტიკის სისტემა (Full Tracking)

### რა ტრექავს:
1. **გვერდის გახსნა** — ვინ, როდის, საიდან (email/direct/social)
2. **დრო გვერდზე** — ზუსტი დრო წამებში
3. **სქროლის სიღრმე** — 25%, 50%, 75%, 100%
4. **ყველა კლიკი** — CTA, ტელეფონი, მენიუ, რუკა
5. **ნავიგაცია** — sitely.ge-ს სხვა გვერდებზე გადავიდა თუ არა
6. **გვერდის დატოვება** — როდის წავიდა
7. **მოწყობილობა** — desktop/mobile, ბრაუზერი
8. **ფორმის submission** — CTA ფორმის შევსება

### CMS Dashboard Analytics View:
- **კამპანიის მიმოხილვა:** გაგზავნილი / გახსნილი / CTA კლიკი / კონვერსია
- **Hot Leads:** კომპანიები სორტირებული engagement-ით (ბევრი დრო + deep scroll + CTA click)
- **Individual Demo Stats:** თითოეული დემოს დეტალური ტაიმლაინი

---

## დემო ლინკის ვადა (Expiration)
- Default ვადა: **30 დღე** გენერაციის მომენტიდან
- ვადაგასული ლინკი → აჩვენებს ლამაზ გვერდს: "ეს დემო ვადაგასულია. დაგვიკავშირდით ახალი ვარიანტისთვის!"
- CMS-ში შესაძლებლობა ვადის გაგრძელების ან ხელახალი გაგზავნის

---

## შაბლონის ვერსიონირება
- დემოს გენერაციისას, კომპილირებული HTML ინახება `demos.html_snapshot`-ში
- ძველი ლინკები ყოველთვის იმ ვერსიას აჩვენებენ, რა დროსაც გაიგზავნა
- შაბლონის რედაქტირება ახალ დემოებზე მოქმედებს, ძველებზე არა

---

## ტექნიკური სტეკი
- **Database:** Supabase (PostgreSQL) + JSONB
- **Template Engine:** Handlebars.js (სერვერზე კომპილაცია)
- **Email Service:** TBD (Resend / Gmail API / Other — მოგვიანებით)
- **CMS Editor:** Monaco Editor (შაბლონის კოდის რედაქტირება)
- **Frontend:** Next.js App Router, React Server Components
- **Dynamic Route:** `app/demo/[hash]/page.tsx`
- **Analytics:** Custom event tracking (Supabase `demo_events` table)
- **Images:** Google Maps URLs + Cloudinary fallback URLs
