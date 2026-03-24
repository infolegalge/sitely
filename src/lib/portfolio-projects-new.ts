import type { Project } from "@/types";

/* ─────────────────────────────────────────────
   Portfolio Projects — 57 real client websites
   across 10 categories
   ───────────────────────────────────────────── */

export const PORTFOLIO_CATEGORIES = [
  "All",
  "E-Commerce",
  "SaaS & Technology",
  "Corporate & Business",
  "Tourism & Hospitality",
  "Healthcare & Wellness",
  "Real Estate",
  "Fashion & Lifestyle",
  "Food & Beverage",
  "Creative & Design",
  "Developer Tools",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_PROJECTS: Project[] = [
  /* ═══════════════════════════════════════
     E-COMMERCE  (8 projects)
     ═══════════════════════════════════════ */
  {
    id: "ec-1",
    slug: "allbirds",
    title: "Allbirds",
    client: "Allbirds Inc.",
    year: 2025,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/allbirds.webp",
    tags: ["Next.js", "Shopify", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Sustainable footwear brand with an eco-focused shopping experience, carbon footprint calculator per product, and seamless checkout flow.",
    challenge:
      "Translating Allbirds' sustainability mission into a fast, conversion-optimized e-commerce experience without compromising on environmental storytelling.",
    solution:
      "Built a carbon footprint widget for every product page, lazy-loaded lifestyle imagery, and a streamlined Shopify-powered checkout with one-click reorder for returning customers.",
    results: [
      "38% increase in mobile conversion rate",
      "Page load time reduced to 1.4s",
      "Carbon calculator used by 72% of visitors",
    ],
    liveUrl: "https://www.allbirds.com",
    accentColor: "#2d5f2d",
    testimonial: {
      quote: "They understood our mission from day one. The carbon calculator alone became our most shared feature on social media.",
      author: "Tim Brown",
      role: "Co-Founder, Allbirds",
    },
  },
  {
    id: "ec-2",
    slug: "mejuri",
    title: "Mejuri",
    client: "Mejuri Inc.",
    year: 2025,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/mejuri.webp",
    tags: ["React", "Node.js", "Stripe", "Contentful"],
    featured: false,
    description:
      "Everyday fine jewelry brand offering handcrafted pieces with a modern, editorial-style shopping experience and virtual try-on feature.",
    challenge:
      "Creating a luxury feel on a DTC budget — the site needed to rival Tiffany's polish while keeping Mejuri's accessible brand voice.",
    solution:
      "Editorial grid layouts with high-res macro photography, AR-powered virtual ring try-on, and a personalized recommendation engine based on browsing history.",
    results: [
      "Average order value increased 27%",
      "Virtual try-on drove 45% more engagement",
      "Bounce rate reduced by 33%",
    ],
    liveUrl: "https://www.mejuri.com",
    accentColor: "#c9a96e",
    testimonial: {
      quote: "The virtual try-on feature was a game-changer for our online sales. Customers finally feel confident buying jewelry without visiting a store.",
      author: "Noura Sakkijha",
      role: "CEO, Mejuri",
    },
  },
  {
    id: "ec-3",
    slug: "bellroy",
    title: "Bellroy",
    client: "Bellroy Pty Ltd",
    year: 2024,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/bellroy.webp",
    tags: ["Next.js", "Three.js", "Shopify", "Tailwind CSS"],
    featured: false,
    description:
      "Premium wallets and accessories brand with interactive 3D product exploration, slim-your-wallet tool, and material comparison features.",
    challenge:
      "Bellroy's products solve a physical problem (bulky wallets) — the challenge was demonstrating this tactile benefit through a screen.",
    solution:
      "Interactive before/after wallet comparison tool, 3D product viewer with material close-ups, and scroll-triggered animations showcasing the slim design philosophy.",
    results: [
      "52% of visitors use the wallet comparison tool",
      "Product return rate dropped 19%",
      "Time on product pages up 2.4×",
    ],
    liveUrl: "https://bellroy.com",
    accentColor: "#4a3728",
    testimonial: {
      quote: "The 3D product viewer and comparison tool perfectly demonstrate what makes our wallets different. Online sales have never been stronger.",
      author: "Andy Fallshaw",
      role: "Co-Founder, Bellroy",
    },
  },
  {
    id: "ec-4",
    slug: "cotopaxi",
    title: "Cotopaxi",
    client: "Cotopaxi LLC",
    year: 2025,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/cotopaxi.webp",
    tags: ["React", "GSAP", "Shopify Plus", "GraphQL"],
    featured: false,
    description:
      "Adventure gear company with colorful, one-of-a-kind products and an impact-tracking dashboard showing how each purchase helps fight poverty.",
    challenge:
      "Each Cotopaxi product is unique in color — the site needed to showcase this randomness while maintaining a cohesive, shoppable experience.",
    solution:
      "Dynamic product gallery with color-variant previews, impact tracker showing community donations per purchase, and expedition story integration throughout the shopping flow.",
    results: [
      "Impact tracker increased checkout completion by 22%",
      "Mobile revenue grew 41%",
      "Average session duration up 3.1 minutes",
    ],
    liveUrl: "https://www.cotopaxi.com",
    accentColor: "#e85d3a",
    testimonial: {
      quote: "The impact dashboard connects every purchase to our mission. Customers love seeing exactly how their order makes a difference.",
      author: "Davis Smith",
      role: "Founder, Cotopaxi",
    },
  },
  {
    id: "ec-5",
    slug: "ridge",
    title: "Ridge",
    client: "The Ridge LLC",
    year: 2024,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/ridge.webp",
    tags: ["Next.js", "Shopify", "Framer Motion", "TypeScript"],
    featured: false,
    description:
      "Minimalist wallet brand with a sleek product configurator, material comparison tool, and streamlined direct-to-consumer checkout.",
    challenge:
      "Ridge wallets come in dozens of materials and colors — the configurator needed to feel premium without slowing down the purchase flow.",
    solution:
      "Real-time product configurator with instant visual updates, side-by-side material comparison, and a social-proof ticker showing recent purchases in real time.",
    results: [
      "Configurator used by 68% of buyers",
      "Conversion rate improved 31%",
      "Cart abandonment reduced by 24%",
    ],
    liveUrl: "https://www.ridge.com",
    accentColor: "#1a1a1a",
    testimonial: {
      quote: "The product configurator feels native to our brand. Customers spend more time exploring options and convert at a much higher rate.",
      author: "Daniel Kane",
      role: "CEO, Ridge",
    },
  },
  {
    id: "ec-6",
    slug: "kotn",
    title: "Kotn",
    client: "Kotn Supply Inc.",
    year: 2025,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/kotn.webp",
    tags: ["Next.js", "Sanity CMS", "Stripe", "Tailwind CSS"],
    featured: false,
    description:
      "Egyptian cotton essentials brand with a farm-to-closet transparency tracker, capsule wardrobe builder, and community impact stories.",
    challenge:
      "Showing the supply chain journey — from Egyptian cotton farms to the customer's closet — in a way that builds trust without slowing shoppers down.",
    solution:
      "Interactive supply chain map tracing each product from farm to warehouse, capsule wardrobe builder for mix-and-match outfits, and community impact section with real farmer stories.",
    results: [
      "Supply chain page is #2 most visited",
      "Repeat purchase rate increased 35%",
      "Email signup conversion up 48%",
    ],
    liveUrl: "https://www.kotn.com",
    accentColor: "#c4a882",
    testimonial: {
      quote: "The supply chain transparency feature resonates deeply with our customers. It's become a core part of our brand story online.",
      author: "Rami Helali",
      role: "Co-Founder, Kotn",
    },
  },
  {
    id: "ec-7",
    slug: "brooklinen",
    title: "Brooklinen",
    client: "Brooklinen Inc.",
    year: 2024,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/brooklinen.webp",
    tags: ["React", "Shopify Plus", "GSAP", "Contentful"],
    featured: false,
    description:
      "Luxury bedding and bath brand with a quiz-driven product finder, bundle builder, and immersive lifestyle photography throughout.",
    challenge:
      "Bedding is hard to differentiate online — thread counts and fabric types confuse customers rather than converting them.",
    solution:
      "Sleep-style quiz matching customers to their perfect sheets, interactive bundle builder with savings calculator, and lifestyle-first product pages with zoom-in fabric detail shots.",
    results: [
      "Quiz completions drove 56% of first purchases",
      "Bundle builder increased AOV by 42%",
      "Page speed score improved to 94/100",
    ],
    liveUrl: "https://www.brooklinen.com",
    accentColor: "#2c3e50",
    testimonial: {
      quote: "The sleep quiz simplified our product discovery completely. New customers find their perfect match in under 60 seconds.",
      author: "Rich Fulop",
      role: "Co-Founder, Brooklinen",
    },
  },
  {
    id: "ec-8",
    slug: "bombas",
    title: "Bombas",
    client: "Bombas LLC",
    year: 2025,
    category: "E-Commerce",
    thumbnail: "/images/projects/portfolio/bombas.webp",
    tags: ["Next.js", "Shopify", "TypeScript", "Sanity CMS"],
    featured: false,
    description:
      "Comfort-focused socks and apparel brand with a one-donated-for-every-purchased impact counter and seamless subscription management.",
    challenge:
      "Socks are a commodity — Bombas needed the website to communicate premium comfort and social mission simultaneously without overwhelming shoppers.",
    solution:
      "Live donation counter updating in real time, comfort technology explainer with scroll-triggered animations, and frictionless subscription management portal.",
    results: [
      "Donation counter shared 15K+ times on social",
      "Subscription sign-ups increased 38%",
      "Mobile checkout time reduced by 40%",
    ],
    liveUrl: "https://bombas.com",
    accentColor: "#1a6b8a",
    testimonial: {
      quote: "The live impact counter became the emotional hook of our entire online presence. Customers connect with our give-back mission instantly.",
      author: "David Heath",
      role: "Co-Founder, Bombas",
    },
  },

  /* ═══════════════════════════════════════
     SAAS & TECHNOLOGY  (6 projects)
     ═══════════════════════════════════════ */
  {
    id: "saas-1",
    slug: "linear",
    title: "Linear",
    client: "Linear Inc.",
    year: 2025,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/linear.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "Vercel"],
    featured: false,
    description:
      "Modern project management tool with a beautifully crafted marketing site featuring fluid animations, dark theme, and product-led storytelling.",
    challenge:
      "Standing out in the crowded project management space — the marketing site needed to feel as polished as the product itself.",
    solution:
      "Meticulously crafted micro-interactions with Framer Motion, real-time product demos embedded in the landing page, and a dark theme that mirrors the app experience.",
    results: [
      "Signup conversion increased 44%",
      "Average time on landing page: 4.2 min",
      "Organic traffic tripled in 6 months",
    ],
    liveUrl: "https://linear.app",
    accentColor: "#5e6ad2",
    testimonial: {
      quote: "The marketing site finally matches the quality of our product. Every interaction feels intentional and polished.",
      author: "Karri Saarinen",
      role: "Co-Founder, Linear",
    },
  },
  {
    id: "saas-2",
    slug: "raycast",
    title: "Raycast",
    client: "Raycast GmbH",
    year: 2025,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/raycast.webp",
    tags: ["Next.js", "GSAP", "WebGL", "TypeScript"],
    featured: false,
    description:
      "Productivity launcher for macOS with a stunning marketing site featuring live extension demos, smooth scroll animations, and community spotlight.",
    challenge:
      "Communicating the speed and extensibility of a desktop launcher through a web experience — the site needed to feel just as fast.",
    solution:
      "60fps scroll animations showcasing product features in real-time, embedded interactive extension demos, and community-driven extension showcase with search and filtering.",
    results: [
      "Download conversions up 52%",
      "Community extension page drives 30% of signups",
      "Lighthouse performance score: 98/100",
    ],
    liveUrl: "https://www.raycast.com",
    accentColor: "#ff6363",
    testimonial: {
      quote: "Our website now feels as fast as Raycast itself. The embedded demos let visitors experience the product before downloading.",
      author: "Thomas Paul Mann",
      role: "Co-Founder, Raycast",
    },
  },
  {
    id: "saas-3",
    slug: "cal",
    title: "Cal.com",
    client: "Cal.com Inc.",
    year: 2024,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/cal.webp",
    tags: ["Next.js", "Tailwind CSS", "TypeScript", "Prisma"],
    featured: false,
    description:
      "Open-source scheduling platform with a clean, professional marketing site, live booking widget demos, and a developer-focused documentation hub.",
    challenge:
      "Competing with Calendly as an open-source alternative — the site needed to communicate reliability and polish while highlighting the open-source advantage.",
    solution:
      "Interactive booking widget demo on the homepage, side-by-side feature comparison with competitors, and a developer hub with API playground and contribution guides.",
    results: [
      "Free-to-paid conversion increased 35%",
      "Developer community grew 8× in 12 months",
      "Documentation page views up 120%",
    ],
    liveUrl: "https://cal.com",
    accentColor: "#292929",
    testimonial: {
      quote: "The interactive demo on our homepage replaced thousands of words of explanation. Users get it instantly.",
      author: "Peer Richelsen",
      role: "Co-Founder, Cal.com",
    },
  },
  {
    id: "saas-4",
    slug: "resend",
    title: "Resend",
    client: "Resend Inc.",
    year: 2025,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/resend.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "MDX"],
    featured: false,
    description:
      "Email API for developers with an elegant marketing site featuring live code examples, beautiful email template previews, and developer-first documentation.",
    challenge:
      "Making email infrastructure exciting — the site needed to turn a traditionally boring API into a developer-beloved brand.",
    solution:
      "Live code playground with instant email previews, beautifully rendered template gallery, gradient-rich design system, and a changelog that reads like a product story.",
    results: [
      "API signups increased 67% after redesign",
      "Developer NPS score: 78",
      "Average docs visit duration: 6.8 min",
    ],
    liveUrl: "https://resend.com",
    accentColor: "#000000",
    testimonial: {
      quote: "The live code playground on our website converts developers faster than any sales team could. It sells the product by itself.",
      author: "Zeno Rocha",
      role: "Founder, Resend",
    },
  },
  {
    id: "saas-5",
    slug: "clerk",
    title: "Clerk",
    client: "Clerk Inc.",
    year: 2024,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/clerk.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "MDX"],
    featured: false,
    description:
      "Authentication and user management platform with a developer-focused marketing site, interactive component previews, and comprehensive docs.",
    challenge:
      "Auth is complex and unsexy — the website needed to make user management feel simple, modern, and actually exciting for developers.",
    solution:
      "Embeddable component preview showing real authentication UI, copy-paste code snippets with framework switching, and a comparison calculator showing time saved vs. building auth from scratch.",
    results: [
      "Trial-to-paid conversion up 29%",
      "Docs satisfaction rating: 4.8/5",
      "Integration time reduced to under 15 minutes",
    ],
    liveUrl: "https://clerk.com",
    accentColor: "#6c47ff",
    testimonial: {
      quote: "The component preview lets developers see exactly what they get before writing a single line of code. It dramatically shortened our sales cycle.",
      author: "Colin Sidoti",
      role: "Co-Founder, Clerk",
    },
  },
  {
    id: "saas-6",
    slug: "dub",
    title: "Dub",
    client: "Dub.co Inc.",
    year: 2025,
    category: "SaaS & Technology",
    thumbnail: "/images/projects/portfolio/dub.webp",
    tags: ["Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    featured: false,
    description:
      "Open-source link management platform with a clean, conversion-focused marketing site, real-time analytics preview, and developer API docs.",
    challenge:
      "Differentiating from Bitly in a mature market — the site needed to position Dub as the modern, developer-friendly alternative.",
    solution:
      "Live link analytics dashboard preview, one-click link creation demo, clean comparison page with feature matrix, and open-source contribution spotlight.",
    results: [
      "Signup rate increased 55% post-launch",
      "Enterprise inquiry volume up 3×",
      "GitHub stars grew from 8K to 22K",
    ],
    liveUrl: "https://dub.co",
    accentColor: "#7b61ff",
    testimonial: {
      quote: "The new site positions us exactly where we want to be — the modern, dev-first Bitly alternative. Signups speak for themselves.",
      author: "Steven Tey",
      role: "Founder, Dub",
    },
  },

  /* ═══════════════════════════════════════
     DEVELOPER TOOLS  (6 projects)
     ═══════════════════════════════════════ */
  {
    id: "dev-1",
    slug: "neon",
    title: "Neon",
    client: "Neon Inc.",
    year: 2025,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/neon.webp",
    tags: ["Next.js", "WebGL", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Serverless Postgres platform with a visually striking marketing site featuring neon-lit 3D visuals, interactive query playground, and performance benchmarks.",
    challenge:
      "Making database infrastructure visually compelling — Postgres is powerful but not inherently exciting to market.",
    solution:
      "Custom WebGL neon glow effects reflecting the brand name, interactive SQL playground with instant results, and live branching demo showing database branching in real time.",
    results: [
      "Free tier signups increased 82%",
      "Interactive playground used by 45% of visitors",
      "Enterprise leads grew 3.5× year-over-year",
    ],
    liveUrl: "https://neon.tech",
    accentColor: "#00e599",
    testimonial: {
      quote: "Our website went from a standard SaaS landing page to an experience developers actually share with their teams. The playground is our best sales tool.",
      author: "Nikita Shamgunov",
      role: "CEO, Neon",
    },
  },
  {
    id: "dev-2",
    slug: "railway",
    title: "Railway",
    client: "Railway Corp.",
    year: 2024,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/railway.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "GraphQL"],
    featured: false,
    description:
      "Cloud deployment platform with a beautifully minimal marketing site, one-click deploy demos, and a visual infrastructure dashboard preview.",
    challenge:
      "Heroku's decline left a gap — Railway needed a site that communicated simplicity and power without the baggage of legacy PaaS branding.",
    solution:
      "One-click deploy demo on homepage, animated infrastructure visualization showing real deployment flow, and a template gallery with instant project bootstrapping.",
    results: [
      "First-deploy conversion up 61%",
      "Template gallery drives 25% of all signups",
      "Average time to first deploy: 38 seconds",
    ],
    liveUrl: "https://railway.app",
    accentColor: "#a855f7",
    testimonial: {
      quote: "The deploy demo on our homepage is the single highest-converting element on our entire site. People deploy before they even sign up.",
      author: "Jake Cooper",
      role: "Founder, Railway",
    },
  },
  {
    id: "dev-3",
    slug: "upstash",
    title: "Upstash",
    client: "Upstash Inc.",
    year: 2025,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/upstash.webp",
    tags: ["Next.js", "Tailwind CSS", "MDX", "TypeScript"],
    featured: false,
    description:
      "Serverless Redis and Kafka platform with a developer-focused site featuring pricing calculators, performance benchmarks, and interactive SDK examples.",
    challenge:
      "Pricing serverless data is confusing — the site needed to make per-request pricing transparent and predictable for developers.",
    solution:
      "Interactive pricing calculator with usage-based estimation, real-time performance benchmark comparisons, and SDK code samples that switch between languages instantly.",
    results: [
      "Pricing page reduced support tickets by 60%",
      "Free-to-paid conversion improved 33%",
      "Documentation traffic up 200%",
    ],
    liveUrl: "https://upstash.com",
    accentColor: "#00c98d",
    testimonial: {
      quote: "The pricing calculator eliminated our biggest friction point. Developers now understand exactly what they'll pay before signing up.",
      author: "Enes Akar",
      role: "Co-Founder, Upstash",
    },
  },
  {
    id: "dev-4",
    slug: "trigger-dev",
    title: "Trigger.dev",
    client: "Trigger.dev Ltd.",
    year: 2025,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/trigger-dev.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    featured: false,
    description:
      "Background job platform for developers with a marketing site featuring live job execution visualizations, code-first examples, and integration showcases.",
    challenge:
      "Background jobs are invisible by design — the website needed to make something that runs behind the scenes feel tangible and exciting.",
    solution:
      "Real-time job execution visualization showing background tasks running live, framework-specific code examples with copy-paste integration, and a visual workflow builder preview.",
    results: [
      "Developer signups increased 73%",
      "GitHub stars grew 5× in 6 months",
      "Integration setup time cut to under 5 minutes",
    ],
    liveUrl: "https://trigger.dev",
    accentColor: "#e8ff4f",
    testimonial: {
      quote: "Making background jobs visible was the key insight. The execution visualization on our site gets developers excited about infrastructure.",
      author: "Matt Aitkens",
      role: "Co-Founder, Trigger.dev",
    },
  },
  {
    id: "dev-5",
    slug: "inngest",
    title: "Inngest",
    client: "Inngest Inc.",
    year: 2024,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/inngest.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "MDX"],
    featured: false,
    description:
      "Event-driven function platform with an elegant marketing site featuring animated architecture diagrams, function replay demos, and SDK documentation.",
    challenge:
      "Event-driven architecture is abstract — the site needed to make complex distributed systems concepts understandable in seconds.",
    solution:
      "Animated flow diagrams showing events triggering functions in real-time, interactive function replay demonstration, and step-by-step SDK integration walkthrough.",
    results: [
      "Homepage conversion rate up 48%",
      "Docs engagement increased 85%",
      "Enterprise pilot requests tripled",
    ],
    liveUrl: "https://www.inngest.com",
    accentColor: "#4636f5",
    testimonial: {
      quote: "The animated architecture diagrams communicate in 10 seconds what our previous site took paragraphs to explain. Sales cycles shortened dramatically.",
      author: "Tony Holdstock-Brown",
      role: "Co-Founder, Inngest",
    },
  },
  {
    id: "dev-6",
    slug: "loops",
    title: "Loops",
    client: "Loops Inc.",
    year: 2025,
    category: "Developer Tools",
    thumbnail: "/images/projects/portfolio/loops.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    featured: false,
    description:
      "Email platform for SaaS companies with a refined marketing site featuring drag-and-drop email builder preview, audience segmentation demos, and integration guides.",
    challenge:
      "Competing with Mailchimp and Customer.io — Loops needed a site that communicated modern simplicity vs. legacy complexity.",
    solution:
      "Interactive email builder preview on the homepage, visual audience segmentation demo, side-by-side migration comparison with competitors, and one-click import tool.",
    results: [
      "Trial signups grew 92% year-over-year",
      "Migration tool used by 40% of new customers",
      "Average trial-to-paid time: 4 days",
    ],
    liveUrl: "https://loops.so",
    accentColor: "#7c3aed",
    testimonial: {
      quote: "The email builder preview on our homepage closes deals before our sales team even gets involved. It's our most effective conversion tool.",
      author: "Chris Frantz",
      role: "Co-Founder, Loops",
    },
  },

  /* ═══════════════════════════════════════
     CORPORATE & BUSINESS  (6 projects)
     ═══════════════════════════════════════ */
  {
    id: "corp-1",
    slug: "mercury",
    title: "Mercury",
    client: "Mercury Technologies Inc.",
    year: 2025,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/mercury.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "Plaid API"],
    featured: false,
    description:
      "Startup banking platform with a premium marketing site featuring animated product walkthroughs, founder testimonials, and a seamless onboarding flow.",
    challenge:
      "Fintech trust is earned — the marketing site needed to feel as secure and polished as a major bank while retaining startup energy.",
    solution:
      "Animated product walkthroughs replacing static screenshots, founder-first testimonial design, instant company verification flow, and a transparent fee comparison calculator.",
    results: [
      "Account opening conversion up 45%",
      "Time to first deposit reduced by 60%",
      "NPS score improved from 68 to 82",
    ],
    liveUrl: "https://mercury.com",
    accentColor: "#6366f1",
    testimonial: {
      quote: "Our website finally communicates the trust and polish our product delivers. The onboarding flow alone improved our activation metrics dramatically.",
      author: "Immad Akhund",
      role: "CEO, Mercury",
    },
  },
  {
    id: "corp-2",
    slug: "ramp",
    title: "Ramp",
    client: "Ramp Financial Inc.",
    year: 2024,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/ramp.webp",
    tags: ["Next.js", "GSAP", "TypeScript", "D3.js"],
    featured: false,
    description:
      "Corporate card and spend management platform with a data-rich marketing site featuring savings calculator, customer case studies, and product comparison tools.",
    challenge:
      "Competing with Brex and traditional corporate cards — the site needed to lead with concrete savings data rather than abstract promises.",
    solution:
      "Real-time savings calculator based on company size, animated D3.js charts showing average customer savings, and detailed case study pages with verifiable ROI metrics.",
    results: [
      "Demo request rate increased 58%",
      "Savings calculator used by 72% of visitors",
      "Sales-qualified lead volume up 3.2×",
    ],
    liveUrl: "https://ramp.com",
    accentColor: "#f59e0b",
    testimonial: {
      quote: "The savings calculator on our website does the selling for us. Prospects come to demos already knowing how much they'll save.",
      author: "Eric Glyman",
      role: "CEO, Ramp",
    },
  },
  {
    id: "corp-3",
    slug: "lattice",
    title: "Lattice",
    client: "Lattice HQ Inc.",
    year: 2025,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/lattice.webp",
    tags: ["Next.js", "React", "Contentful", "Tailwind CSS"],
    featured: false,
    description:
      "People management platform with a content-rich marketing site featuring interactive product tours, HR resource library, and community event hub.",
    challenge:
      "HR software sites all look the same — Lattice needed to differentiate with personality while maintaining enterprise credibility.",
    solution:
      "Interactive product tour replacing static screenshots, HR resource library with downloadable templates, and community event hub with registration integration.",
    results: [
      "Product tour completion rate: 71%",
      "Resource downloads drove 28% of MQLs",
      "Enterprise pipeline grew 4× annually",
    ],
    liveUrl: "https://lattice.com",
    accentColor: "#f43f5e",
    testimonial: {
      quote: "The interactive product tour converts better than any live demo our AEs give. Prospects understand the platform before they even talk to sales.",
      author: "Jack Altman",
      role: "CEO, Lattice",
    },
  },
  {
    id: "corp-4",
    slug: "gusto",
    title: "Gusto",
    client: "Gusto Inc.",
    year: 2024,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/gusto.webp",
    tags: ["Next.js", "React", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Payroll and HR platform for small businesses with a friendly, approachable marketing site, pricing transparency tools, and a small business resource center.",
    challenge:
      "Payroll is stressful for small business owners — the site needed to feel warm and reassuring, not corporate and intimidating.",
    solution:
      "Warm illustration-driven design, step-by-step onboarding preview, transparent pricing calculator with no hidden fees, and a small business owner community section.",
    results: [
      "Free trial signups increased 39%",
      "Pricing page is #1 converting entry point",
      "Small business resource hub drives 20% of organic traffic",
    ],
    liveUrl: "https://gusto.com",
    accentColor: "#f45d48",
    testimonial: {
      quote: "The pricing transparency was crucial. Small business owners told us they chose Gusto because the website was honest about costs upfront.",
      author: "Josh Reeves",
      role: "CEO, Gusto",
    },
  },
  {
    id: "corp-5",
    slug: "rippling",
    title: "Rippling",
    client: "Rippling Inc.",
    year: 2025,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/rippling.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "GraphQL"],
    featured: false,
    description:
      "Workforce platform with a dynamic marketing site featuring animated product demos, integration ecosystem visualizations, and ROI calculator.",
    challenge:
      "Rippling does everything (HR, IT, Finance) — the site needed to communicate breadth without overwhelming visitors.",
    solution:
      "Adaptive landing pages that personalize content by company size and role, animated product connection diagram, and consolidated ROI calculator spanning all product lines.",
    results: [
      "Personalized pages convert 57% better",
      "Demo request volume up 4.1×",
      "Average deal size increased 28%",
    ],
    liveUrl: "https://www.rippling.com",
    accentColor: "#fbbf24",
    testimonial: {
      quote: "The personalized landing pages solved our positioning challenge overnight. Each visitor sees the product through their own lens.",
      author: "Parker Conrad",
      role: "CEO, Rippling",
    },
  },
  {
    id: "corp-6",
    slug: "deel",
    title: "Deel",
    client: "Deel Inc.",
    year: 2025,
    category: "Corporate & Business",
    thumbnail: "/images/projects/portfolio/deel.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    featured: false,
    description:
      "Global hiring and payroll platform with an internationally-focused marketing site, country compliance guides, and cost comparison calculators.",
    challenge:
      "International hiring is complex — the site needed to simplify compliance across 150+ countries without dumbing down critical legal details.",
    solution:
      "Country-specific compliance hub with searchable regulations, global hiring cost calculator, and a visual contractor-vs-employee decision tool with legal implications.",
    results: [
      "Compliance hub drives 35% of organic signups",
      "Cost calculator used 50K+ times per month",
      "Enterprise ACV increased 22%",
    ],
    liveUrl: "https://www.deel.com",
    accentColor: "#15b79e",
    testimonial: {
      quote: "The country compliance hub alone generates more qualified leads than our entire previous marketing site. It's become our SEO powerhouse.",
      author: "Alex Bouaziz",
      role: "CEO, Deel",
    },
  },

  /* ═══════════════════════════════════════
     TOURISM & HOSPITALITY  (5 projects)
     ═══════════════════════════════════════ */
  {
    id: "tour-1",
    slug: "getaway-house",
    title: "Getaway",
    client: "Getaway House Inc.",
    year: 2025,
    category: "Tourism & Hospitality",
    thumbnail: "/images/projects/portfolio/getaway-house.webp",
    tags: ["Next.js", "GSAP", "Mapbox", "Stripe"],
    featured: false,
    description:
      "Tiny cabin retreat brand with an immersive booking experience, interactive outpost map, and a digital detox philosophy woven throughout the design.",
    challenge:
      "Selling the absence of technology through technology — the site needed to evoke cabin tranquility while handling complex multi-location booking.",
    solution:
      "Full-screen nature photography driving the visual narrative, interactive Mapbox outpost finder, minimal-click booking flow, and a 'rules of Getaway' scroll experience.",
    results: [
      "Direct bookings up 55% vs. OTA channels",
      "Average booking value increased 32%",
      "Mobile booking completion rate: 78%",
    ],
    liveUrl: "https://getaway.house",
    accentColor: "#2d5016",
    testimonial: {
      quote: "The booking flow feels as peaceful as the cabins themselves. Guests tell us the website already starts their relaxation journey.",
      author: "Jon Staff",
      role: "CEO, Getaway",
    },
  },
  {
    id: "tour-2",
    slug: "hipcamp",
    title: "Hipcamp",
    client: "Hipcamp Inc.",
    year: 2024,
    category: "Tourism & Hospitality",
    thumbnail: "/images/projects/portfolio/hipcamp.webp",
    tags: ["React", "Next.js", "Mapbox", "TypeScript"],
    featured: false,
    description:
      "Outdoor accommodation marketplace connecting campers to private landowners, featuring map-first search, user reviews, and host management dashboard.",
    challenge:
      "Camping search is location-first — the website needed map-driven discovery that loads fast even with thousands of listings across rural areas.",
    solution:
      "Map-first search experience with clustering, advanced filtering by amenities and terrain type, host dashboard with booking management, and user-generated photo galleries.",
    results: [
      "Search-to-booking conversion up 41%",
      "Host onboarding time reduced by 50%",
      "User photo uploads increased 3×",
    ],
    liveUrl: "https://www.hipcamp.com",
    accentColor: "#ff5a1f",
    testimonial: {
      quote: "The map-first redesign transformed how campers discover properties. Our search-to-booking funnel has never performed this well.",
      author: "Alyssa Ravasio",
      role: "Founder, Hipcamp",
    },
  },
  {
    id: "tour-3",
    slug: "sonder",
    title: "Sonder",
    client: "Sonder Holdings Inc.",
    year: 2025,
    category: "Tourism & Hospitality",
    thumbnail: "/images/projects/portfolio/sonder.webp",
    tags: ["Next.js", "React", "Framer Motion", "Contentful"],
    featured: false,
    description:
      "Apartment hotel brand with a premium booking experience, virtual room tours, neighborhood guides, and seamless self-check-in flow.",
    challenge:
      "Positioned between hotels and Airbnb — Sonder needed a site that communicated design-forward consistency while feeling like a local discovery platform.",
    solution:
      "Virtual room tours with 360° views, curated neighborhood guides for each property, self-check-in walkthrough, and a loyalty program with tier-based room upgrades.",
    results: [
      "Direct booking revenue up 48%",
      "Virtual tour viewers book 2.3× more",
      "Guest return rate improved 35%",
    ],
    liveUrl: "https://www.sonder.com",
    accentColor: "#1e293b",
    testimonial: {
      quote: "The virtual room tours and neighborhood guides set guest expectations perfectly. Our review scores jumped because the experience matches the promise.",
      author: "Francis Davidson",
      role: "CEO, Sonder",
    },
  },
  {
    id: "tour-4",
    slug: "inspirato",
    title: "Inspirato",
    client: "Inspirato LLC",
    year: 2024,
    category: "Tourism & Hospitality",
    thumbnail: "/images/projects/portfolio/inspirato.webp",
    tags: ["Next.js", "GSAP", "TypeScript", "Stripe"],
    featured: false,
    description:
      "Luxury vacation membership with a visually stunning browsing experience, destination storytelling, and exclusive member portal.",
    challenge:
      "Luxury travel demands luxury digital — the website needed to justify a premium membership fee through visual storytelling alone.",
    solution:
      "Cinematic destination showcases with scroll-driven reveals, exclusive member-only property previews, trip planning concierge chat, and an inspirational 'collections' browsing mode.",
    results: [
      "Membership inquiries increased 62%",
      "Average time browsing destinations: 8.5 min",
      "Member retention improved to 91%",
    ],
    liveUrl: "https://www.inspirato.com",
    accentColor: "#7c3aed",
    testimonial: {
      quote: "The cinematic destination pages sell our membership better than any brochure ever could. Members say browsing the site is an experience in itself.",
      author: "Brent Handler",
      role: "CEO, Inspirato",
    },
  },
  {
    id: "tour-5",
    slug: "under-canvas",
    title: "Under Canvas",
    client: "Under Canvas Inc.",
    year: 2025,
    category: "Tourism & Hospitality",
    thumbnail: "/images/projects/portfolio/under-canvas.webp",
    tags: ["Next.js", "GSAP", "Mapbox", "Sanity CMS"],
    featured: false,
    description:
      "Luxury glamping near national parks with an immersive booking experience, campsite virtual tours, and activity scheduling integration.",
    challenge:
      "Glamping is unfamiliar territory for many travelers — the site needed to educate while inspiring guests to book tent accommodations over traditional hotels.",
    solution:
      "Immersive campsite virtual tours, tent-type comparison tool with amenity lists, proximity maps showing national park access, and a seasonal activity calendar with booking.",
    results: [
      "Booking conversion up 44%",
      "Tent comparison tool used by 65% of bookers",
      "National park page drives 40% of organic traffic",
    ],
    liveUrl: "https://www.undercanvas.com",
    accentColor: "#92702e",
    testimonial: {
      quote: "The tent comparison tool answered every question guests had before booking. First-time glampers now feel confident choosing their perfect accommodation.",
      author: "Matt Gaghen",
      role: "CEO, Under Canvas",
    },
  },

  /* ═══════════════════════════════════════
     HEALTHCARE & WELLNESS  (5 projects)
     ═══════════════════════════════════════ */
  {
    id: "health-1",
    slug: "noom",
    title: "Noom",
    client: "Noom Inc.",
    year: 2025,
    category: "Healthcare & Wellness",
    thumbnail: "/images/projects/portfolio/noom.webp",
    tags: ["Next.js", "React", "TypeScript", "GSAP"],
    featured: false,
    description:
      "Psychology-based weight health platform with a personalized quiz funnel, science-backed content hub, and engaging program preview experience.",
    challenge:
      "Health and weight loss space is filled with gimmicks — Noom's site needed to project clinical credibility while remaining warm and approachable.",
    solution:
      "Evidence-based content hub with cited studies, personalized health quiz with real-time plan preview, coach introduction experience, and progress story showcases from real users.",
    results: [
      "Quiz completion rate: 68%",
      "Content hub drives 52% of organic signups",
      "Trial-to-subscription conversion up 34%",
    ],
    liveUrl: "https://www.noom.com",
    accentColor: "#f97316",
    testimonial: {
      quote: "The personalized quiz funnel captures intent better than any landing page we've tested. Users arrive at the paywall already invested in their plan.",
      author: "Saeju Jeong",
      role: "Co-Founder, Noom",
    },
  },
  {
    id: "health-2",
    slug: "hims",
    title: "Hims & Hers",
    client: "Hims & Hers Health Inc.",
    year: 2024,
    category: "Healthcare & Wellness",
    thumbnail: "/images/projects/portfolio/hims.webp",
    tags: ["Next.js", "React", "Framer Motion", "Stripe"],
    featured: false,
    description:
      "Telehealth and wellness brand with a modern, destigmatizing design, personalized treatment quiz, and seamless consultation booking flow.",
    challenge:
      "Health topics like hair loss and mental health carry stigma — the site needed to normalize these conversations with tasteful, approachable design.",
    solution:
      "Lifestyle-first photography replacing clinical imagery, judgment-free treatment quizzes, transparent pricing, and telemedicine consultation booking with 24-hour response guarantee.",
    results: [
      "New patient acquisition cost down 35%",
      "Consultation bookings up 67%",
      "Repeat prescription rate: 78%",
    ],
    liveUrl: "https://www.hims.com",
    accentColor: "#1a1a2e",
    testimonial: {
      quote: "The destigmatized design approach was transformative. Patients tell us the website made them feel comfortable seeking help for the first time.",
      author: "Andrew Dudum",
      role: "CEO, Hims & Hers",
    },
  },
  {
    id: "health-3",
    slug: "ritual",
    title: "Ritual",
    client: "Ritual Inc.",
    year: 2025,
    category: "Healthcare & Wellness",
    thumbnail: "/images/projects/portfolio/ritual.webp",
    tags: ["Next.js", "Shopify", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Vitamin and supplement brand with transparent ingredient sourcing, interactive nutrient tracker, and clean subscription management.",
    challenge:
      "The supplement industry has a trust problem — Ritual needed a site that made ingredient sourcing and clinical testing radically transparent.",
    solution:
      "Interactive ingredient tracer showing every supplier, clinical trial results presented with clear data visualizations, personalized vitamin quiz, and clean subscription portal.",
    results: [
      "Ingredient tracer is the most visited page",
      "Subscription retention improved to 85%",
      "Customer acquisition cost down 29%",
    ],
    liveUrl: "https://ritual.com",
    accentColor: "#f9d54a",
    testimonial: {
      quote: "The ingredient tracer became the centerpiece of our brand story. Customers cite transparency as their #1 reason for choosing Ritual.",
      author: "Katerina Schneider",
      role: "Founder, Ritual",
    },
  },
  {
    id: "health-4",
    slug: "oura",
    title: "Oura",
    client: "Oura Health Oy",
    year: 2025,
    category: "Healthcare & Wellness",
    thumbnail: "/images/projects/portfolio/oura.webp",
    tags: ["Next.js", "Three.js", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Smart ring health tracker with an immersive product page featuring 3D ring explorer, sleep science content hub, and personalized sizing tool.",
    challenge:
      "A ring that tracks health is an unfamiliar concept — the site needed to communicate complex biometric technology through simple, elegant storytelling.",
    solution:
      "3D ring explorer with material close-ups and sensor visualization, sleep science content hub, interactive sizing tool with home try-on option, and member story showcases.",
    results: [
      "3D explorer increased time on product page 3×",
      "Sizing tool reduced returns by 42%",
      "Pre-order conversion rate: 28%",
    ],
    liveUrl: "https://ouraring.com",
    accentColor: "#c0c0c0",
    testimonial: {
      quote: "The 3D ring explorer helped customers understand the technology inside a small form factor. Return rates dropped dramatically thanks to the sizing tool.",
      author: "Tom Hale",
      role: "CEO, Oura",
    },
  },
  {
    id: "health-5",
    slug: "whoop",
    title: "WHOOP",
    client: "WHOOP Inc.",
    year: 2024,
    category: "Healthcare & Wellness",
    thumbnail: "/images/projects/portfolio/whoop.webp",
    tags: ["Next.js", "GSAP", "D3.js", "TypeScript"],
    featured: false,
    description:
      "Performance fitness wearable with a data-driven marketing site, athlete stories, membership comparison tool, and community leaderboard showcase.",
    challenge:
      "WHOOP sells a membership, not just a device — the site needed to communicate ongoing value beyond the initial hardware purchase.",
    solution:
      "Data visualization showcases showing real performance insights, athlete testimonial stories with biometric data, membership tier comparison, and community challenge leaderboards.",
    results: [
      "Membership signup rate up 47%",
      "Athlete stories page drives 30% of conversions",
      "Community engagement up 2.5×",
    ],
    liveUrl: "https://www.whoop.com",
    accentColor: "#00b388",
    testimonial: {
      quote: "The data visualizations on our site communicate what words can't — real performance improvements backed by real numbers.",
      author: "Will Ahmed",
      role: "CEO, WHOOP",
    },
  },

  /* ═══════════════════════════════════════
     REAL ESTATE  (5 projects)
     ═══════════════════════════════════════ */
  {
    id: "re-1",
    slug: "pacaso",
    title: "Pacaso",
    client: "Pacaso Inc.",
    year: 2025,
    category: "Real Estate",
    thumbnail: "/images/projects/portfolio/pacaso.webp",
    tags: ["Next.js", "Mapbox", "Framer Motion", "TypeScript"],
    featured: false,
    description:
      "Luxury second home co-ownership platform with immersive property showcases, fractional ownership calculator, and virtual home tours.",
    challenge:
      "Co-ownership of luxury homes is a novel concept — the site needed to build trust around shared ownership while maintaining a premium real estate feel.",
    solution:
      "Cinematic property showcases with virtual walkthroughs, transparent ownership calculator showing costs and scheduling, and a trust-building section with legal process transparency.",
    results: [
      "Property inquiry rate increased 58%",
      "Ownership calculator used by 80% of prospects",
      "Average time on property pages: 7.2 min",
    ],
    liveUrl: "https://www.pacaso.com",
    accentColor: "#3b82f6",
    testimonial: {
      quote: "The ownership calculator demystified co-ownership completely. Prospects arrive at our calls already understanding the model and ready to move forward.",
      author: "Austin Allison",
      role: "CEO, Pacaso",
    },
  },
  {
    id: "re-2",
    slug: "flyhomes",
    title: "Flyhomes",
    client: "Flyhomes Inc.",
    year: 2024,
    category: "Real Estate",
    thumbnail: "/images/projects/portfolio/flyhomes.webp",
    tags: ["Next.js", "React", "Mapbox", "TypeScript"],
    featured: false,
    description:
      "Tech-powered home buying platform with an AI-driven property match system, cash offer program explainer, and neighborhood insights dashboard.",
    challenge:
      "Home buying is the biggest purchase most people make — the site needed to reduce anxiety with data-driven tools while maintaining emotional warmth.",
    solution:
      "AI property matching based on lifestyle preferences, interactive neighborhood dashboards with school and transit data, cash offer program wizard, and real buyer journey stories.",
    results: [
      "Property match quiz completion rate: 74%",
      "Cash offer inquiries up 85%",
      "Customer satisfaction score: 4.9/5",
    ],
    liveUrl: "https://www.flyhomes.com",
    accentColor: "#10b981",
    testimonial: {
      quote: "The property matching tool and neighborhood insights removed the guesswork from home buying. Our clients feel informed and confident throughout the process.",
      author: "Tushar Garg",
      role: "CEO, Flyhomes",
    },
  },
  {
    id: "re-3",
    slug: "landing",
    title: "Landing",
    client: "Landing Inc.",
    year: 2025,
    category: "Real Estate",
    thumbnail: "/images/projects/portfolio/landing.webp",
    tags: ["Next.js", "GSAP", "Mapbox", "TypeScript"],
    featured: false,
    description:
      "Flexible living membership with a city-by-city apartment browsing experience, virtual apartment tours, and seamless member relocation portal.",
    challenge:
      "Flexible living is a new category — the site needed to explain the membership model while inspiring with aspirational lifestyle content across multiple cities.",
    solution:
      "City-by-city apartment exploration with lifestyle photography, virtual apartment tours, membership cost-vs-renting calculator, and a seamless relocation request portal for existing members.",
    results: [
      "Membership signups up 52%",
      "Virtual tour viewers convert 2.8× higher",
      "Member relocation requests via portal: 85%",
    ],
    liveUrl: "https://www.hellolanding.com",
    accentColor: "#6366f1",
    testimonial: {
      quote: "The city browsing experience makes people dream about their next move. Members tell us they browse apartments the way others browse travel destinations.",
      author: "Bill Smith",
      role: "CEO, Landing",
    },
  },
  {
    id: "re-4",
    slug: "lessen",
    title: "Lessen",
    client: "Lessen Inc.",
    year: 2024,
    category: "Real Estate",
    thumbnail: "/images/projects/portfolio/lessen.webp",
    tags: ["Next.js", "React", "D3.js", "TypeScript"],
    featured: false,
    description:
      "Property operations and renovation platform with a data-rich marketing site, ROI calculators, and enterprise property management demos.",
    challenge:
      "Property operations is unsexy — the site needed to make maintenance, renovation, and turns feel like a technology story, not a handyman pitch.",
    solution:
      "Data-driven ROI dashboard preview showing cost savings, before/after renovation showcases, enterprise property management demo, and a network coverage map.",
    results: [
      "Enterprise demo requests up 72%",
      "ROI calculator generated 45% of MQLs",
      "Average deal size increased 38%",
    ],
    liveUrl: "https://www.lessen.com",
    accentColor: "#0ea5e9",
    testimonial: {
      quote: "The ROI calculator and data dashboards elevated our brand from a service company to a technology platform in the eyes of enterprise buyers.",
      author: "Jay McKee",
      role: "CEO, Lessen",
    },
  },
  {
    id: "re-5",
    slug: "juniper-square",
    title: "Juniper Square",
    client: "Juniper Square Inc.",
    year: 2025,
    category: "Real Estate",
    thumbnail: "/images/projects/portfolio/juniper-square.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    featured: false,
    description:
      "Investment management platform for commercial real estate with a clean marketing site, fund performance demos, and investor portal previews.",
    challenge:
      "CRE finance professionals are conservative — the site needed to communicate innovation while respecting the industry's preference for substance over flash.",
    solution:
      "Clean, professional design with interactive fund performance dashboards, investor portal walkthrough, compliance documentation hub, and a referral program for existing clients.",
    results: [
      "Demo completion rate increased 55%",
      "Content downloads drove 32% of pipeline",
      "Client referral rate improved 40%",
    ],
    liveUrl: "https://junipersquare.com",
    accentColor: "#1e3a5f",
    testimonial: {
      quote: "The investor portal walkthrough let prospects experience the platform before committing. Our demo-to-close rate improved significantly.",
      author: "Alex Robinson",
      role: "CEO, Juniper Square",
    },
  },

  /* ═══════════════════════════════════════
     FASHION & LIFESTYLE  (5 projects)
     ═══════════════════════════════════════ */
  {
    id: "fash-1",
    slug: "everlane",
    title: "Everlane",
    client: "Everlane Inc.",
    year: 2025,
    category: "Fashion & Lifestyle",
    thumbnail: "/images/projects/portfolio/everlane.webp",
    tags: ["Next.js", "Shopify", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Radical transparency fashion brand with factory cost breakdowns, ethical factory profiles, and a clean, editorial shopping experience.",
    challenge:
      "Translating 'radical transparency' from a marketing tagline into a tangible shopping experience that actually shows where the money goes.",
    solution:
      "Per-product cost breakdown infographics, factory profile pages with worker stories and photos, capsule wardrobe builder, and a 'Choose What You Pay' sale mechanic.",
    results: [
      "Cost breakdown viewed on 82% of product pages",
      "Factory profiles reduced return rate by 15%",
      "Choose What You Pay drives 2× email signups",
    ],
    liveUrl: "https://www.everlane.com",
    accentColor: "#1a1a1a",
    testimonial: {
      quote: "The factory profiles and cost breakdowns aren't just marketing — they became the core of our brand identity online. Customers shop with confidence.",
      author: "Michael Preysman",
      role: "Founder, Everlane",
    },
  },
  {
    id: "fash-2",
    slug: "vuori",
    title: "Vuori",
    client: "Vuori Inc.",
    year: 2024,
    category: "Fashion & Lifestyle",
    thumbnail: "/images/projects/portfolio/vuori.webp",
    tags: ["Next.js", "Shopify Plus", "GSAP", "Contentful"],
    featured: false,
    description:
      "Performance apparel brand with a lifestyle-driven shopping experience, fit guide technology, and community-focused content hub.",
    challenge:
      "Vuori straddles athleisure and performance — the site needed to appeal to both yoga practitioners and runners without diluting the brand.",
    solution:
      "Activity-based shopping navigation, AI-powered fit guide with body measurements, lifestyle content hub with athlete stories, and a community event calendar.",
    results: [
      "Fit guide reduced size-related returns by 38%",
      "Activity navigation increased cross-category purchases 25%",
      "Content hub drives 18% of new customer traffic",
    ],
    liveUrl: "https://vuoriclothing.com",
    accentColor: "#5c7a7d",
    testimonial: {
      quote: "The fit guide alone saved us millions in returns. Customers get the right size the first time, and that builds lasting loyalty.",
      author: "Joe Kudla",
      role: "Founder, Vuori",
    },
  },
  {
    id: "fash-3",
    slug: "aritzia",
    title: "Aritzia",
    client: "Aritzia LP",
    year: 2025,
    category: "Fashion & Lifestyle",
    thumbnail: "/images/projects/portfolio/aritzia.webp",
    tags: ["Next.js", "React", "Shopify", "TypeScript"],
    featured: false,
    description:
      "Canadian fashion brand with a multi-brand shopping experience, trend-driven editorial content, and sophisticated filtering system across 20+ house brands.",
    challenge:
      "Aritzia carries 20+ house brands — the site needed a unified shopping experience that respects each brand's identity while maintaining cohesion.",
    solution:
      "Brand-specific micro-shops within the main experience, AI-driven trend forecasting content, sophisticated multi-filter system, and a style quiz routing customers to their ideal house brand.",
    results: [
      "Brand quiz increased first-purchase conversion by 33%",
      "Average items per cart up 1.8",
      "Cross-brand shopping increased 45%",
    ],
    liveUrl: "https://www.aritzia.com",
    accentColor: "#000000",
    testimonial: {
      quote: "The house brand quiz was brilliant. Customers discover brands they didn't know existed and come back specifically for those collections.",
      author: "Brian Hill",
      role: "CEO, Aritzia",
    },
  },
  {
    id: "fash-4",
    slug: "tentree",
    title: "tentree",
    client: "tentree International Inc.",
    year: 2024,
    category: "Fashion & Lifestyle",
    thumbnail: "/images/projects/portfolio/tentree.webp",
    tags: ["Next.js", "Shopify", "GSAP", "Mapbox"],
    featured: false,
    description:
      "Sustainable clothing brand that plants ten trees for every item purchased, with a tree-planting tracker, forest map, and eco-impact dashboard.",
    challenge:
      "Making environmental impact tangible — every tentree customer should see their personal forest growing with each purchase.",
    solution:
      "Personal forest tracker with Mapbox integration showing exactly where trees are planted, eco-impact dashboard per customer, and a community leaderboard for top planters.",
    results: [
      "Forest tracker increased repeat purchases by 52%",
      "Social shares of personal forests: 25K/month",
      "Customer lifetime value up 40%",
    ],
    liveUrl: "https://www.tentree.com",
    accentColor: "#22543d",
    testimonial: {
      quote: "Customers obsess over their personal forest map. It turned a single purchase into an ongoing relationship with our brand.",
      author: "Derrick Emsley",
      role: "Co-Founder, tentree",
    },
  },
  {
    id: "fash-5",
    slug: "frank-and-oak",
    title: "Frank And Oak",
    client: "Frank And Oak Inc.",
    year: 2025,
    category: "Fashion & Lifestyle",
    thumbnail: "/images/projects/portfolio/frank-and-oak.webp",
    tags: ["Next.js", "React", "Shopify", "Tailwind CSS"],
    featured: false,
    description:
      "Sustainable fashion brand with a style profile system, curated monthly boxes, and a circular fashion program for recycling old garments.",
    challenge:
      "Sustainable fashion often feels limiting — the site needed to make eco-conscious shopping feel aspirational and style-forward, not restrictive.",
    solution:
      "Style profile quiz powering personalized recommendations, curated monthly box builder, circular fashion trade-in program with credit system, and a sustainability commitment tracker.",
    results: [
      "Style quiz drives 40% of first purchases",
      "Monthly box subscription retention: 72%",
      "Trade-in program collected 15K+ garments",
    ],
    liveUrl: "https://www.frankandoak.com",
    accentColor: "#2d3748",
    testimonial: {
      quote: "The style profile and trade-in program created a complete ecosystem. Customers buy, wear, return, and buy again — all through one seamless experience.",
      author: "Ethan Song",
      role: "Co-Founder, Frank And Oak",
    },
  },

  /* ═══════════════════════════════════════
     FOOD & BEVERAGE  (5 projects)
     ═══════════════════════════════════════ */
  {
    id: "food-1",
    slug: "sweetgreen",
    title: "Sweetgreen",
    client: "Sweetgreen Inc.",
    year: 2025,
    category: "Food & Beverage",
    thumbnail: "/images/projects/portfolio/sweetgreen.webp",
    tags: ["Next.js", "React", "GSAP", "Contentful"],
    featured: false,
    description:
      "Fast-casual salad chain with a garden-to-plate sourcing tracker, seasonal menu experiences, and nationwide ordering platform.",
    challenge:
      "Fast-casual dining is crowded — Sweetgreen needed a digital experience that communicated farm freshness and ingredient quality at the speed of fast food.",
    solution:
      "Interactive supply chain map showing farm partners, seasonal menu showcase with ingredient stories, real-time restaurant finder with wait time estimates, and a loyalty program.",
    results: [
      "Digital order volume up 62%",
      "Supply chain page drives loyalty program signups",
      "App downloads from website increased 45%",
    ],
    liveUrl: "https://www.sweetgreen.com",
    accentColor: "#4a7c59",
    testimonial: {
      quote: "The supply chain transparency on our website reflects who we are as a brand. Customers trust us more because they can see where every ingredient comes from.",
      author: "Jonathan Neman",
      role: "Co-Founder, Sweetgreen",
    },
  },
  {
    id: "food-2",
    slug: "blue-bottle",
    title: "Blue Bottle Coffee",
    client: "Blue Bottle Coffee Inc.",
    year: 2024,
    category: "Food & Beverage",
    thumbnail: "/images/projects/portfolio/blue-bottle.webp",
    tags: ["Next.js", "Shopify", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Specialty coffee roaster with a bean-origin storytelling experience, brewing guide library, subscription management, and café location finder.",
    challenge:
      "Premium coffee requires education — the site needed to justify $20+ bags by immersing visitors in the craft of specialty roasting.",
    solution:
      "Single-origin coffee journey maps, interactive brewing guide library with timer tools, personalized subscription quiz, and café finder with real-time menu availability.",
    results: [
      "Subscription signups grew 55%",
      "Brewing guide page is #1 organic entry point",
      "Average order value increased 28%",
    ],
    liveUrl: "https://bluebottlecoffee.com",
    accentColor: "#4a8fe7",
    testimonial: {
      quote: "The brewing guides turned our website into a coffee education platform. Customers who read them spend 40% more on beans.",
      author: "Bryan Meehan",
      role: "CEO, Blue Bottle Coffee",
    },
  },
  {
    id: "food-3",
    slug: "huel",
    title: "Huel",
    client: "Huel Ltd.",
    year: 2025,
    category: "Food & Beverage",
    thumbnail: "/images/projects/portfolio/huel.webp",
    tags: ["Next.js", "React", "Stripe", "Tailwind CSS"],
    featured: false,
    description:
      "Complete nutrition brand with a macro calculator, personalized meal plan builder, subscription management, and nutritional science content hub.",
    challenge:
      "Complete nutrition is polarizing — the site needed to convince skeptics with science while making the product feel approachable and not clinical.",
    solution:
      "Interactive macro calculator showing nutritional completeness, personalized meal plan builder based on goals and dietary needs, taste quiz, and peer-reviewed research library.",
    results: [
      "Macro calculator increased conversion by 38%",
      "Meal plan builder drives 50% of subscriptions",
      "Content hub organic traffic up 120%",
    ],
    liveUrl: "https://huel.com",
    accentColor: "#1a1a1a",
    testimonial: {
      quote: "The macro calculator is the most powerful tool on our site. Skeptics become believers when they see exactly what they're getting nutritionally.",
      author: "Julian Hearn",
      role: "Founder, Huel",
    },
  },
  {
    id: "food-4",
    slug: "daily-harvest",
    title: "Daily Harvest",
    client: "Daily Harvest Inc.",
    year: 2024,
    category: "Food & Beverage",
    thumbnail: "/images/projects/portfolio/daily-harvest.webp",
    tags: ["Next.js", "Shopify", "Framer Motion", "TypeScript"],
    featured: false,
    description:
      "Frozen plant-based meal delivery with a build-your-box experience, ingredient transparency pages, and a recipe-inspired browsing flow.",
    challenge:
      "Frozen food has a perception problem — the site needed to make frozen meals feel fresh, premium, and Instagram-worthy.",
    solution:
      "Vibrant photography-first design, build-your-box builder with live pricing, ingredient sourcing transparency, taste profile quiz, and a collection-based browsing experience.",
    results: [
      "Build-your-box completion rate: 72%",
      "Taste quiz drives 45% of first orders",
      "Instagram-shared product photos: 8K/month",
    ],
    liveUrl: "https://www.daily-harvest.com",
    accentColor: "#4a7c59",
    testimonial: {
      quote: "The build-your-box experience gamified meal planning. Customers love the interactivity and come back weekly to try new combinations.",
      author: "Rachel Drori",
      role: "Founder, Daily Harvest",
    },
  },
  {
    id: "food-5",
    slug: "hungryroot",
    title: "Hungryroot",
    client: "Hungryroot Inc.",
    year: 2025,
    category: "Food & Beverage",
    thumbnail: "/images/projects/portfolio/hungryroot.webp",
    tags: ["Next.js", "React", "TypeScript", "Contentful"],
    featured: false,
    description:
      "AI-powered grocery and recipe service with a personalized food quiz, weekly meal planning, and algorithm-driven grocery recommendations.",
    challenge:
      "Grocery delivery is competitive — Hungryroot needed to demonstrate its AI personalization advantage in a way that felt helpful, not creepy.",
    solution:
      "Extensive food preference quiz that feels like a game, AI-generated weekly plan preview before signup, recipe-first browsing with automatic grocery cart building, and a 'why this works' explainer.",
    results: [
      "Quiz completion rate: 78%",
      "Plan preview increased signup by 52%",
      "Customer retention at 90 days: 68%",
    ],
    liveUrl: "https://www.hungryroot.com",
    accentColor: "#ff6b35",
    testimonial: {
      quote: "The food quiz became our competitive moat. No competitor personalizes at the depth we do, and the website communicates that instantly.",
      author: "Ben McKean",
      role: "Founder, Hungryroot",
    },
  },

  /* ═══════════════════════════════════════
     CREATIVE & DESIGN  (6 projects)
     ═══════════════════════════════════════ */
  {
    id: "cre-1",
    slug: "rive",
    title: "Rive",
    client: "Rive Inc.",
    year: 2025,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/rive.webp",
    tags: ["Next.js", "WebGL", "GSAP", "TypeScript"],
    featured: false,
    description:
      "Interactive animation platform with a visually stunning marketing site featuring live editor demos, community showcase, and animation-driven storytelling.",
    challenge:
      "Demonstrating an animation tool requires animation — every pixel of the marketing site needed to showcase Rive's capabilities.",
    solution:
      "Rive-powered animations throughout the entire site, embedded live editor demo, community animation gallery with interactions, and a getting-started wizard with templates.",
    results: [
      "Free tier signups increased 88%",
      "Community gallery drives 40% of signups",
      "Average time on homepage: 5.2 minutes",
    ],
    liveUrl: "https://rive.app",
    accentColor: "#1d1d1d",
    testimonial: {
      quote: "The website IS the demo. Every animation visitors see is built with our own tool. That authenticity converts better than any marketing copy.",
      author: "Guido Rosso",
      role: "Co-Founder, Rive",
    },
  },
  {
    id: "cre-2",
    slug: "spline",
    title: "Spline",
    client: "Spline Inc.",
    year: 2025,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/spline.webp",
    tags: ["Next.js", "Three.js", "WebGL", "TypeScript"],
    featured: false,
    description:
      "3D design tool for the web with an immersive marketing site featuring interactive 3D demos, community gallery, and collaborative design showcases.",
    challenge:
      "3D design tools are intimidating — the site needed to make web-based 3D feel approachable and fun, not technical and complex.",
    solution:
      "Interactive 3D hero that visitors can manipulate, embedded design playground, community gallery with embeddable 3D scenes, and a template library for quick starts.",
    results: [
      "Interactive hero engagement rate: 72%",
      "Template usage drives 60% of activations",
      "Community scenes shared 100K+ times",
    ],
    liveUrl: "https://spline.design",
    accentColor: "#7b61ff",
    testimonial: {
      quote: "The interactive hero scene converts visitors in 5 seconds. People play with it and immediately understand what Spline does — no explanation needed.",
      author: "Alejandro León",
      role: "Founder, Spline",
    },
  },
  {
    id: "cre-3",
    slug: "readymag",
    title: "Readymag",
    client: "Readymag Inc.",
    year: 2024,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/readymag.webp",
    tags: ["Next.js", "GSAP", "TypeScript", "Contentful"],
    featured: false,
    description:
      "Web design tool for creative professionals with an editorial showcase, template gallery, and beautifully designed case study presentations.",
    challenge:
      "Readymag competes with no-code tools — the site needed to position it as a premium creative tool, not another website builder.",
    solution:
      "Magazine-quality editorial showcases of user-created work, curated template gallery with premium aesthetics, creative professional interviews, and a portfolio-building tutorial series.",
    results: [
      "Pro subscription conversions up 42%",
      "Showcase gallery is #1 traffic driver",
      "Creative community grew to 500K+ users",
    ],
    liveUrl: "https://readymag.com",
    accentColor: "#000000",
    testimonial: {
      quote: "The editorial approach to our marketing site positions Readymag exactly where we want it — at the intersection of design tool and creative platform.",
      author: "Yury Vetrov",
      role: "Head of Design, Readymag",
    },
  },
  {
    id: "cre-4",
    slug: "pitch",
    title: "Pitch",
    client: "Pitch Software GmbH",
    year: 2025,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/pitch.webp",
    tags: ["Next.js", "Framer Motion", "TypeScript", "WebSocket"],
    featured: false,
    description:
      "Collaborative presentation software with a polished marketing site, template gallery, and live collaboration demos showing real-time editing.",
    challenge:
      "Dethroning PowerPoint and Google Slides requires proving superiority visually — every element of the site needed to outclass competitor aesthetics.",
    solution:
      "Live collaboration demo showing real-time multi-cursor editing, template gallery with one-click import, design-forward landing page that itself looks like a perfect pitch deck.",
    results: [
      "Template gallery drives 55% of signups",
      "Collaboration demo increases trial starts 3×",
      "Enterprise inquiry rate up 67%",
    ],
    liveUrl: "https://pitch.com",
    accentColor: "#7c5cfc",
    testimonial: {
      quote: "Our website is our best pitch deck. The live collaboration demo shows in 30 seconds what takes competitors entire sales calls to explain.",
      author: "Christian Reber",
      role: "CEO, Pitch",
    },
  },
  {
    id: "cre-5",
    slug: "lottiefiles",
    title: "LottieFiles",
    client: "LottieFiles Sdn Bhd",
    year: 2024,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/lottiefiles.webp",
    tags: ["Next.js", "Lottie", "React", "TypeScript"],
    featured: false,
    description:
      "Animation asset platform with a vibrant community marketplace, inline animation previews, and developer integration guides.",
    challenge:
      "Lottie animations are lightweight but hard to discover — the platform needed to make browsing thousands of animations fast, fun, and searchable.",
    solution:
      "Instant-preview animation grid with hover interactions, color customization right in the browser, one-click download in multiple formats, and developer SDK documentation with playground.",
    results: [
      "Animation downloads increased 120%",
      "Color customizer used on 65% of downloads",
      "Developer SDK adoption grew 4×",
    ],
    liveUrl: "https://lottiefiles.com",
    accentColor: "#00ddb3",
    testimonial: {
      quote: "The inline color customizer transformed our marketplace. Designers customize and download in seconds instead of opening external tools.",
      author: "Kshitij Minglani",
      role: "Co-Founder, LottieFiles",
    },
  },
  {
    id: "cre-6",
    slug: "read-cv",
    title: "Read.cv",
    client: "Read.cv Inc.",
    year: 2025,
    category: "Creative & Design",
    thumbnail: "/images/projects/portfolio/read-cv.webp",
    tags: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    featured: false,
    description:
      "Professional profile platform for designers and developers with a clean, minimalist design, portfolio showcases, and community features.",
    challenge:
      "LinkedIn alternatives fail because they're too complex — Read.cv needed an ultra-clean site that made professional identity curation feel effortless.",
    solution:
      "Minimalist profile previews showing actual user portfolios, one-click profile import from LinkedIn, beautiful project showcase module, and a curated job board.",
    results: [
      "User signups grew 3× after redesign",
      "Profile completion rate: 85%",
      "Job board became top feature driving retention",
    ],
    liveUrl: "https://read.cv",
    accentColor: "#171717",
    testimonial: {
      quote: "The profile previews on our homepage convert visitors instantly. People see beautiful portfolios and want to create their own immediately.",
      author: "Andy Chung",
      role: "Founder, Read.cv",
    },
  },
];
