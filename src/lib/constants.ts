import type { NavItem, Project, SceneConfig, Service } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const SCENE_CONFIGS: Record<string, SceneConfig> = {
  "/": {
    blobColor: "#4f6ef7",
    blobScale: 1.0,
    blobOpacity: 0.1,
    cameraZ: 32,
    showTorusKnot: true,
    showSphere: true,
    floaterCount: 12,
    bloomIntensity: 0.4,
    scrollCameraEnabled: true,
  },
  "/services": {
    blobColor: "#8b5cf6",
    blobScale: 0.7,
    blobOpacity: 0.08,
    cameraZ: 38,
    showTorusKnot: true,
    showSphere: false,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  "/portfolio": {
    blobColor: "#06d6a0",
    blobScale: 0.5,
    blobOpacity: 0.06,
    cameraZ: 42,
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 6,
    bloomIntensity: 0.2,
    scrollCameraEnabled: false,
  },
  "/about": {
    blobColor: "#4f6ef7",
    blobScale: 0.8,
    blobOpacity: 0.08,
    cameraZ: 36,
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  "/contact": {
    blobColor: "#8b5cf6",
    blobScale: 0.5,
    blobOpacity: 0.05,
    cameraZ: 40,
    showTorusKnot: false,
    showSphere: false,
    floaterCount: 4,
    bloomIntensity: 0.15,
    scrollCameraEnabled: false,
  },
};

export const DEFAULT_SCENE_CONFIG: SceneConfig = SCENE_CONFIGS["/"];

/* ─── Featured Projects ─── */

export const FEATURED_PROJECTS: Project[] = [
  {
    id: "1",
    slug: "legal-ge",
    title: "Legal.ge",
    client: "Legal.ge",
    year: 2026,
    category: "Legal Services",
    thumbnail: "/images/projects/legal-ge.webp",
    tags: ["Next.js", "TypeScript", "Supabase", "AI"],
    featured: true,
    description:
      "A comprehensive Georgian legal services platform connecting clients with qualified attorneys. Smart case matching, document automation, and real-time consultation booking.",
    challenge:
      "Digitize a traditionally offline legal market — make finding and hiring lawyers in Georgia fast, transparent, and trustworthy.",
    solution:
      "AI-powered lawyer matching, automated document generation, secure client portals with real-time chat, and a clean interface that builds trust from the first visit.",
    results: [
      "3× faster client-lawyer matching",
      "60% reduction in document preparation time",
      "12K+ registered users in first quarter",
    ],
    liveUrl: "https://legal.ge",
    accentColor: "#4f6ef7",
  },
  {
    id: "2",
    slug: "xparagliding",
    title: "XParagliding",
    client: "XParagliding Georgia",
    year: 2026,
    category: "Adventure Tourism",
    thumbnail: "/images/projects/xparagliding.webp",
    tags: ["Three.js", "GSAP", "Next.js", "Stripe"],
    featured: true,
    description:
      "An immersive paragliding experience platform for adventure tourism in Georgia. 3D flight previews, real-time weather data, and seamless booking for tandem flights.",
    challenge:
      "Capture the thrill of paragliding in a digital experience that convinces visitors to book — translating adrenaline and breathtaking views into pixels.",
    solution:
      "Interactive 3D terrain flyovers with Three.js, dynamic weather integration, a visual route picker, and a frictionless Stripe-powered booking flow.",
    results: [
      "45% increase in online bookings",
      "2.5× longer average session duration",
      "Featured in Georgian tourism campaign",
    ],
    liveUrl: "https://xparagliding.ge",
    accentColor: "#06d6a0",
  },
  {
    id: "3",
    slug: "springs-estate",
    title: "Springs",
    client: "Springs Estate",
    year: 2026,
    category: "Luxury Real Estate",
    thumbnail: "/images/projects/springs.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADwAQCdASoQAAoABUB8JZACsAEPetqjIAAA/ujJ5G3V6RUAUJCWxSNKpee+EheNSW+hrSx4P1iAxhVUICoqAAAA",
    tags: ["Three.js", "WebGL", "3D Shaders"],
    featured: true,
    description:
      "A luxury residential development showcased through fluid water shader effects and immersive 3D environments. Every interaction feels like stepping into a wellness sanctuary.",
    challenge:
      "Translate the physical experience of luxury living — water, nature, serenity — into a digital format that evokes the same emotional response.",
    solution:
      "Custom Three.js water simulations with real-time shader effects for page transitions, a compact gallery scroll system, and an interactive 3D map of the property.",
    results: [
      "34% higher engagement vs. previous site",
      "Awwwards SOTD (7.23/10), DEV Award (7.36/10)",
      "Featured in WebGL collection (964+ followers)",
    ],
    liveUrl: "https://springs.estate",
    accentColor: "#2dd4a8",
  },
  {
    id: "4",
    slug: "darknode",
    title: "Darknode",
    client: "412th Nemesis Brigade",
    year: 2026,
    category: "Military & Tech",
    thumbnail: "/images/projects/darknode.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAACwAQCdASoQAAoABUB8JZwAAppCX+AAAP7o8PCdVVLnZl3YajqykGkbrxAEeVMDROXCbXpwIAA=",
    tags: ["3D", "GSAP", "Webflow", "Blender"],
    featured: true,
    description:
      "A mission-driven website for a special drone interceptor division within Ukraine's 412th brigade. Blending stealth aesthetics with minimal UI to convey precision and purpose.",
    challenge:
      "Communicate the gravity of a military operation while maintaining an immersive, modern digital presence that inspires support and awareness.",
    solution:
      "We crafted a dark, cinematic experience with 3D drone elements rendered in Blender, scroll-driven GSAP animations, and a tactical UI language that mirrors the unit's precision.",
    results: [
      "2.8× increase in volunteer applications",
      "Featured on Awwwards SOTD (7.31/10)",
      "40K+ unique visitors in first week",
    ],
    liveUrl: "https://www.darknode.army/en",
    accentColor: "#f90000",
  },
];

/* ─── Services ─── */

export const SERVICES: Service[] = [
  {
    id: "1",
    number: "01",
    icon: "✦",
    title: "Web Design & UX",
    description:
      "Research-driven interfaces that convert visitors into customers. We design every pixel with purpose — from wireframes to high-fidelity prototypes.",
    tags: ["Figma", "Prototyping", "User Research", "Design Systems"],
  },
  {
    id: "2",
    number: "02",
    icon: "⚡",
    title: "Web Development",
    description:
      "Scalable, performant code that brings designs to life. Modern frameworks, clean architecture, and pixel-perfect implementation.",
    tags: ["React", "Next.js", "TypeScript", "Node.js"],
  },
  {
    id: "3",
    number: "03",
    icon: "◈",
    title: "3D & WebGL",
    description:
      "Immersive 3D experiences that set your brand apart. Custom shaders, interactive scenes, and real-time rendering in the browser.",
    tags: ["Three.js", "R3F", "GLSL Shaders", "Blender"],
  },
  {
    id: "4",
    number: "04",
    icon: "◉",
    title: "E-Commerce",
    description:
      "Online stores built for growth. From product pages to checkout flows — optimized for conversions across every device.",
    tags: ["Shopify", "Headless CMS", "Stripe", "Inventory API"],
  },
  {
    id: "5",
    number: "05",
    icon: "✧",
    title: "Motion & Animation",
    description:
      "Scroll-driven storytelling and micro-interactions that make interfaces feel alive. Every transition serves a purpose.",
    tags: ["GSAP", "Framer Motion", "Lottie", "CSS Animations"],
  },
  {
    id: "6",
    number: "06",
    icon: "△",
    title: "SEO & Performance",
    description:
      "Technical SEO, Core Web Vitals optimization, and performance audits that drive organic traffic and keep users engaged.",
    tags: ["Core Web Vitals", "Lighthouse", "Schema", "Analytics"],
  },
];
