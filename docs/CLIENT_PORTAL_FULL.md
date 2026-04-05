# Sitely — Client Portal სრული სისტემის გეგმა (0 → 100)

> **თარიღი:** 2026-04-03  
> **ვერსია:** 2.0 — სრულყოფილი, კლიენტზე ორიენტირებული  
> **ავტორი:** Sitely Dev Team

---

## სისტემის ფილოსოფია

ეს სისტემა არის **სამ-ეტაპიანი, ავტომატიზებული გაყიდვისა და მომსახურების ძრავა:**

1. **Cold Outreach → Demo → CTA** — ლიდის მოზიდვა (უკვე გაქვთ ✅)
2. **Claim → Magic Link** — ლიდის "დაჭერა" საკუთარ სისტემაში
3. **Portal (Act I → Act II)** — გაყიდვა + მომსახურება ერთ სივრცეში

**ძირითადი პრინციპი:** კლიენტს ყველა ეტაპზე ეკრანზე ჩანს **მხოლოდ 1 კონკრეტული შეკითხვა ან მოქმედება.** არანაირი გადაწვივა. არანაირი "მენიუ". ეს არ არის SaaS-ის ადმინ პანელი — ეს არის კლიენტის პირადი ასისტენტი.

---

# ნაწილი I: CLAIM FLOW (Magic Link-ამდე)

## ნაბიჯი 1: კლიენტი ხსნის დემოს

- კლიენტმა მიიღო Cold Email.
- ხსნის ლინკს: `sitely.ge/demo/[hash]`
- ხედავს სრულ, ინტერაქტიულ შაბლონს (პერსონალიზებული მის კომპანიაზე).
- ეკრანის ქვედა ნაწილში (ფიქსირებული, დემოს გარე Wrapper) არის ღილაკი:

```
┌─────────────────────────────────────────────────────────┐
│  Sitely  |  ეს არის სატესტო ვერსია: "Wine Merchants"  │  [მინდა ეს ვებსაიტი →]  │
└─────────────────────────────────────────────────────────┘
```

- ეს Wrapper (`Demo Bar`) **ანდე ზემოდან ან ქვემოდან**, დემოს HTML-ის მიღმა. დემო სუფთაა.

---

## ნაბიჯი 2: CTA კლიკი — Claim ფორმა

"მინდა ეს ვებსაიტი"-ზე დაჭერის შემდეგ **იმავე გვერდზე** (ან ცალკე გვერდზე `sitely.ge/claim/[hash]`) გამოდის **ულტრა-მარტივი ფორმა**. Typeform-ის სტილი — ეკრანზე ყოველთვის **მხოლოდ 1 ველი:**

```
┌─────────────────────────────────────────────┐
│                                             │
│   გახადეთ ეს საიტი თქვენი!                 │
│                                             │
│   როგორ დაგიძახოთ?                          │
│   ┌─────────────────────────────┐           │
│   │  სახელი და გვარი...         │           │
│   └─────────────────────────────┘           │
│   [შემდეგი →]                               │
│                                             │
└─────────────────────────────────────────────┘

→ (შემდეგი ეკრანი)

│   რა ნომერზე დაგიკავშირდეთ?                │
│   ┌─────────────────────────────┐           │
│   │  +995 5XX XX XX XX          │           │
│   └─────────────────────────────┘           │
│   [შემდეგი →]                               │

→ (შემდეგი ეკრანი)

│   შესასვლელი ბმული გამოვგზავნოთ:           │
│   ┌─────────────────────────────┐           │
│   │  თქვენი@მეილი.ge            │           │
│   └─────────────────────────────┘           │
│   [პორტალზე გადასვლა →]                    │
```

**კრიტიკული ლოგიკა:**
- ფორმა ფარულად იჭერს `[hash]`-ს URL-დან.
- ჩვენ ბაზაში `demos` ცხრილიდან `hash`-ით ვქმნით კავშირს: `demo → company`.
- კლიენტი ჩაწერს **თავის** მეილს (შეიძლება განსხვავდებოდეს `info@company.ge`-სგან — ეს ნორმალურია, აღვიარებთ).

**Edge Cases:**

| სცენარი | გადაწყვეტა |
|---------|------------|
| ვინმემ გადაუგზავნა ლინკი სხვას | ახალ მეილზე იქმნება User. ადმინი ხედავს ორივეს, წყვეტს ვინ არის კლიენტი. |
| ერთი ადამიანი ორჯერ ავსებს | `demo_id + email` კომბინაციის შემოწმება → ახალი ტოკენი, ახალი Project-ი არ იქმნება. |
| ბოტი | Rate Limit: 5 claim/IP/საათი. Honeypot ფარული ველი. |
| Token-ი ვადაგასული | `/auth/verify`-ზე: "ლინკს ვადა გაუვიდა" + ახალი ლინკის მოთხოვნა. |

---

## ნაბიჯი 3: Backend Logic — Claim API

**Endpoint:** `POST /api/portal/claim`  
**Auth:** Public

**10 ნაბიჯი კულისებში:**

```
1. Zod ვალიდაცია:
   name (min 2), phone (ქართული ფორმატი), email (valid), demo_id (UUID)

2. Demo-ს მოძიება:
   SELECT * FROM demos WHERE id = demo_id
   → მოვიტანოთ: company_id, template_id, campaign_id

3. კომპანიის მონაცემების მოტანა:
   SELECT name, category, tier, email FROM companies WHERE id = company_id
   → ადმინს დასჭირდება: ვინ არის ეს კომპანია

4. User-ის შექმნა (ან მოძიება):
   → შევამოწმოთ: EXISTS user WHERE email = client_email
   → არ არსებობს: createUser({ email, app_metadata: { role: 'client' } })
   → არსებობს: გამოვიყენოთ (კლიენტს შეიძლება მეორე პროექტი ჰქონდეს)

5. Project-ის შექმნა:
   INSERT INTO projects (
     company_id, demo_id, client_name, client_email, client_phone,
     client_user_id, status = 'lead_new'
   )

6. Onboard Token-ის გენერაცია:
   INSERT INTO onboard_tokens (user_id, token = uuid(), expires_at = now() + 24h)

7. Magic Link მეილის გაგზავნა:
   TO: client_email
   SUBJECT: "გამარჯობა [სახელი], თქვენი პორტალი მზადაა!"
   BODY: ლამაზი HTML → ღილაკი [შედით კაბინეტში] → /auth/verify?token={uuid}

8. ადმინის შეტყობინება:
   Inngest event → "🔥 ახალი Lead: [კომპანიის სახელი] | [სახელი] | [ტელეფონი]"
   (Telegram ან მეილით — კონფიგური)

9. Company სტატუსის განახლება:
   UPDATE companies SET status = 'engaged' WHERE id = company_id

10. Response:
    { success: true, email: "g***i@company.ge" }
```

---

## ნაბიჯი 4: Magic Link მეილი

```
─────────────────────────────────────────────────────────────
  Subject: 👋 გამარჯობა გიორგი, თქვენი პორტალი მზადაა!
─────────────────────────────────────────────────────────────

  [Sitely Logo]

  გამარჯობა გიორგი,

  თქვენი პერსონალური სამუშაო სივრცე შეიქმნა.
  შედით ქვემოთ მოცემული ღილაკით:

  ┌──────────────────────────────┐
  │   → შესვლა კაბინეტში        │
  └──────────────────────────────┘
  (ლინკი: /auth/verify?token=...)

  ⏳ ლინკი მოქმედებს 24 საათის განმავლობაში.
  
  კითხვების შემთხვევაში: hello@sitely.ge | +995 555 00 00 00

  – Sitely გუნდი
─────────────────────────────────────────────────────────────
```

---

## ნაბიჯი 5: Auth Verify (`/auth/verify?token=...`)

კლიენტი დააჭერს მეილის ღილაკს და გადავა `/auth/verify?token=[uuid]`-ზე.
ეს გვერდი:
1. Token-ს ამოიღებს URL-დან.
2. `POST /api/auth/activate`-ს გამოძახება → ვალიდაცია → სესიის გახსნა.
3. ავტომატური Redirect → `/portal`.

**ხელახლა შესვლა (Re-auth):**
`/portal/login` → კლიენტი ჩაწერს მეილს → ახალი Magic Link → კაბინეტი.  
**პაროლი არასდროს სჭირდება.**

---

# ნაწილი II: CLIENT PORTAL — კაბინეტი (Magic Link-ის შემდეგ)

## სისტემის ორი ფაზა ("Two-Act Portal")

კაბინეტი ორ რადიკალურად განსხვავებულ ეკრანს ავლენს **პროექტის სტატუსის** მიხედვით:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ACT I: Pre-Sale (გაყიდვა)                        │
│   statuses: lead_new, lead_negotiating,             │
│             proposal_sent                           │
│                                                     │
│   ↓ (გადახდის დადასტურების შემდეგ)                 │
│                                                     │
│   ACT II: Production (წარმოება)                    │
│   statuses: active_collecting, active_designing,    │
│             active_developing, active_review,       │
│             completed                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ACT I — Pre-Sale: "გახადეთ ეს საიტი თქვენი"

### რას ხედავს კლიენტი პირველი შესვლისას

პირველი ეკრანი არის **"Two-Path Welcome Screen"** — ორი ბარათი, ერთი არჩევანი. სხვა არაფერი.

```
┌───────────────────────────────────────────────────────────┐
│  [Sitely Logo]                          გამარჯობა გიორგი │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐ │
│  │                         │  │                         │ │
│  │  🚀 სტანდარტული         │  │  💎 ინდივიდუალური       │ │
│  │     პაკეტი              │  │     პროექტი             │ │
│  │                         │  │                         │ │
│  │  [შაბლონის სახელი]      │  │  ნულიდან შექმნილი       │ │
│  │                         │  │  დიზაინი სრულად         │ │
│  │  ✓ სრული ძრავა          │  │  თქვენს ბრენდზე         │ │
│  │  ✓ ჰოსტინგი 1 წლით      │  │  მორგებული              │ │
│  │  ✓ მობილური ვერსია      │  │                         │ │
│  │  ✕ დომენი (+40₾/წ)      │  │  ✓ ყველა სტანდარტული   │ │
│  │                         │  │  + ონლაინ შეკვეთები,   │ │
│  │  💰 500 ₾               │  │    ჯავშნები, კატალოგი   │ │
│  │                         │  │                         │ │
│  │  [💳 გადახდა და დაწყება]│  │  💰 ფასი შეთანხმებით    │ │
│  │                         │  │  [💬 განხილვა სურს]     │ │
│  └─────────────────────────┘  └─────────────────────────┘ │
│                                                           │
│  ──────────────────────────────────────────────────────  │
│  კითხვა გაქვთ? მომწერეთ პირდაპირ ჩატში ▼               │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [ჩატი ჩუმ/Standby რეჟიმში — ველოდებით კითხვებს] │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### ფასის დინამიური ბარათი — "Proposal Snapshot"

**კრიტიკული პრინციპი:** ბარათზე ნაჩვენები ფასი და პირობები **არ იცვლება** მომავალში, თუ ჩვენ ჩვენს ზოგად ფასებს მოვცვლით. ეს არის "გაყინული" (Snapshot) შეთავაზება სწორედ ამ კლიენტისთვის.

**როგორ მუშაობს Snapshot:**
```
1. ადმინი ქმნის Packages (ბლუპრინტები):
   packages ცხრილი:
   - "სტანდარტული 500₾" { features: [...], price: 500 }
   - "პრემიუმ 900₾" { features: [...], price: 900 }

2. Campaign-ის გაგზავნისას ადმინი არჩევს პაკეტს.
   სისტემა ქმნის proposals ჩანაწერს:
   {
     project_id: ...,
     package_id: "სტანდარტული-500",
     snapshot: {           ← ეს JSONB კოლონა
       price: 500,
       currency: "GEL",
       title: "სტანდარტული რესტორნის პაკეტი",
       included: ["ჰოსტინგი", "მობილური", "5 გვერდი"],
       excluded: ["დომენი", "ლოგოს დიზაინი"]
     },
     status: "pending"
   }

3. კლიენტის კაბინეტი კითხულობს proposals.snapshot-ს
   და ზუსტად ამ მონაცემებით ხატავს ბარათს.
   → packages-ში ფასის ცვლილება ამ კლიენტზე გავლენას არ ახდენს!
```

### Sccenario A: სტანდარტული — "გადახდა და დაწყება"

კლიენტი ხედავს 500 ₾ ბარათს, ყველაფელი ესმის, კმაყოფილია.  

1. დააჭერს `[💳 გადახდა და დაწყება]`.
2. გამოვა გადახდის ვარიანტები:
   ```
   ┌────────────────────────────────────────┐
   │  გადახდის მეთოდის არჩევა:            │
   │                                        │
   │  ○ [💳 ბარათით (Stripe/TBC Pay)]      │
   │  ○ [🏦 საბანკო გადარიცხვა]           │
   │                                        │
   │  [შემდეგი →]                           │
   └────────────────────────────────────────┘
   ```
3. ბარათით: Stripe Checkout Session → გადახდა → Webhook → სტატუსი `active_collecting`.
4. გადარიცხვით: **რეკვიზიტები ეკრანზე.** ადმინი ადასტურებს ხელით → `active_collecting`.

**ამ დროს ავტომატურად:**
- `proposals.status = 'accepted'`
- `projects.status = 'active_collecting'`
- ჩატში სისტემური მჯდომი: *"🎉 გადახდა მიღებულია! დავიწყეთ."*
- ადმინს შეტყობინება: *"გიორგი (Wine Merchants) გადაიხადა 500₾"*

### Scenario B: ინდივიდუალური — "მინდა განხილვა"

კლიენტი დааჭერს `[💬 განხილვა სურს]`.

1. **ეკრანი იცვლება:** სტანდარტული ბარათი ქრება.
2. ჩატი გამოდის წინ და ავტომატური სისტემური მMessage:
   *"შესანიშნავია! გვიამბეთ, რა ფუნქციები გჭირდებათ (მაგ: ონლაინ ჯავშნები, გადახდები, სურათების გალერეა). ჩვენი გუნდი მოამზადებს ინდივიდუალურ შეთავაზებას."*
3. **ადმინს გადადის:**
   - `projects.status = 'lead_negotiating'`
   - 🔴 შეტყობინება Admin Inbox-ში: *"გიორგიმ (Wine Merchants) მოითხოვა Custom შეთავაზება!"*
4. ადმინი ჩატში ესაუბრება, ტელეფონზე ურეკავს, ყველაფერს არკვევს.
5. როცა ფასი შეთანხმდება, ადმინი CMS-ში ქმნის **ახალ Proposal-ს** (სხვა ფასით):
   - `proposals.snapshot.price = 2500`
   - დაამატებს სხვა `included[]` ჩამონათვალს.
   - დააჭერს `[→ Send Proposal to Client]`.
6. **კლიენტს ეცვლება ეკრანი:** ახალი ბარათი ახალი ფასით + `[💳 გადახდა]`.

**ადმინი ნებისმიერ დროს შეუძლია Proposal-ის რედაქტირება.**  
კლიენტის ეკრანი Live-ში განახლდება (Supabase Realtime ან გვერდის Re-fetch).

---

## ACT II — Production: "ვმუშაობთ თქვენს საიტზე"

### გაღვიძება (Unlock)

როგორც კი გადახდა დადასტურდება, კაბინეტის ეკრანი **გარდაიქმნება**:

- ორი ბარათი ქრება.
- ეჩვენება **Live Timeline (ნაბიჯები)** + **ჩატი** + **ფაილების ზონა**.
- ჩატში სისტემური მMessage: *"🎉 გადახდა მიღებულია! ახლა ვიწყებთ. პირველი ნაბიჯია..."*

### ადმინი ქმნის Timeline-ს (ინდივიდუალურად!)

კაბინეტში ჩანდა Timeline სტეპები **არ არის წინასწარ ჩაწერილი (Hardcoded)**. ადმინი CMS-დან ქმნის ინდივიდუალურ სტეპებს ყოველი კლიენტისთვის გადახდის შემდეგ. 

**ადმინის Timeline Builder (CMS):**
```
პროექტი: Wine Merchants / გიორგი
[+ ნაბიჯის დამატება]

სტეპი 1:  [ლოგოს და ფოტოების ატვირთვა  ] [აქტიური ▾] [წაშლა]
სტეპი 2:  [პირველადი დიზაინი              ] [ლოდინი  ▾] [წაშლა]
სტეპი 3:  [კლიენტის დადასტურება          ] [ლოდინი  ▾] [წაშლა]
სტეპი 4:  [საიტის გაშვება + დომენის მიბმა] [ლოდინი  ▾] [წაშლა]

[→ Timeline-ის გამოქვეყნება კლიენტისთვის]
```

### კლიენტის Act II ეკრანი — "One-Page Concierge"

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]                              გამარჯობა გიორგი  [გახ.] │
├───────────────────────────┬────────────────────────────────────┤
│                           │                                    │
│  ACTION CENTER            │  CHAT                             │
│  ──────────────           │  ──────                           │
│                           │                                    │
│  📋 "ატვირთეთ ლოგო და     │  [🤖] პროექტი შეიქმნა 14:30      │
│  ფოტოები, რომ დიზაინი     │                                    │
│  დავიწყოთ."               │  გიორგი: გამარჯობა!              │
│                           │  გიორგი: [📎 logo.png]            │
│  [📁 ფაილების ატვირთვა]   │                                    │
│     (Drag & Drop)         │  Sitely: მადლობა, ძალიან         │
│                           │  ლამაზი ლოგოა! ფოტოებიც           │
│                           │  გვჭირდება ინტერიერის.            │
│                           │                                    │
│  PROGRESS                 │  ┌──────────────────────┐         │
│  ──────────               │  │ დაწერეთ...      📎 ➤ │         │
│                           │  └──────────────────────┘         │
│  ● ლოგო/ფოტოები  [✓]     │                                    │
│  ○ დიზაინი       [→]     ├────────────────────────────────────┤
│  ○ დადასტურება           │                                    │
│  ○ გაშვება               │  ASSETS (ჩემი ფაილები)            │
│                           │  ──────                           │
│                           │  [🖼 logo.png] [📷 int-1.jpg]    │
│  ─────────────            │  [📷 menu.jpg]                    │
│  ჩემი დემო:               │                                    │
│  [ნახვა →]               │                                    │
│                           │                                    │
└───────────────────────────┴────────────────────────────────────┘
```

### Action Center — Status-Based დინამიკა

| `projects.status` | Action Center-ის შინაარსი | კლიენტს რა უნდა გააკეთოს |
|-------------------|--------------------------|--------------------------|
| `active_collecting` | "ატვირთეთ ლოგო და ფოტოები, რომ დავიწყოთ" | Upload |
| `active_designing` | "ჩვენი გუნდი მუშაობს დიზაინზე. მალე მოვიტანთ" | ლოდინი |
| `active_review` | "დიზაინი მზადაა! ნახეთ და გვაცნობეთ" | Review → Approve/Request Changes |
| `active_developing` | "დიზაინი დადასტურდა, ვიწყებთ კოდს!" | ლოდინი |
| `completed` | "🎉 თქვენი საიტი მზადაა! [ნახვა →]" | — |

### ჩატის სპეციფიკაცია

**კლიენტის მხარე:**
- iMessage-ის სტილი. ჩვენი ბუშტი მარცხნივ, კლიენტისა — მარჯვნივ.
- ტექსტი (Enter → გაგზავნა).
- ფაილი: 📎 → ატვირთვა პირდაპირ ჩატში → ავტომატურად ხვდება Assets-ში.
- **Supabase Realtime:** ადმინის პასუხი მყისიერად ჩანს (0 refresh).
- **სისტემური მMessages:** ნაცრისფერი ბუშტი. *"სტატუსი: 'დიზაინი' → 'კოდი' — 2026-04-05 16:00".*
- **Offline შეტყობინება:** კლიენტი offline-ია → 10 წუთში მისდის მეილი: *"Sitely-ს გუნდმა მოგწერათ. [კაბინეტში შესვლა →]"* (Magic Link-ით, ისე რომ მყისიერად შემოვა).

**კლიენტის ჩატის ლიმიტები:**
- ყველაფერი ნებადართულია: ტექსტი, PNG, JPG, SVG, PDF, GIF.
- მახ. ფაილი: 10MB.
- Auto-categorization: სისტემა ინახავს PNG/SVG ფაილებს `logo/` ფოლდერში, JPG/WEBP → `photos/`, PDF → `documents/`.

---

## SESSION-ის განგრძობა (Re-auth)

კლიენტი ხვალ ბრუნდება. სესია ამოწურულია.

`/portal` → Redirect → `/portal/login`:
```
┌───────────────────────────────────┐
│                                   │
│  კაბინეტში შესასვლელად შეიყვანეთ │
│  თქვენი ელ-ფოსტა:               │
│                                   │
│  [giorgi@company.ge             ] │
│                                   │
│  [→ შესასვლელი ლინკის გაგზავნა]  │
│                                   │
│  (ლინკი მოქმედებს 24 საათი)      │
│                                   │
└───────────────────────────────────┘
```

---

# ნაწილი III: DATA MODEL (სრული სქემა)

## ახალი ცხრილები

### `packages` — ფასიანი პაკეტების ბლუპრინტები (ადმინი ქმნის)

```sql
CREATE TABLE packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,          -- "სტანდარტული", "პრემიუმ", "E-Commerce"
  description   TEXT,
  base_price    NUMERIC(10,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'GEL',
  features      JSONB NOT NULL,
  -- {
  --   "included": ["ჰოსტინგი 1 წ.", "მობ. ვერსია", "5 გვ."],
  --   "excluded": ["დომენი", "ლოგო"],
  --   "addons": [{"name": "SEO", "price": 150}]
  -- }
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `proposals` — გაყინული შეთავაზებები კონკრეტული კლიენტებისთვის

```sql
CREATE TABLE proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  package_id    UUID REFERENCES packages(id) ON DELETE SET NULL,

  -- IMMUTABLE SNAPSHOT (არ იცვლება Package-ის განახლებისას!)
  snapshot      JSONB NOT NULL,
  -- {
  --   "price": 500,
  --   "currency": "GEL",
  --   "title": "სტანდარტული რესტ. პაკეტი",
  --   "included": ["ჰოსტინგი", "მობ. ვერსია"],
  --   "excluded": ["დომენი (+40₾/წ)"]
  -- }

  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),

  payment_method TEXT,                  -- 'stripe', 'bank_transfer'
  paid_at       TIMESTAMPTZ,
  stripe_session_id TEXT,

  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_project ON proposals (project_id);
CREATE INDEX idx_proposals_status ON proposals (status);
```

### `projects` — კლიენტის პროექტი (განახლებული სტატუსებით)

```sql
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  demo_id          UUID REFERENCES demos(id) ON DELETE SET NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT NOT NULL,
  client_phone     TEXT NOT NULL,
  client_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'lead_new'
    CHECK (status IN (
      -- ACT I (Pre-Sale):
      'lead_new',           -- ფორმა შევსებულია, Magic Link გაგზავნილი
      'lead_negotiating',   -- ჩატით ან ტელეფონით მოლაპარაკებაშია
      'proposal_sent',      -- Proposal გაგზავნილია, ველოდებით გადახდას
      -- ACT II (Production):
      'active_collecting',  -- გადახდილია! ველოდებით მასალებს
      'active_designing',   -- დიზაინის ეტაპი
      'active_developing',  -- დეველოპმენტის ეტაპი
      'active_review',      -- კლიენტი ამოწმებს
      'completed',          -- დასრულებულია
      -- სხვა:
      'cancelled',          -- გაუქმებულია
      'lost'                -- კლიენტი ვერ შემოვინარჩუნეთ
    )),

  admin_notes      TEXT,
  assigned_to      TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);
```

### `project_timeline_steps` — დინამიური სტეპები (ადმინი ქმნის Pro-ect-ს)

```sql
CREATE TABLE project_timeline_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_order   INTEGER NOT NULL,
  title        TEXT NOT NULL,       -- "ლოგო/ფოტოების ატვირთვა"
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'active', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_steps_project ON project_timeline_steps (project_id);
CREATE UNIQUE INDEX idx_steps_order ON project_timeline_steps (project_id, step_order);
```

### `messages` — Realtime ჩატი

```sql
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES auth.users(id),
  sender_role  TEXT NOT NULL CHECK (sender_role IN ('client', 'admin')),
  content      TEXT,                 -- ტექსტი
  file_url     TEXT,                 -- Supabase Storage URL
  file_name    TEXT,
  file_type    TEXT,                 -- MIME type
  file_size    INTEGER,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  is_system    BOOLEAN NOT NULL DEFAULT false,  -- სტატუსის ცვლ. შეტყობინება
  is_internal  BOOLEAN NOT NULL DEFAULT false,  -- ადმინის შიდა ჩანაწ. (კლ. ვერ ხედავს)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_project ON messages (project_id);
CREATE INDEX idx_messages_unread  ON messages (project_id, is_read) WHERE is_read = false;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### `project_files` — ცენტრალიზებული ფაილების ბაზა

```sql
CREATE TABLE project_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES auth.users(id),
  file_url     TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('logo', 'photo', 'document', 'general')),
  message_id   UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## RLS პოლიტიკები

```sql
-- projects: კლიენტი ხედავს მხოლოდ საკუთარს
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own" ON projects FOR SELECT
  USING (client_user_id = auth.uid()
         OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin');
CREATE POLICY "admin_all" ON projects FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- proposals: კლიენტი ხედავს მხოლოდ საკუთარს
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_proposal" ON proposals FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
         OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin');
CREATE POLICY "admin_all_proposal" ON proposals FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- messages: კლიენტი ხედავს მხოლოდ საკუთარის, internal=false
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_read_messages" ON messages FOR SELECT
  USING (
    is_internal = false
    AND project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
    OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
  );
CREATE POLICY "client_write_messages" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_internal = false
    AND project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );
CREATE POLICY "admin_all_messages" ON messages FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- project_timeline_steps: კლიენტი ხედავს საკუთარის
ALTER TABLE project_timeline_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_read_steps" ON project_timeline_steps FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
         OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin');
CREATE POLICY "admin_all_steps" ON project_timeline_steps FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');
```

## Supabase Storage

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', false);

CREATE POLICY "client_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE client_user_id = auth.uid()
    )
  );

CREATE POLICY "client_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-assets' AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM projects WHERE client_user_id = auth.uid()
      )
      OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
    )
  );
```

---

# ნაწილი IV: ADMIN CMS — Inbox & Project Control

## 6.1 სამ-სვეტიანი Inbox (Helpdesk მოდელი)

```
┌──────────────┬─────────────────────────────┬──────────────────────┐
│  INBOX       │  ACTIVE CHAT                │  PROJECT CONTEXT     │
│  ──────      │  ───────────                │  ───────────────     │
│              │                             │                      │
│ 🔴 Wine M.   │  Wine Merchants             │  კომპ.: Wine Merch.  │
│  3 new msgs  │  გიორგი ბერიძე             │  Tier: 1 HOT         │
│  lead_negot. │                             │  წყ. მეილი:          │
│ ──────────   │  [🤖] პროექტი შეიქმნა...   │  info@wine.ge        │
│ 🟡 Dental    │                             │  კლ. მეილი:          │
│  proposal    │  გიორგი: ლოგო გაქვთ?       │  giorgi@wine.ge      │
│  sent        │                             │  ტელ: 599 12 34 56   │
│ ──────────   │  ✏️ [შიდა ჩანაწ.]: "ლოგო   │                      │
│ 🟢 Cafe Roma │   ელოდება ნინოს"            │  შაბლ: Kinetic Rest. │
│  designing   │                             │  ──────────────────  │
│ ──────────   │  You: მადლობა! ნინო         │  STATUS: [lead_neg ▾]│
│ 🟢 Bio Farm  │  გონვლ. გავუგზავნეთ        │                      │
│  collecting  │  ლოგოს მოლოდინში.           │  PROPOSAL:           │
│              │                             │  500₾ · pending      │
│              │  ┌────────────────────────┐ │  [✏️ რედაქტირება]    │
│              │  │ მესიჯი...   📎  /  ➤  │ │  [→ Send to Client]  │
│              │  └────────────────────────┘ │                      │
│              │                             │  TIMELINE:           │
│              │  [/logo] [/review] [/done]  │  [+ ნაბიჯის დამ.]   │
│              │  (Saved Replies)            │  [→ Publish Steps]   │
└──────────────┴─────────────────────────────┴──────────────────────┘
```

## 6.2 ადმინის Quick Actions

| ქმედება | ეფექტი |
|---------|--------|
| სტატუსის ცვლილება | `projects.status` განახლება + სისტ. მMessage ჩატში + მეილი კლიენტს |
| `[→ Send Proposal]` | `proposals.status = 'pending'` + კლიენტის ეკრანი განახლდება |
| `[✓ Mark as Paid]` | `proposals.status = 'accepted'` + `projects.status = 'active_collecting'` |
| `[+ ნაბიჯის დამ.]` | ახალი `project_timeline_steps` ჩანაწერი |
| `[→ Publish Steps]` | კლიენტის Timeline გამოჩნდება კაბინეტში |
| Saved Reply `/logo` | ჩასვამს: "გთხოვთ ატვირთოთ ლოგო (PNG/SVG)" |
| Saved Reply `/review` | ჩასვამს: "ახალი ვერსია მზადაა, გთხოვთ განიხილოთ" |
| Internal Note `✏️` | ყვითელი ბუშტი — კლიენტს ვერ ჩანს |

## 6.3 Inbox-ის დახარისხება (SLA ლოგიკა)

| პოზიცია | კრიტერიუმი |
|---------|-----------|
| 🔴 ყველაზე ზემოთ | კლიენტს გამოუგზავნია მMessage, ჩვენ ჯერ არ გვიპასუხია (>30 წთ) |
| 🟡 შუა | Proposal გაგზავნილია, ველოდებით გადახდას |
| 🟢 ბოლო | "ბურთი ჩვენს მოედანზეა" — ვმუშაობთ, კლიენტს ბოლო ნახვა ≤ 2 სთ |

---

# ნაწილი V: API ენდპოინტები (სრული სია)

| Method | Path | Auth | აღწერა |
|--------|------|------|--------|
| `POST` | `/api/portal/claim` | Public | Claim ფორმა → User + Project + Magic Link |
| `POST` | `/api/portal/reauth` | Public | ხელახლა Magic Link მეილის გაგზავნა |
| `GET` | `/api/portal/project` | Client | კლიენტის Project + Proposal + Steps |
| `GET` | `/api/portal/messages` | Client | Paginated messages სია |
| `POST` | `/api/portal/messages` | Client | ახალი მMessage (ტექსტი ან ფაილი) |
| `PATCH` | `/api/portal/messages/read` | Client | წაკითხულად მონიშვნა |
| `POST` | `/api/portal/upload` | Client | ფაილის ატვირთვა Supabase Storage-ში |
| `POST` | `/api/portal/checkout` | Client | Stripe Session-ის შექმნა |
| `POST` | `/api/portal/payment/webhook` | Stripe | Webhook → `proposals.status = accepted` |
| `GET` | `/api/projects` | Admin | პროექტების სია (ფილტრ., pages.) |
| `GET` | `/api/projects/[id]` | Admin | ერთი პროექტი + messages + steps + files |
| `PATCH` | `/api/projects/[id]` | Admin | სტატუსი, notes, assigned_to |
| `POST` | `/api/projects/[id]/proposal` | Admin | ახალი/განახლებული Proposal |
| `POST` | `/api/projects/[id]/steps` | Admin | Timeline-ის სტეპების შექმნა |
| `PATCH` | `/api/projects/[id]/steps/[sid]` | Admin | სტეპის სტატუსის ცვლილება |
| `POST` | `/api/projects/[id]/messages` | Admin | ადმინის Message გაგზავნა |
| `GET` | `/api/packages` | Admin | პაკეტების სია |
| `POST` | `/api/packages` | Admin | ახალი პაკეტის შექმნა |
| `PATCH` | `/api/packages/[id]` | Admin | პაკეტის განახლება |

---

# ნაწილი VI: კომპონენტების სტრუქტურა

## Portal (კლიენტის მხარე)

```
src/components/sections/portal/
├── PortalProvider/          ✅ (გასაფართოებელი — projects, proposals, messages)
├── PortalDashboard/         ✅ (სრულად გადასაკეთებელი Two-Act ლოგიკით)
├── ProposalCard/            ❌ ახალი — Standard Proposal ბარათი
│   ├── ProposalCard.tsx
│   └── ProposalCard.module.css
├── UpsellCard/              ❌ ახალი — Custom/Premium ბარათი
│   ├── UpsellCard.tsx
│   └── UpsellCard.module.css
├── CheckoutOptions/         ❌ ახალი — ბარათი / გადარიცხვა
│   ├── CheckoutOptions.tsx
│   └── CheckoutOptions.module.css
├── ActionCenter/            ❌ ახალი — Status-based dynamic block
│   ├── ActionCenter.tsx
│   └── ActionCenter.module.css
├── PortalChat/              ❌ ახალი — Realtime Chat
│   ├── PortalChat.tsx
│   └── PortalChat.module.css
├── ChatBubble/              ❌ ახალი — ერთი ბუშტი
│   ├── ChatBubble.tsx
│   └── ChatBubble.module.css
├── FileUploader/            ❌ ახალი — Drag & Drop
│   ├── FileUploader.tsx
│   └── FileUploader.module.css
├── AssetGallery/            ❌ ახალი — ფაილების გალერეა
│   ├── AssetGallery.tsx
│   └── AssetGallery.module.css
├── ProjectTimeline/         ✅ (გასაფართოებელი dynamic steps-ით)
├── ClaimForm/               ❌ ახალი — 3-step Typeform
│   ├── ClaimForm.tsx
│   └── ClaimForm.module.css
└── ReauthForm/              ❌ ახალი — Magic Link re-request
    ├── ReauthForm.tsx
    └── ReauthForm.module.css
```

## CMS Admin (ადმინის მხარე)

```
src/components/sections/cms/
├── ProjectsPage/            ❌ ახალი
├── ProjectsBoard/           ❌ ახალი — Kanban
├── ProjectCard/             ❌ ახალი
├── ProjectDetailPage/       ❌ ახალი — 3-column layout
├── AdminChat/               ❌ ახალი — Realtime + Internal Notes
├── ProposalBuilder/         ❌ ახალი — Snapshot-ის შემქმნელი
├── TimelineBuilder/         ❌ ახალი — Steps-ის შემქმნელი
├── PackagesPage/            ❌ ახალი — Packages CRUD
└── ProjectFilesPanel/       ❌ ახალი
```

## ახალი Pages (Routes)

```
src/app/
├── claim/[hash]/page.tsx    ❌ — ClaimForm (Standalone)
├── portal/
│   ├── page.tsx             ✅ (გადასაკეთებელი)
│   └── login/page.tsx       ❌ — ReauthForm
└── secure-access/
    ├── projects/
    │   ├── page.tsx         ❌ — ProjectsBoard
    │   └── [id]/page.tsx    ❌ — ProjectDetailPage
    └── packages/
        └── page.tsx         ❌ — PackagesPage
```

---

# ნაწილი VII: Inngest Background Jobs

| Job | ტრიგერი | ქმედება |
|-----|---------|---------|
| `portal/claim.submitted` | Claim ფორმა | Magic Link + ადმინის შეტყობინება + სისტ. Chat message |
| `portal/proposal.sent` | Admin → Send Proposal | კლიენტს მეილი: "შეთავაზება მზადაა" |
| `portal/payment.confirmed` | Stripe Webhook | სტატუსი → `active_collecting` + Realtime update |
| `portal/status.changed` | Admin → status change | კლიენტს მეილი + სისტ. Chat message |
| `portal/step.activated` | Admin → step active | კლიენტს მეილი: "ახალი ეტაპი დაიწყო" |
| `portal/messages.reminder` | Cron (ყოველ 4 სთ) | გაუპასუხ. კლიენტ. messages-ების შემოწმება → ადმინის შეტყობინება |
| `portal/offline.notify` | კლიენტი offline > 10 წთ | კლიენტს მეილი ახალ Admin Message-ზე |

---

# ნაწილი VIII: მეილის ტემპლეიტები

| # | ტრიგერი | Subject | ძ. ელემენტი |
|---|---------|---------|------------|
| 1 | Claim ფორმა | "პორტალი მზადაა! შედით →" | Magic Link |
| 2 | Re-auth | "შესასვლელი ლინკი →" | Magic Link |
| 3 | Proposal გაგზავნა | "შეთავაზება მზადაა განხილვისთვის" | [კაბინეტში ნახვა →] |
| 4 | გადახდა დადასტურდა | "გილოცავთ! 🎉 ვიწყებთ." | [კაბინეტი →] |
| 5 | ახ. ადმ. Message | "Sitely-ს გუნდმა გამოგიგზავნათ" | [პასუხი ჩატში →] |
| 6 | Status → review | "ახალი ვერსია დასადასტ.!" | [ნახვა →] |
| 7 | Status → completed | "თქვენი საიტი მზადაა! 🎉" | [საიტი →] |

---

# ნაწილი IX: Sprint Plan (განვითარების რიგი)

## Sprint 1: ფუნდამენტი (3 დღე)
- [ ] Migration: `packages`, `proposals`, `projects` (ახ. status), `project_timeline_steps`, `messages`, `project_files`
- [ ] RLS ყველა ახ. ცხრილზე
- [ ] Storage Bucket `project-assets`
- [ ] `POST /api/portal/claim` — სრული ლოგიკა
- [ ] Magic Link მეილის ტემპლეიტი (#1)
- [ ] CTA ფორმის მოდიფიკაცია დემო Viewer-ში (email ველის დამ.)

## Sprint 2: Act I — Proposal & Checkout (3 დღე)
- [ ] `packages` CRUD: `GET/POST/PATCH /api/packages`
- [ ] `proposals` API: `POST/PATCH /api/projects/[id]/proposal`
- [ ] `ProposalCard` + `UpsellCard` კომ.
- [ ] `CheckoutOptions` კომ.
- [ ] Stripe Session: `POST /api/portal/checkout`
- [ ] Stripe Webhook: `POST /api/portal/payment/webhook`
- [ ] Bank Transfer ვარიანტი + ადმინის `[✓ Mark as Paid]`
- [ ] `PackagesPage` CMS-ში

## Sprint 3: Act II — Portal Production UI (3 დღე)
- [ ] `PortalProvider` გაფართოება (project + proposal + steps + messages)
- [ ] `ActionCenter` კომ. (status-based dynamic)
- [ ] `PortalChat` + `ChatBubble` + Realtime
- [ ] `FileUploader` (Drag & Drop → Storage)
- [ ] `AssetGallery`
- [ ] `ProjectTimeline` გაფართოება (dynamic steps)
- [ ] `/portal/login` გვერდი (ReauthForm)

## Sprint 4: Admin Inbox (2 დღე)
- [ ] `GET/PATCH /api/projects/[id]`
- [ ] 3-column `ProjectDetailPage` (Inbox | Chat | Context)
- [ ] `AdminChat` Realtime + Internal Notes
- [ ] `TimelineBuilder` + `POST /api/projects/[id]/steps`
- [ ] Saved Replies (`/logo`, `/review`, `/done`)
- [ ] SLA-based Inbox sorting
- [ ] `ProjectsBoard` (Kanban)

## Sprint 5: ავტომატიზაცია (2 დღე)
- [ ] Inngest: ყველა Job (claim, proposal, payment, status, offline)
- [ ] მეილის ყველა ტემპლეიტი (#1—#7)
- [ ] Unread message reminder Cron
- [ ] Mobile responsive audit

---

# ნაწილი X: უსაფრთხოების ჩეკლისტი

- [ ] Magic Link ტოკენი: ერთჯერადი, 24სთ TTL, `onboard_tokens`
- [ ] `app_metadata.role` ვალიდაცია ყველა protected route-ზე
- [ ] RLS: კლიენტი ვერ ხედავს სხვის Project-ს / Proposal-ს / Messages-ს
- [ ] Storage: კლიენტი ვერ წვდება სხვის S3 ფოლდერს
- [ ] `is_internal = true` messages: კლიენტის RLS-ში გაფილტრული
- [ ] Claim API Rate Limit: 5 req/IP/სთ
- [ ] File Upload: server-side MIME validation + max 10MB
- [ ] Chat: XSS sanitization (HTML escape)
- [ ] Honeypot ველი Claim ფორმაში
- [ ] Stripe Webhook Signature Verification (`stripe-signature` header)
- [ ] Proposals: კლიენტი ვერ შეცვლის `snapshot`-ს (server-only)
- [ ] CORS: `/api/portal/*` → მხოლოდ sitely.ge
