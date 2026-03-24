/**
 * Adds challenge, solution, results fields to every portfolio project.
 * Run: node scripts/add-project-details.mjs
 */
import fs from "fs";

const src = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8");

/* Per-project detail data keyed by slug */
const DETAILS = {
  "velour-beauty": {
    challenge: "Creating an online beauty shopping experience that rivals in-store try-ons, with a product catalog spanning hundreds of shades and textures.",
    solution: "Built an AR try-on integration with real-time face tracking, a 3D lipstick configurator, and a shade-matching algorithm that recommends products based on skin tone selfies.",
    results: ["42% increase in add-to-cart rate", "28% reduction in product returns", "Average session duration up 3.2\u00d7"],
  },
  "nordik-outdoor": {
    challenge: "Capturing the rugged outdoor brand identity in a digital space while providing a practical shopping experience for technical gear.",
    solution: "360\u00b0 product views using Three.js, dynamic weather-based product recommendations, AI-powered size guide, and an expedition journal feature to build brand community.",
    results: ["55% increase in conversion rate", "30% fewer size-related returns", "Featured in Scandinavian Design Awards"],
  },
  "luminary-watches": {
    challenge: "Translating the tactile luxury of Swiss watchmaking \u2014 weight, craftsmanship, movement \u2014 into a digital retail experience.",
    solution: "WebGL-powered 3D watch configurator with photorealistic rendering, real-time engraving preview, a virtual concierge booking system, and white-glove delivery tracking.",
    results: ["68% of sales initiated through configurator", "Average order value up 35%", "2\u00d7 increase in concierge bookings"],
  },
  "botanica-market": {
    challenge: "Building a seamless farm-to-table marketplace that handles real-time inventory from multiple local farms with complex delivery logistics.",
    solution: "Real-time inventory sync with farm partners via Supabase, locality-based delivery scheduling, smart subscription box curation, and freshness guarantee system.",
    results: ["10K+ active subscribers in 6 months", "98.5% delivery satisfaction rate", "45% of customers on recurring subscriptions"],
  },
  "revolta-motors": {
    challenge: "Making the EV buying process engaging and informative \u2014 configuring a vehicle involves hundreds of combinations with real-time pricing impacts.",
    solution: "Interactive 3D vehicle configurator with real-time pricing, range calculator based on driving patterns, side-by-side model comparison, and seamless financing integration.",
    results: ["73% of test drive bookings from configurator", "4.2\u00d7 longer engagement than previous site", "22% increase in online deposits"],
  },
  "aether-audio": {
    challenge: "Differentiating in a crowded headphone market \u2014 customers can\u2019t feel or hear products online, making purchase decisions difficult.",
    solution: "Web Audio API-powered comparison tool letting users hear real-time audio profiles, 3D product exploration, personalized sound profile matching quiz, and audiophile community forum.",
    results: ["51% higher conversion vs. industry average", "3.8\u00d7 more product page engagement", "NPS score of 72"],
  },
  "casa-ceramica": {
    challenge: "Connecting artisan ceramic makers with global buyers while preserving the handcraft story and enabling unique, one-of-a-kind product purchases.",
    solution: "Each product linked to its artisan\u2019s story and kiln, an interactive glaze color picker for custom orders, kiln-to-door tracking, and a virtual studio tour experience.",
    results: ["60% of sales from custom glaze orders", "Artisan revenue increased 3\u00d7", "Featured in Design Milk and Dezeen"],
  },
  "apex-supplements": {
    challenge: "Simplifying the overwhelming supplement market \u2014 customers struggle to build effective stacks without expert guidance.",
    solution: "AI-driven supplement stack builder analyzing user goals, dietary restrictions and existing supplements. Macro calculators, subscription management, and progress tracking dashboard.",
    results: ["35% higher average order value", "78% subscription retention at 6 months", "4.5-star average product rating"],
  },
  "stellar-space": {
    challenge: "Making complex satellite constellation data accessible to both researchers and the general public through an engaging interactive experience.",
    solution: "Real-time 3D orbital tracking with WebGL-rendered Earth, custom GLSL shaders for atmospheric effects, time-lapse orbit visualization, and educational layer overlays.",
    results: ["Used by 3 universities for research", "50K+ unique visitors in first month", "Featured in NASA\u2019s web showcase"],
  },
  "vertigo-studios": {
    challenge: "Showcasing motion design work in a portfolio that itself demonstrates mastery \u2014 the website needs to be as impressive as the work it presents.",
    solution: "Full-screen 3D scene transitions between projects, particle morphing effects, GPU-accelerated video playback, and a custom WebGL cursor that reacts to content.",
    results: ["Awwwards Site of the Day nomination", "Client inquiries increased 4\u00d7", "Average session duration: 6.5 minutes"],
  },
  "atlas-geography": {
    challenge: "Presenting multi-layered geographic data in an intuitive way that serves both casual explorers and professional researchers.",
    solution: "Interactive 3D globe with Mapbox integration, terrain elevation rendering, climate overlay layers, population density heatmaps, and data export capabilities for researchers.",
    results: ["Adopted by 12 research institutions", "3M+ data points rendered in real-time", "Government partnership for climate data"],
  },
  "neuron-lab": {
    challenge: "Communicating cutting-edge AI research in a visually compelling way that attracts top talent and research partnerships.",
    solution: "Real-time neural network visualization responding to user mouse input via custom GLSL shaders, interactive research paper browser, and a live model demo playground.",
    results: ["Research applications up 65%", "Media features in Wired and MIT Tech Review", "3\u00d7 increase in partnership inquiries"],
  },
  "oceanic-dive": {
    challenge: "Recreating the awe of deep-sea exploration in the browser \u2014 making users feel the depth, pressure, and wonder of the ocean floor.",
    solution: "Scroll-driven depth navigation through 3D underwater environments, bioluminescent creature animations, realistic water caustics, and educational species information cards.",
    results: ["Webby Awards Best Visual Design", "2M+ online visitors", "Partnership with National Geographic"],
  },
  "prism-architecture": {
    challenge: "Replacing physical model presentations \u2014 clients need to visualize buildings in context with realistic lighting and materials before construction.",
    solution: "Real-time 3D building walkthroughs in browser, dynamic sunlight simulation based on time and season, material configuration tool, and virtual client presentation mode.",
    results: ["Client approval time reduced by 60%", "Physical model costs eliminated", "15 new client acquisitions from website"],
  },
  "flowdesk-crm": {
    challenge: "Building a CRM that sales teams actually want to use \u2014 most CRMs suffer from complexity overload and poor user experience.",
    solution: "Visual pipeline management with drag-and-drop, AI-powered lead scoring that learns from team behavior, automated email sequences, and a real-time analytics dashboard.",
    results: ["Teams report 40% less time on admin", "Lead conversion rate up 28%", "4.7-star rating on G2"],
  },
  "cipher-security": {
    challenge: "Making cybersecurity monitoring actionable \u2014 security teams are overwhelmed with alerts and need real-time, visual threat intelligence.",
    solution: "Real-time threat visualization with D3.js, global attack origin map with WebSocket updates, automated incident response workflows, and AI-powered alert prioritization.",
    results: ["Mean time to detect reduced by 70%", "False positive alerts down 45%", "SOC team efficiency improved 3\u00d7"],
  },
  "syncboard-pm": {
    challenge: "Creating a project management tool that handles both high-level planning and day-to-day task management without context-switching between apps.",
    solution: "Real-time collaborative Kanban boards with WebSocket sync, integrated Gantt charts, time tracking, AI-generated task breakdowns, and automated standup report generation.",
    results: ["Team productivity up 35%", "Meeting time reduced by 40%", "50K+ active teams"],
  },
  "voxel-analytics": {
    challenge: "Making business intelligence accessible to non-technical users while providing the depth that data analysts need.",
    solution: "3D data visualization with intuitive interactions, drag-and-drop custom report builder, predictive analytics with ML models, and natural language query interface.",
    results: ["Report creation time reduced 80%", "Adopted by 200+ enterprises", "Best BI Tool \u2014 SaaS Awards 2025"],
  },
  "pulse-devops": {
    challenge: "Unifying fragmented DevOps tooling \u2014 teams use 5-10 different tools for CI/CD, monitoring, and deployment with no single source of truth.",
    solution: "CI/CD pipeline visualization, container orchestration dashboard with real-time logs, uptime analytics, incident management with PagerDuty integration, and deployment rollback UI.",
    results: ["Deployment frequency up 3\u00d7", "MTTR reduced by 55%", "99.95% platform uptime"],
  },
  "echoai-assistant": {
    challenge: "Building an AI assistant platform that enterprises trust \u2014 requiring security, customization, and seamless knowledge base integration.",
    solution: "Conversational UI with streaming responses, custom knowledge base RAG integration, multi-language support in 30+ languages, enterprise SSO and audit logging.",
    results: ["85% of queries resolved without human handoff", "Onboarding time reduced 60%", "SOC 2 Type II certified"],
  },
  "meridian-capital": {
    challenge: "Communicating financial expertise and trustworthiness while standing out in a sea of conservative, template-driven financial websites.",
    solution: "Dynamic market data dashboards, interactive portfolio performance visualizations, secure client portal with document management, and AI-powered market insight summaries.",
    results: ["New client inquiries up 85%", "Client portal adoption rate: 92%", "Best Financial Site \u2014 Webby 2025"],
  },
  "quantum-consulting": {
    challenge: "Establishing digital presence for a management consulting firm that rivals the Big Four \u2014 the brand needs to command immediate authority.",
    solution: "Data-driven case study showcases with interactive result visualizations, thought leadership content hub, consultant profile system, and a self-service assessment tool.",
    results: ["Lead generation up 120%", "Content engagement 4\u00d7 industry average", "3 Fortune 500 client acquisitions"],
  },
  "zenith-law": {
    challenge: "Making a law firm approachable online while maintaining the gravitas and professionalism clients expect from legal counsel.",
    solution: "Practice area deep-dives with interactive case outcome visualizations, attorney matching tool, secure document portal, consultation scheduler, and legal resource library.",
    results: ["Online consultations up 200%", "Client acquisition cost down 45%", "Top 10 legal website \u2014 Legal Tech Awards"],
  },
  "bridge-ventures": {
    challenge: "Creating a VC firm website that attracts both top-tier startups seeking funding and institutional LPs evaluating the fund.",
    solution: "Interactive portfolio showcase with company growth metrics, thesis-driven investment filter, founder application portal, LP dashboard with fund performance analytics.",
    results: ["Deal flow applications up 3\u00d7", "LP reporting time reduced 70%", "Featured in TechCrunch"],
  },
  "atlas-logistics": {
    challenge: "Modernizing the digital presence of a global logistics company \u2014 making complex supply chain services understandable and accessible.",
    solution: "Real-time shipment tracking interface, interactive supply chain visualization, service comparison calculator, quote request builder, and a logistics knowledge center.",
    results: ["Quote requests increased 90%", "Customer self-service up 65%", "Support ticket volume down 40%"],
  },
  "apex-energy": {
    challenge: "Communicating renewable energy solutions to both B2B industrial clients and residential customers with very different needs.",
    solution: "Dual-audience architecture with personalized journeys, solar panel ROI calculator, energy savings simulator, project gallery with interactive before/after comparisons.",
    results: ["Residential inquiries up 150%", "B2B lead quality improved 55%", "Carbon offset calculator used 100K+ times"],
  },
  "aurora-resorts": {
    challenge: "Capturing the magical experience of a luxury Northern resort through digital \u2014 making guests feel the atmosphere before they arrive.",
    solution: "Immersive visual storytelling with parallax scroll, real-time aurora forecast integration, 360\u00b0 room tours, seasonal activity calendar, and a bespoke booking system.",
    results: ["Direct bookings up 65% (vs OTA)", "Average booking value increased 40%", "TripAdvisor Digital Excellence Award"],
  },
  "wanderlust-trails": {
    challenge: "Curating adventure travel itineraries that feel personalized \u2014 mass tourism sites feel generic while boutique agencies lack digital sophistication.",
    solution: "AI-powered itinerary builder based on travel style quiz, interactive trail maps with difficulty ratings, local guide matching, and a trip journaling feature.",
    results: ["78% of users complete the style quiz", "Repeat booking rate: 45%", "National Geographic travel partner"],
  },
  "sakura-ryokan": {
    challenge: "Bridging cultural expectations \u2014 presenting traditional Japanese hospitality in a way that resonates with international travelers unfamiliar with ryokan etiquette.",
    solution: "Cultural immersion experience with interactive etiquette guides, seasonal menu previews, onsen protocol animations, guided virtual tours, and multi-language concierge chat.",
    results: ["International bookings up 85%", "Guest satisfaction score: 4.9/5", "Japan Tourism Agency endorsed"],
  },
  "compass-cruises": {
    challenge: "Simplifying cruise booking \u2014 passengers face overwhelming ship, cabin, itinerary, and dining choice combinations with poor comparison tools.",
    solution: "Visual deck plan explorer, cabin comparison tool with 360\u00b0 views, interactive itinerary maps with port highlights, and AI-powered package recommendation engine.",
    results: ["Online bookings up 55%", "Cabin upgrade conversion: 32%", "Crew rating: 4.8/5 (new metric)"],
  },
  "alpine-lodges": {
    challenge: "Driving direct bookings for a boutique lodge network competing against Airbnb and booking platforms with their massive reach.",
    solution: "Dynamic pricing display with best-rate guarantee, real-time availability across properties, activity package builder, ski conditions integration, and loyalty program portal.",
    results: ["Direct bookings surpassed OTA channels", "Revenue per booking up 25%", "Guest return rate: 38%"],
  },
  "ember-safari": {
    challenge: "Selling high-value safari experiences online \u2014 customers need to trust a premium purchase based entirely on digital content.",
    solution: "Immersive video backgrounds of actual safari footage, interactive wildlife calendar, guide profile system with guest reviews, transparent pricing builder, and trip insurance integration.",
    results: ["Average booking value: $8,500", "Conversion rate 2.5\u00d7 industry average", "90% of customers leave reviews"],
  },
  "vitalis-clinic": {
    challenge: "Building patient trust online for a modern healthcare clinic \u2014 medical websites are notoriously clinical, cold, and hard to navigate.",
    solution: "Warm, approachable design with doctor profiles and patient stories, symptom checker tool, online appointment booking, telehealth integration, and health resource library.",
    results: ["Online bookings up 140%", "No-show rate reduced by 35%", "Patient satisfaction: 4.8/5"],
  },
  "serenity-wellness": {
    challenge: "Creating a digital space that evokes the calm and luxury of a physical wellness center \u2014 most spa websites feel generic and templated.",
    solution: "Ambient sound-reactive UI that changes with scroll, treatment builder with personalized recommendations, therapist matching system, membership portal, and gift card experience.",
    results: ["Membership sign-ups up 70%", "Gift card revenue increased 3\u00d7", "Best Wellness UX \u2014 Web Excellence Awards"],
  },
  "mindflow-therapy": {
    challenge: "Reducing stigma around mental health services \u2014 the platform needs to feel safe, private, and welcoming while handling sensitive clinical workflows.",
    solution: "Anonymous browsing mode, gentle therapist matching quiz, secure video sessions with WebRTC, mood journal with pattern visualization, and progress tracking dashboard.",
    results: ["Therapist match satisfaction: 92%", "Session completion rate: 88%", "5\u00d7 growth in first year"],
  },
  "kinetic-physio": {
    challenge: "Helping patients understand their recovery journey \u2014 physiotherapy exercises are hard to follow from text descriptions alone.",
    solution: "3D anatomy viewer showing affected areas, video exercise program builder, recovery tracking with data visualization, injury prevention educational modules, and progress gamification.",
    results: ["Exercise compliance up 65%", "Recovery time reduced by 20%", "PT referral rate: 78%"],
  },
  "bloom-fertility": {
    challenge: "Navigating an extremely sensitive healthcare journey \u2014 fertility patients need information, emotional support, and clinical precision from day one.",
    solution: "Treatment timeline visualization showing each step, cycle tracking integration, secure consultation booking, educational resource library, and community support forum.",
    results: ["Patient anxiety scores reduced 30%", "Initial consultation bookings up 95%", "Community engagement: 4K+ active users"],
  },
  "skyline-properties": {
    challenge: "Showcasing luxury real estate in a competitive market where buyers expect immersive experiences before scheduling viewings.",
    solution: "3D floor plan walkthroughs, dynamic neighborhood insights map with school districts and amenities, mortgage calculator, virtual staging tool, and agent matching system.",
    results: ["Virtual tour viewings: 500+ per listing", "Time on market reduced by 25%", "Agent productivity up 40%"],
  },
  "haven-homes": {
    challenge: "Pre-selling residential units in a development still under construction \u2014 buyers need to visualize unbuilt homes with confidence.",
    solution: "Interactive site plans with unit availability, sunlight simulation showing light throughout the day, unit comparison tool, construction progress timeline, and deposit system.",
    results: ["85% of units pre-sold before completion", "Sales cycle shortened by 40%", "Zero deposit refund requests"],
  },
  "pinnacle-towers": {
    challenge: "Marketing commercial real estate to corporate tenants \u2014 the decision involves multiple stakeholders evaluating location, floor plans, and lease terms.",
    solution: "3D building explorer with available floor plans, virtual office layout tool, tenant directory, lease inquiry system, and a stakeholder sharing feature for team decisions.",
    results: ["Lease inquiry volume up 75%", "Average deal close time: 30 days faster", "Building occupancy at 96%"],
  },
  "coastal-living": {
    challenge: "Selling the coastal lifestyle, not just properties \u2014 buyers are investing in a way of life and need to feel the community and environment.",
    solution: "Lifestyle-first design with community spotlights, interactive coastal map with surf and tide data, property listings with sunset view simulations, and local event calendar.",
    results: ["Inquiry-to-viewing rate: 65%", "Community page most visited section", "Median sale price up 12%"],
  },
  "urban-nest": {
    challenge: "Helping first-time buyers navigate the overwhelming urban apartment market \u2014 they need guidance, not just listings.",
    solution: "Guided apartment search with neighborhood personality matching, commute time calculator, first-buyer education resources, budget planner, and virtual open house system.",
    results: ["First-time buyer conversion up 85%", "Avg user completes 3 virtual tours", "Best PropTech UX \u2014 RE:TECH 2025"],
  },
  "maison-noir": {
    challenge: "Translating the exclusivity and craftsmanship of a Parisian fashion house into a digital storefront without losing the brand\u2019s mystique.",
    solution: "Minimalist editorial design with full-screen imagery, collection preview animations, private shopping appointment booking, made-to-measure configurator, and VIP client area.",
    results: ["Online revenue up 200%", "Private appointments booked 3\u00d7 more", "Vogue Digital feature"],
  },
  "esse-jewelry": {
    challenge: "Competing with mass-market jewelry e-commerce by emphasizing handcrafted quality and the personal story behind each piece.",
    solution: "Macro photography showcases with zoom details, artisan video stories, custom engraving preview tool, ring size finder with AR, and bespoke design consultation booking.",
    results: ["Average order value up 65%", "Custom design revenue: 40% of total", "Return rate under 2%"],
  },
  "atelier-blanc": {
    challenge: "Launching a direct-to-consumer bridal brand in a market dominated by in-store experiences and appointment-only boutiques.",
    solution: "Virtual try-on with body-type recommendations, fabric swatch request system, appointment booking for trunk shows, customization builder, and wedding timeline integration.",
    results: ["70% of brides start online", "Trunk show attendance up 150%", "Featured in Martha Stewart Weddings"],
  },
  "vanguard-menswear": {
    challenge: "Modernizing a heritage menswear brand \u2014 the website must appeal to younger customers without alienating the existing loyal base.",
    solution: "Editorial magazine-style design with seasonal lookbooks, AI-powered outfit builder, virtual fitting room, and a heritage corner celebrating the brand\u2019s 50-year history.",
    results: ["Under-35 customer segment up 80%", "Online sales grew 120%", "GQ Best Menswear E-Commerce award"],
  },
  "soleil-eyewear": {
    challenge: "Selling premium eyewear online where fit is everything \u2014 customers hesitate to buy without trying frames on their face.",
    solution: "AR virtual try-on using front camera, face-shape analysis for personalized recommendations, prescription integration, home try-on program coordination, and lens configurator.",
    results: ["AR try-on used by 68% of visitors", "Return rate: 4% (vs 15% industry avg)", "2\u00d7 repeat purchase rate"],
  },
  "ember-steakhouse": {
    challenge: "Capturing the sensory experience of a premium steakhouse \u2014 sizzle, aroma, ambiance \u2014 through a screen.",
    solution: "Cinematic video hero with kitchen footage, interactive tasting menu builder, chef\u2019s table booking experience, wine pairing recommendation engine, and live kitchen cam.",
    results: ["Online reservations up 90%", "Chef\u2019s table fully booked 3 months ahead", "OpenTable Top Digital Presence 2025"],
  },
  "sakana-omakase": {
    challenge: "Communicating the art of omakase to diners unfamiliar with the tradition \u2014 the experience needs to feel exclusive yet welcoming.",
    solution: "Seasonal menu story with ingredient sourcing visualization, chef\u2019s journey narrative, counter-seat booking with preference form, sake pairing guide, and omakase etiquette primer.",
    results: ["Bookings from new customers up 120%", "Average spend per cover up 25%", "Michelin Guide featured"],
  },
  "verde-kitchen": {
    challenge: "Positioning a plant-based restaurant as exciting rather than restrictive \u2014 the menu needs to excite even committed meat-eaters.",
    solution: "Ingredient-first visual design with farm spotlight stories, interactive seasonal menu with nutrition breakdowns, cooking class booking, and a referral program.",
    results: ["45% of diners are non-vegetarian", "Cooking class revenue: $15K/month", "James Beard semi-finalist"],
  },
  "crust-bakery": {
    challenge: "Scaling an artisan bakery beyond its neighborhood \u2014 the brand needs to maintain its handmade charm while building an online ordering system.",
    solution: "Daily bake schedule with real-time availability, pre-order system for specialty items, subscription bread box, baking class booking, and a behind-the-scenes sourdough cam.",
    results: ["Pre-orders: 60% of daily revenue", "Subscription retention: 82%", "Expanded from 1 to 4 locations"],
  },
  "noma-cocktails": {
    challenge: "Bringing the speakeasy experience online \u2014 the bar\u2019s brand is built on discovery, exclusivity, and unconventional cocktail innovation.",
    solution: "Hidden entry interaction on homepage, seasonal cocktail menu with ingredient stories, mixology masterclass booking, private event configurator, and a cocktail of the week newsletter.",
    results: ["Event bookings up 110%", "Masterclass seats sell out in 24h", "Tales of the Cocktail finalist"],
  },
  "parallax-studio": {
    challenge: "A creative agency portfolio that proves expertise through its own execution \u2014 the website must be the best case study in the entire portfolio.",
    solution: "Smooth parallax scroll choreography, custom WebGL transitions between projects, interactive case study format with before/after comparisons, and embedded prototypes.",
    results: ["Inbound leads up 5\u00d7 after launch", "Average RFP value increased 70%", "FWA Site of the Day"],
  },
  "mono-type": {
    challenge: "Showcasing typography design work where the medium IS the message \u2014 every pixel of the site must demonstrate typographic mastery.",
    solution: "Variable font playground where users experiment with custom typefaces, project showcases built entirely with typography, font licensing system, and type specimen generator.",
    results: ["Font downloads: 50K+ in first quarter", "Licensing revenue up 300%", "Type Directors Club Award"],
  },
  "frame-motion": {
    challenge: "A film production company needs to let their work speak \u2014 but video-heavy sites are notoriously slow and painful on mobile.",
    solution: "Adaptive video streaming with quality detection, cinematic project reel browser with lazy-loaded clips, crew directory with availability calendar, and production inquiry funnel.",
    results: ["Production inquiries up 85%", "Mobile bounce rate down 60%", "Average reel watch time: 4.2 min"],
  },
  "pixel-forge": {
    challenge: "Marketing an indie game studio to both players and publishers \u2014 two very different audiences with different expectations.",
    solution: "Playable browser demos embedded in project pages, development blog with build progress, community forum with upvote system, merch store, and publisher pitch deck portal.",
    results: ["Demo plays: 200K+ in first month", "Publisher meetings from website: 12", "Community: 15K active members"],
  },
  "sonance-music": {
    challenge: "Creating a music label website that feels like an experience, not a catalog \u2014 the brand identity should be inseparable from the sound.",
    solution: "Audio-reactive visual identity with Web Audio API, artist pages with embedded streaming players, release calendar with notifications, event ticketing, and vinyl pre-order system.",
    results: ["Vinyl pre-orders sell out consistently", "Artist page streams up 200%", "Pitchfork Best Label Site feature"],
  },
};

/* Read original file */
let content = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8");

/* For each project, inject challenge/solution/results before accentColor */
let updated = 0;
const failed = [];

for (const [slug, detail] of Object.entries(DETAILS)) {
  const resultsStr = detail.results.map(r => `      "${r}"`).join(",\n");

  // Match: description line(s) followed by accentColor
  const pattern = new RegExp(
    `(slug: "${slug}"[\\s\\S]*?description:\\s*\\n\\s*"[^"]*?",)\\s*\\n(\\s*accentColor:)`,
  );

  const replacement = `$1\n    challenge:\n      "${detail.challenge}",\n    solution:\n      "${detail.solution}",\n    results: [\n${resultsStr},\n    ],\n$2`;

  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    updated++;
  } else {
    failed.push(slug);
  }
}

if (failed.length) {
  console.log("Failed to match:", failed.join(", "));
  console.log("Trying alternative pattern...");

  for (const slug of failed) {
    const detail = DETAILS[slug];
    const resultsStr = detail.results.map(r => `      "${r}"`).join(",\n");

    // Try matching description that spans multiple lines or has different formatting
    const escSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const idx = content.indexOf(`slug: "${slug}"`);
    if (idx === -1) {
      console.log(`  Could not find slug: ${slug}`);
      continue;
    }

    // Find the accentColor line after this slug
    const afterSlug = content.slice(idx);
    const accentMatch = afterSlug.match(/(\n\s*)(accentColor:)/);
    if (!accentMatch) {
      console.log(`  Could not find accentColor for: ${slug}`);
      continue;
    }

    const insertPos = idx + accentMatch.index;
    const indent = accentMatch[1];
    const injection = `${indent}challenge:\n      "${detail.challenge}",${indent}solution:\n      "${detail.solution}",${indent}results: [\n${resultsStr},\n    ],`;

    content = content.slice(0, insertPos) + injection + content.slice(insertPos);
    updated++;
    console.log(`  Fixed ${slug} via fallback`);
  }
}

fs.writeFileSync("src/lib/portfolio-projects.ts", content);
console.log(`\nUpdated ${updated}/${Object.keys(DETAILS).length} projects`);
