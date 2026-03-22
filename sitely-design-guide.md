# Sitely — "DIMENSION" Design System v2
## 3D Web Development Company — Multi-Page Architecture & Design Specification

---

## 1. დიზაინის ფილოსოფია

**კონცეფცია:** "DIMENSION" — ჩვენ ვაშენებთ ვებსაიტებს სამი განზომილებაში. ჩვენი საკუთარი საიტი ამის ცოცხალი დემონსტრაციაა.

**ძირითადი პრინციპები:**
- **Show, don't tell** — ყველა ანიმაცია და 3D ეფექტი რაც ჩვენ ვაკეთებთ, ჩვენს საიტზე უნდა ჩანდეს
- **Dark-first, tech aesthetic** — მუქი ფონი, ნეონური აქცენტები, depth ეფექტები
- **Morphing 3D backgrounds** — არა პარტიკლები, არამედ მორფირებადი ობიექტები (GPU shader-ზე)
- **Clip-path reveals** — fade-ის ნაცვლად, ჭრის ანიმაციები
- **Dual cursor** — ring + dot, premium interactivity
- **Scroll-driven 3D camera** — მომხმარებელი სამყაროში მოძრაობს scroll-ით
- **Performance-first** — ყველა ეფექტი ოპტიმიზირებული, 60fps გარანტია
- **Multi-page persistence** — 3D canvas, cursor, smooth scroll, theme არასდროს remount-დება

---

## 2. არქიტექტურა (Multi-Page)

### 2.1 Global Provider System

ეს არის ყველაზე მნიშვნელოვანი არქიტექტურული გადაწყვეტილება. Single-page-ისგან განსხვავებით, multi-page საიტზე გლობალურ ელემენტებს persistent state სჭირდებათ.

#### Root Layout Hierarchy (`src/app/layout.tsx`)
```
<html>
<body>
  <ThemeProvider>                    ← გლობალური: dark/light state, CSS variables
    <LenisProvider>                  ← გლობალური: smooth scroll instance
      <SceneProvider>                ← გლობალური: 3D scene config by current route
        <SceneCanvas />              ← FIXED: R3F Canvas, არასდროს remount-დება
        <NoiseOverlay />             ← FIXED: CSS pseudo-element, pointer-events: none
        <CustomCursor />             ← FIXED: desktop only, lerp animation
        <ScrollProgress />           ← FIXED: top gradient bar
        <Navbar />                   ← FIXED: glassmorphism pill nav
        <Preloader />                ← FIXED: first visit only (sessionStorage)
        <PageTransitionWrapper>      ← Framer Motion AnimatePresence
          {children}                 ← ← ← მხოლოდ ეს იცვლება route change-ზე!
        </PageTransitionWrapper>
        <Footer />                   ← ყველა გვერდის ბოლოს
        <ScrollToTop />              ← FIXED: bottom-right
      </SceneProvider>
    </LenisProvider>
  </ThemeProvider>
</body>
</html>
```

**მთავარი წესი:** 3D Canvas, Cursor, Scroll, Nav, Footer — **არასდროს** remount-დება. Route change-ზე მხოლოდ `{children}` იცვლება.

#### Provider Responsibilities

| Provider | State | Responsibility |
|----------|-------|----------------|
| `ThemeProvider` | `theme: 'dark' \| 'light'` | CSS variables toggle, localStorage persistence, ანიმაციით transition |
| `LenisProvider` | `lenis: Lenis instance` | Smooth scroll, GSAP ScrollTrigger sync, route change-ზე scrollTo(0) |
| `SceneProvider` | `sceneConfig: SceneConfig` | 3D scene parameters by route (blob color, camera, visibility, bloom) |

### 2.2 Route-Aware 3D Scene

Canvas ერთხელ mount-დება. Route იცვლება → 3D scene ანიმაციით ადაპტირდება (lerp/gsap, 0.8s duration):

```typescript
type SceneConfig = {
  blobColor: string          // hex color
  blobScale: number          // 0.3 - 1.0
  blobOpacity: number        // 0.04 - 0.12
  cameraZ: number            // 28 - 44
  showTorusKnot: boolean
  showSphere: boolean
  floaterCount: number       // 0 - 12
  bloomIntensity: number     // 0 - 0.5
  scrollCameraEnabled: boolean
}

const sceneConfigs: Record<string, SceneConfig> = {
  '/': {
    blobColor: '#4f6ef7',
    blobScale: 1.0,
    blobOpacity: 0.10,
    cameraZ: 32,
    showTorusKnot: true,
    showSphere: true,
    floaterCount: 12,
    bloomIntensity: 0.4,
    scrollCameraEnabled: true,
  },
  '/services': {
    blobColor: '#8b5cf6',       // violet accent — სერვისების თემა
    blobScale: 0.7,
    blobOpacity: 0.08,
    cameraZ: 38,
    showTorusKnot: true,
    showSphere: false,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  '/portfolio': {
    blobColor: '#06d6a0',       // cyan accent — პორტფოლიოს თემა
    blobScale: 0.5,
    blobOpacity: 0.06,
    cameraZ: 42,                // far — content-focused
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 6,
    bloomIntensity: 0.2,
    scrollCameraEnabled: false,
  },
  '/about': {
    blobColor: '#4f6ef7',
    blobScale: 0.8,
    blobOpacity: 0.08,
    cameraZ: 36,
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  '/contact': {
    blobColor: '#8b5cf6',
    blobScale: 0.5,
    blobOpacity: 0.05,
    cameraZ: 40,
    showTorusKnot: false,
    showSphere: false,
    floaterCount: 4,
    bloomIntensity: 0.15,
    scrollCameraEnabled: false,
  },
}
```

**Transition:** როცა route იცვლება, SceneProvider `usePathname()`-ით ამოიცნობს ახალ route-ს, new config-ს იღებს, და 3D ობიექტები `useFrame` lerp-ით ანიმირდება ახალ მდგომარეობაზე (0.8-1.2s).

### 2.3 Page Transitions (App Router + Framer Motion)

Next.js App Router-ს exit ანიმაციის native მხარდაჭერა არ აქვს. ამისთვის ვიყენებთ wrapper pattern-ს:

```typescript
// PageTransitionWrapper.tsx — 'use client'
// usePathname()-ით ტრიგერდება
// AnimatePresence mode="wait"
// children-ს key={pathname} გადაეცემა

const variants = {
  initial:  { opacity: 0, y: 20 },
  animate:  { opacity: 1, y: 0,   transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }},
  exit:     { opacity: 0, y: -10, transition: { duration: 0.25 }},
}
```

**Route change sequence:**
1. მომხმარებელი ლინკს აჭერს
2. Current page: exit ანიმაცია (0.25s — fade out + slide up)
3. 3D scene: config transition იწყება (0.8s — lerp to new state)
4. New page: initial → animate (0.45s — fade in + slide down)
5. Lenis: scrollTo(0, { immediate: true })
6. GSAP ScrollTrigger: refresh()

### 2.4 გვერდების რუკა (Routing)

```
src/app/
├── layout.tsx              ← Root layout (providers, global elements)
├── page.tsx                ← / (Home — landing page)
├── services/
│   └── page.tsx            ← /services
├── portfolio/
│   ├── page.tsx            ← /portfolio (gallery)
│   └── [slug]/
│       └── page.tsx        ← /portfolio/project-name (case study)
├── about/
│   └── page.tsx            ← /about
├── contact/
│   └── page.tsx            ← /contact
└── api/
    └── contact/
        └── route.ts        ← POST /api/contact (form handler)
```

---

## 3. კომპონენტების სისტემა

### 3.1 ფოლდერ სტრუქტურა

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   ├── services/page.tsx
│   ├── portfolio/page.tsx
│   ├── portfolio/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── globals.css             # CSS variables, base styles, noise, reveals
│   └── api/contact/route.ts
│
├── components/
│   ├── providers/              # Global state providers
│   │   ├── ThemeProvider.tsx    # dark/light + CSS variables + localStorage
│   │   ├── LenisProvider.tsx    # smooth scroll + GSAP sync
│   │   └── SceneProvider.tsx    # route-aware 3D config
│   │
│   ├── three/                  # 3D კომპონენტები (all 'use client')
│   │   ├── SceneCanvas.tsx     # R3F Canvas wrapper (global, fixed)
│   │   ├── scenes/
│   │   │   └── GlobalScene.tsx # blob + wireframes + lights + fog + post-processing
│   │   └── objects/
│   │       ├── MorphingBlob.tsx     # GPU shader morphing icosahedron
│   │       ├── WireframeKnot.tsx    # TorusKnot wireframe
│   │       ├── WireframeSphere.tsx  # Sphere wireframe
│   │       ├── FloatingShapes.tsx   # Octahedron cloud
│   │       └── OrbitLights.tsx      # Animated point lights
│   │
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Button.tsx          # primary, ghost, outline variants
│   │   ├── Card.tsx            # glass surface card (border, hover, glow line)
│   │   ├── SectionLabel.tsx    # monospace eyebrow tag with gradient border
│   │   ├── SectionTitle.tsx    # title + gradient <span> accent
│   │   ├── GradientText.tsx    # reusable gradient text wrapper
│   │   ├── Divider.tsx         # geometric SVG dividers (3 patterns)
│   │   ├── Marquee.tsx         # infinite scroll strip
│   │   ├── Accordion.tsx       # FAQ accordion item
│   │   └── TechTag.tsx         # small pill badge (JetBrains Mono)
│   │
│   ├── layout/                 # Global layout elements
│   │   ├── Navbar.tsx          # glassmorphism pill nav
│   │   ├── MobileMenu.tsx      # full-screen clip-path menu
│   │   ├── Footer.tsx          # 4-column footer
│   │   ├── CustomCursor.tsx    # dual cursor (ring + dot)
│   │   ├── ScrollProgress.tsx  # gradient top bar
│   │   ├── ScrollToTop.tsx     # gradient circle button
│   │   ├── NoiseOverlay.tsx    # PNG texture overlay
│   │   ├── Preloader.tsx       # SVG draw + loading bar
│   │   ├── ThemeToggle.tsx     # sun/moon toggle
│   │   ├── SideNav.tsx         # section dots (home page only)
│   │   └── PageTransitionWrapper.tsx  # Framer Motion AnimatePresence
│   │
│   ├── animations/             # Reusable animation wrappers
│   │   ├── RevealOnScroll.tsx  # rv, rv-clip, rv-mask, rv-scale (IntersectionObserver)
│   │   ├── StaggerChildren.tsx # auto data-d assignment to children
│   │   ├── CounterUp.tsx       # animated number counter
│   │   ├── TextScramble.tsx    # decode text effect
│   │   └── TiltCard.tsx        # 3D mouse-tracking tilt + glow
│   │
│   └── sections/               # Page-specific composite sections
│       ├── home/
│       │   ├── Hero.tsx
│       │   ├── ServicesPreview.tsx
│       │   ├── PortfolioPreview.tsx
│       │   ├── AboutPreview.tsx
│       │   ├── Testimonials.tsx
│       │   └── CTA.tsx
│       ├── services/
│       │   ├── ServicesHero.tsx
│       │   └── ServicesList.tsx
│       ├── portfolio/
│       │   ├── PortfolioHero.tsx
│       │   ├── PortfolioGrid.tsx
│       │   └── CaseStudy.tsx
│       ├── about/
│       │   ├── AboutHero.tsx
│       │   ├── Team.tsx
│       │   └── Process.tsx
│       └── contact/
│           ├── ContactHero.tsx
│           ├── ContactForm.tsx
│           └── ContactInfo.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useTheme.ts             # access ThemeProvider context
│   ├── useLenis.ts             # access LenisProvider context
│   ├── useSceneConfig.ts       # access SceneProvider context
│   ├── useScrollProgress.ts    # scroll percentage 0-1
│   ├── useInView.ts            # IntersectionObserver hook
│   ├── useMediaQuery.ts        # responsive breakpoint detection
│   └── useIsMobile.ts          # pointer:coarse + width check
│
├── lib/                        # Utilities
│   ├── supabase/
│   │   ├── client.ts           # createBrowserClient()
│   │   └── server.ts           # createServerClient()
│   ├── constants.ts            # colors, section IDs, nav items, services data
│   ├── sceneConfigs.ts         # route → SceneConfig mapping
│   └── utils.ts                # cn(), lerp(), clamp() helpers
│
├── types/                      # TypeScript definitions
│   └── index.ts                # SceneConfig, Service, Project, Testimonial, etc.
│
public/
├── models/                     # .glb 3D models (if needed later)
├── textures/
│   └── noise.png               # 128x128 tileable noise texture
├── images/                     # portfolio screenshots, team photos
└── fonts/                      # self-hosted fonts (optional, prefer next/font)
```

### 3.2 Reusable Component API Examples

```tsx
// ნებისმიერ გვერდზე section header:
<SectionLabel>WHAT WE DO</SectionLabel>
<SectionTitle accent="Stand Out">Services That</SectionTitle>
// → "Services That" normal + "Stand Out" gradient

// ნებისმიერ გვერდზე reveal ანიმაცია:
<RevealOnScroll type="clip" delay={2}>
  <Card hover="lift" glowLine>
    <p>content</p>
  </Card>
</RevealOnScroll>

// Stagger grid:
<StaggerChildren>
  {items.map(item => <Card key={item.id}>...</Card>)}
</StaggerChildren>
// → ავტომატურად ანიჭებს data-d="1", data-d="2", ...

// Counter:
<CounterUp value={50} suffix="+" duration={1600} />

// Gradient text:
<GradientText>Dimensions</GradientText>

// Buttons:
<Button variant="primary" size="lg">See Our Work</Button>
<Button variant="ghost">Get in Touch</Button>

// Tilt card:
<TiltCard maxTilt={10}>
  <img src={project.thumbnail} />
</TiltCard>
```

---

## 4. ფერების პალიტრა

### Dark Theme (ძირითადი)

| ცვლადი        | Hex / Value                    | გამოყენება                     |
|---------------|--------------------------------|--------------------------------|
| `--bg`        | `#06060b`                      | მთავარი ფონი (deep space)      |
| `--bg-2`      | `#0a0a12`                      | სექციის ალტერნატიული ფონი     |
| `--bg-3`      | `#10101c`                      | მესამე ფონის დონე              |
| `--surf`      | `rgba(12,12,22,0.72)`          | Card/surface ფონი              |
| `--surf-h`    | `rgba(18,18,32,0.88)`          | Surface hover state            |
| `--glass`     | `rgba(6,6,11,0.85)`            | Glassmorphism ნავიგაციისთვის   |
| `--brd`       | `rgba(148,163,255,0.06)`       | ბორდერი (ძალიან სუსტი)        |
| `--brd-2`     | `rgba(148,163,255,0.12)`       | ბორდერი (საშუალო)              |
| `--brd-3`     | `rgba(148,163,255,0.20)`       | ბორდერი (აქტიური)             |
| `--tx`        | `#eaeaff`                      | მთავარი ტექსტი (cool white)    |
| `--tx-2`      | `#8a8aad`                      | მეორადი ტექსტი                 |
| `--tx-3`      | `#4a4a6a`                      | მესამადი ტექსტი / muted        |
| `--blue`      | `#4f6ef7`                      | **პირველადი აქცენტი** (electric blue) |
| `--blue-l`    | `#6b8aff`                      | Blue hover state               |
| `--blue-g`    | `rgba(79,110,247,0.25)`        | Blue glow/shadow               |
| `--blue-s`    | `rgba(79,110,247,0.07)`        | Blue subtle background         |
| `--violet`    | `#8b5cf6`                      | **მეორადი აქცენტი** (violet)   |
| `--violet-g`  | `rgba(139,92,246,0.20)`        | Violet glow                    |
| `--violet-s`  | `rgba(139,92,246,0.07)`        | Violet subtle bg               |
| `--cyan`      | `#06d6a0`                      | **მესამადი აქცენტი** (cyan-green) |
| `--cyan-g`    | `rgba(6,214,160,0.18)`         | Cyan glow                      |
| `--cyan-s`    | `rgba(6,214,160,0.07)`         | Cyan subtle bg                 |

### Gradient-ები (CSS Implementation)
```css
/* CSS custom properties-ში gradient პირდაპირ ვერ შეინახება "background"-ისთვის.
   ამიტომ ვინახავთ color stops-ს ცალ-ცალკე და utility class-ებს ვიყენებთ: */

:root {
  --grad-from:  #4f6ef7;
  --grad-to:    #8b5cf6;
}

/* Utility classes: */
.grad-primary   { background: linear-gradient(135deg, #4f6ef7, #8b5cf6); }
.grad-secondary { background: linear-gradient(135deg, #8b5cf6, #06d6a0); }
.grad-tertiary  { background: linear-gradient(135deg, #4f6ef7, #06d6a0); }

/* Gradient text utility: */
.grad-text {
    background: linear-gradient(135deg, var(--grad-from), var(--grad-to));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

### Light Theme

| ცვლადი        | Hex / Value                    | ცვლილება                       |
|---------------|--------------------------------|--------------------------------|
| `--bg`        | `#f5f5fa`                      | Soft cool-white                |
| `--bg-2`      | `#ebebf2`                      | ალტერნატიული ფონი              |
| `--bg-3`      | `#e0e0ea`                      | მესამე დონე                    |
| `--surf`      | `rgba(255,255,255,0.82)`       | Card surface                   |
| `--glass`     | `rgba(245,245,250,0.90)`       | Nav glass                      |
| `--tx`        | `#0a0a18`                      | მუქი ტექსტი                    |
| `--tx-2`      | `#5a5a7a`                      | მეორადი                        |
| `--blue`      | `#3b5ce4`                      | უფრო მუქი blue light-ზე       |
| `--violet`    | `#7c3aed`                      | მუქი violet light-ზე           |
| `--cyan`      | `#059669`                      | მუქი cyan light-ზე             |

### ძირითადი ფერთა შეთანხმება
```
ბრენდი:     BLUE #4f6ef7 + VIOLET #8b5cf6 + CYAN #06d6a0
ფონი:       #06060b (deep space) — არა #000000
ტექსტი:     #eaeaff (cool white) — არა #ffffff
გრადიენტი:  blue → violet (primary CTA-ებზე)
```

---

## 5. ტიპოგრაფია

### შრიფტები

| შრიფტი           | წონები              | გამოყენება                         |
|------------------|---------------------|------------------------------------|
| **Space Grotesk**| 300, 400, 500, 600, 700 | სათაურები, ნავიგაცია, accent       |
| **Inter**        | 300, 400, 500, 600 | body ტექსტი, აღწერები              |
| **JetBrains Mono**| 400, 500           | კოდის სნიპეტები, tech labels       |

**Loading:** `next/font/google` (automatic optimization, no layout shift)

### CSS ცვლადები
```css
--fh: var(--font-space-grotesk), sans-serif;     /* headings */
--fb: var(--font-inter), sans-serif;              /* body */
--fc: var(--font-jetbrains-mono), monospace;      /* code */
```

### ზომების სისტემა

| ელემენტი                | ზომა                                    | წონა | სტილი        |
|------------------------|-----------------------------------------|------|-------------|
| Hero title             | `clamp(3rem, 8vw, 6rem)`               | 700  | gradient text on brand word |
| Page hero title        | `clamp(2.5rem, 6vw, 4.5rem)`           | 700  | gradient accent word |
| Section title          | `clamp(2rem, 5vw, 3.5rem)`             | 600  | gradient `<span>` აქცენტზე |
| Card h3                | `clamp(1.1rem, 2vw, 1.3rem)`           | 600  | normal       |
| Body text              | `clamp(0.88rem, 1.3vw, 1rem)`          | 400  | normal       |
| Card description       | `0.875rem`                              | 400  | normal       |
| Tag/label              | `0.7rem`                                | 600  | uppercase, letter-spacing: 2px, monospace |
| Nav links              | `0.8rem`                                | 500  | uppercase, letter-spacing: 1px |
| Code snippets          | `0.82rem`                               | 400  | JetBrains Mono |
| Pill badges            | `0.65rem`                               | 600  | uppercase, letter-spacing: 1.5px |

### ტიპოგრაფიის წესები
- **Hero title:** font-weight: 700 (bold/impactful), line-height: 1.08
- **Gradient text:** `.grad-text` class — ბრენდის/accent სიტყვისთვის
- **Section titles:** ყოველთვის მოიცავს gradient `<span>` accent სიტყვისთვის
- **Body:** line-height: 1.7 (body), 1.8 (descriptions)
- **Tech labels:** JetBrains Mono, uppercase, letter-spacing: 2px, font-size: 0.7rem
- **letter-spacing:** -0.02em სათაურებზე, 1-2px uppercase label-ებზე

---

## 6. 3D სცენა (React Three Fiber)

### 6.1 ტექნოლოგია
- **@react-three/fiber** (R3F) — React renderer Three.js-ისთვის
- **@react-three/drei** — helper კომპონენტები (useProgress, etc.)
- **@react-three/postprocessing** — post-processing ეფექტები
- **Custom GLSL Shaders** — GPU morphing (CPU-ს ნაცვლად)

### 6.2 Canvas Setup (Global — SceneCanvas.tsx)

```
'use client'
dynamic import: next/dynamic with ssr: false

Canvas props:
  style:        position: fixed; inset: 0; z-index: 0; pointer-events: none
  camera:       { fov: 55, near: 0.1, far: 600, position: [0, 0, 32] }
  gl:           { antialias: !isMobile, alpha: false, powerPreference: 'high-performance' }
  dpr:          Math.min(devicePixelRatio, 2)

R3F Suspense:   fallback={null} — preloader ცალკე მუშაობს useProgress()-ით

შიდა სტრუქტურა:
  <Canvas>
    <GlobalScene />     ← ყველა 3D ობიექტი, განათება, fog, post-processing
  </Canvas>

გვერდის კონტენტი: position: relative; z-index: 1 (კანვასის ზემოთ)
```

### 6.3 Scene Config Integration

GlobalScene კომპონენტი `useSceneConfig()` hook-ით იღებს მიმდინარე route-ის config-ს და ყველა პარამეტრს lerp-ით ანიმირებს:

```javascript
// GlobalScene.tsx — useFrame ყოველ frame-ზე
const config = useSceneConfig()  // from SceneProvider context

useFrame(() => {
  // Smooth lerp towards target config
  currentBlobScale += (config.blobScale - currentBlobScale) * 0.02
  currentCameraZ += (config.cameraZ - currentCameraZ) * 0.02
  currentBloom += (config.bloomIntensity - currentBloom) * 0.03
  // ... etc
})
```

### 6.4 Fog & Renderer

```
Fog:
  Type:         FogExp2
  Color:        0x06060b (dark) / 0xf5f5fa (light)
  Density:      0.012

Renderer:
  toneMapping:  ACESFilmicToneMapping
  clearColor:   0x06060b (dark) / 0xf5f5fa (light)
  
  Theme change: fog + clearColor lerp over 0.8s
```

### 6.5 Post-Processing (Desktop Only)

```
EffectComposer:
  - Bloom: intensity [per-route config], luminanceThreshold 0.6, radius 0.8
  - Vignette: offset 0.3, darkness 0.7 (dark theme only)
  - ChromaticAberration: offset [0.0006, 0.0006] (ძალიან subtle)
  
Disabled when:
  - useIsMobile() === true
  - Light theme: Vignette disabled, Bloom intensity *= 0.25
```

### 6.6 3D ობიექტები

#### 1. მორფირებადი Icosahedron — GPU Shader (მთავარი blob)

```
Geometry:       IcosahedronGeometry(7, 5)     desktop
                IcosahedronGeometry(5, 4)     mobile
Material:       ShaderMaterial (custom vertex + fragment)

Vertex Shader (GLSL):
  uniform float uTime;
  uniform vec2 uMouse;         // mouse influence (-1..1, -1..1)
  uniform float uScale;        // route-aware scale factor (lerped)
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec3 pos = position * uScale;
    vec3 norm = normalize(normal);
    
    float displacement = sin(norm.x * 2.5 + uTime * 0.7)
                       * sin(norm.y * 2.5 + uTime * 0.55)
                       * sin(norm.z * 2.5 + uTime * 0.4)
                       * 0.45;
    
    // mouse influence
    displacement += (uMouse.x * norm.x + uMouse.y * norm.y) * 0.15;
    
    vec3 newPosition = pos + norm * displacement;
    
    vNormal = normalize(normalMatrix * norm);
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }

Fragment Shader (GLSL):
  uniform vec3 uColor;         // route-aware color (lerped in JS)
  uniform float uOpacity;      // route-aware opacity (lerped)
  uniform vec3 uFresnelColor;  // edge glow color
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Fresnel effect — edges glow brighter
    vec3 viewDir = normalize(-vPosition);  // view space
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
    
    vec3 color = mix(uColor, uFresnelColor, fresnel * 0.6);
    float alpha = uOpacity + fresnel * 0.08;
    
    gl_FragColor = vec4(color, alpha);
  }

Position:       (0, 0, 0) — ცენტრში
Rotation:       y += 0.0006/frame, x += 0.0002/frame
```

#### 2. Wireframe Icosahedron (იგივე shader approach)

```
Geometry:       IcosahedronGeometry(7, 5) — იგივე parameters
Material:       ShaderMaterial — იგივე vertex shader, როგორც blob-ის!
  - wireframe:  true (Three.js material.wireframe = true)
  - Fragment:   simple — single color, transparent
  - color:      0x4f6ef7 (blue)
  - opacity:    0.03
Scale:          1.03 (ოდნავ უფრო დიდი)

რატომ იგივე shader:
  GPU-დან position readback (blob → clone copy per frame) ძალიან ძვირია (GPU→CPU stall).
  ნაცვლად ამისა, იგივე vertex shader ეშვება ორივე mesh-ზე — ისინი ზუსტად ერთნაირად
  მორფირდებიან პარალელურად. SharedMaterial uniforms ერთი და იგივეა.
  შედეგი: perfect synchronized wireframe overlay, zero CPU cost.
```

#### 3. TorusKnot (violet wireframe)
```
Geometry:       TorusKnotGeometry(5, 0.5, 120, 16, 2, 3)   desktop
                TorusKnotGeometry(3.5, 0.5, 80, 16, 2, 3)  mobile
Material:       MeshStandardMaterial
  - color:      0x8b5cf6 (violet)
  - wireframe:  true
  - transparent: true
  - opacity:    0.08 (dark) / 0.05 (light)
  - roughness:  0.2
  - metalness:  0.8
Position:       (13, -4, -8)  desktop  |  (7, -3, -5)  mobile
Rotation:       x += 0.0008, y += 0.0004
Visibility:     route-dependent (config.showTorusKnot)
                fade: opacity lerps to 0 or target over ~0.5s
```

#### 4. Sphere (cyan wireframe)
```
Geometry:       SphereGeometry(3.5, 32, 32)    desktop
                SphereGeometry(2.5, 24, 24)    mobile
Material:       MeshStandardMaterial
  - color:      0x06d6a0 (cyan)
  - wireframe:  true
  - transparent: true
  - opacity:    0.06 (dark) / 0.04 (light)
  - roughness:  0.3
  - metalness:  0.7
Position:       (-11, 5, -6)  desktop  |  (-6, 4, -3)  mobile
Rotation:       y -= 0.0006, z += 0.0003
Visibility:     route-dependent (config.showSphere)
```

#### 5. მცურავი Octahedron-ები
```
Max count:      12 (all pre-created, visibility toggle)
Geometry:       OctahedronGeometry(random 0.15-0.5, 0)
Material:       MeshStandardMaterial
  - color:      ციკლურად [blue, violet, cyan, white]
  - transparent: true
  - opacity:    0.06 + random * 0.05
  - roughness:  0.3
  - metalness:  0.7
Position:       random (-18..18, -12..12, -10..10)
Animation:      
  - rotation: speed * 2 (x), speed * 3 (y)
  - float: y = origY + sin(time * 0.4 + index) * 0.6
  - speed: random 0.0003 to 0.001
Visibility:     index < config.floaterCount → opacity lerps to target, else → 0
```

### 6.7 განათება

| Light           | Type       | Color      | Intensity | Range | Position                |
|-----------------|------------|------------|-----------|-------|-------------------------|
| Ambient         | Ambient    | `0x0a0a22` | 0.3       | -     | -                       |
| Point 1 (blue)  | Point      | `0x4f6ef7` | 1.0       | 80    | orbiting: sin/cos * 14-18 |
| Point 2 (violet)| Point      | `0x8b5cf6` | 0.5       | 80    | orbiting: cos/sin * 12-16 |
| Point 3 (cyan)  | Point      | `0x06d6a0` | 0.3       | 60    | static (0, 14, -10)    |

```javascript
// Orbit animation (useFrame):
pt1.position.x = Math.sin(time * 0.18) * 14
pt1.position.z = Math.cos(time * 0.18) * 18
pt2.position.x = Math.cos(time * 0.13) * 12
pt2.position.z = Math.sin(time * 0.13) * 16
```

### 6.8 ინტერაქცია

#### Scroll-ზე Camera Animation (Per-Page)
```javascript
// მხოლოდ როცა config.scrollCameraEnabled === true
// Lenis-იდან ვიღებთ scroll progress-ს

const scrollFraction = scrollY / (bodyHeight - windowHeight)

// useFrame-ში lerp (smooth follow):
camera.position.y = lerp(camera.position.y, -scrollFraction * 14, 0.05)
camera.position.x = lerp(camera.position.x, Math.sin(scrollFraction * Math.PI) * 4, 0.05)
camera.position.z = lerp(camera.position.z, config.cameraZ - scrollFraction * 3, 0.05)
camera.rotation.z = lerp(camera.rotation.z, Math.sin(scrollFraction * Math.PI) * 0.02, 0.05)

// Route change: scrollFraction resets → camera smoothly returns to config.cameraZ
```

#### Mouse Influence (blob shader — global)
```javascript
// ყველა გვერდზე active
const mouseX = (clientX / width - 0.5) * 2   // -1 to 1
const mouseY = (clientY / height - 0.5) * 2  // -1 to 1

// Smooth lerp
targetMouse.x += (mouseX - targetMouse.x) * 0.05
targetMouse.y += (mouseY - targetMouse.y) * 0.05

// shader uniform-ში:
blobMaterial.uniforms.uMouse.value.set(targetMouse.x, targetMouse.y)
```

### 6.9 თემის შეცვლის ანიმაცია (Global)
```
dark → light (lerp over 0.8s):
  - blob fresnel color: lerp to darker blue
  - blob uOpacity: 0.10 → 0.06  (or current route config * 0.6)
  - torusKnot opacity: 0.08 → 0.05
  - sphere opacity: 0.06 → 0.04
  - fog.color: 0x06060b → 0xf5f5fa
  - renderer.setClearColor: 0x06060b → 0xf5f5fa
  - bloom intensity: × 0.25
  - vignette: disabled in light
```

---

## 7. ანიმაციები და ეფექტები

### 7.1 Reveal ანიმაციები (RevealOnScroll კომპონენტი)

IntersectionObserver-ზე დაფუძნებული. Reusable wrapper — wrap ნებისმიერ ელემენტს.

```typescript
// API:
<RevealOnScroll 
  type="fade" | "clip" | "mask" | "scale"  
  delay={0}        // stagger index (0-6)
  threshold={0.08} // default
>
  {children}
</RevealOnScroll>
```

#### `type="fade"` — Fade + Slide Up
```css
[data-rv="fade"]         { opacity: 0; transform: translateY(28px); }
[data-rv="fade"].visible { opacity: 1; transform: translateY(0); }
transition: opacity 0.9s var(--ease), transform 0.9s var(--ease);
```

#### `type="clip"` — Clip-path Reveal (ქვემოდან ზემოთ)
```css
[data-rv="clip"]         { clip-path: inset(100% 0 0 0); }
[data-rv="clip"].visible { clip-path: inset(0 0 0 0); }
transition: clip-path 0.85s var(--ease);
```

#### `type="mask"` — Clip-path Mask (მარცხნიდან მარჯვნივ)
```css
[data-rv="mask"]         { clip-path: inset(0 100% 0 0); }
[data-rv="mask"].visible { clip-path: inset(0 0 0 0); }
transition: clip-path 0.95s var(--ease);
```

#### `type="scale"` — Scale Reveal
```css
[data-rv="scale"]         { opacity: 0; transform: scale(0.92); }
[data-rv="scale"].visible { opacity: 1; transform: scale(1); }
transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
```

#### Stagger Delays (data-d attribute)
```css
[data-d="1"] { transition-delay: 0.08s; }
[data-d="2"] { transition-delay: 0.16s; }
[data-d="3"] { transition-delay: 0.24s; }
[data-d="4"] { transition-delay: 0.32s; }
[data-d="5"] { transition-delay: 0.40s; }
[data-d="6"] { transition-delay: 0.48s; }
```

#### Observer Config
```javascript
threshold: 0.08
rootMargin: '0px 0px -40px 0px'
once: true  // — element stays visible, no re-trigger
```

### 7.2 Hero Title Animation (GSAP Timeline)
```javascript
const tl = gsap.timeline({ delay: 0.3 })

tl.from('.hero-word', {
  y: 60, opacity: 0, rotateX: -15,
  duration: 0.8, ease: 'power3.out', stagger: 0.12
})
.from('.hero-gradient', {
  backgroundSize: '0% 100%',
  duration: 0.6, ease: 'power2.out'
}, '-=0.3')
.from('.hero-sub', {
  y: 20, opacity: 0,
  duration: 0.6, ease: 'power3.out'
}, '-=0.2')
.from('.hero-btns', {
  y: 16, opacity: 0,
  duration: 0.5, ease: 'power3.out'
}, '-=0.1')
```

### 7.3 Scroll Progress Bar (ScrollProgress — Global)
```css
position: fixed; top: 0; left: 0; height: 2px; z-index: 10001;
background: linear-gradient(90deg, var(--blue), var(--violet));
width: /* useScrollProgress() * 100% */;
box-shadow: 0 0 10px var(--blue-g);
```

### 7.4 Marquee (Marquee კომპონენტი)
```css
@keyframes marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
/* duration: 30s, linear, infinite */
/* content: tech stack icons + names */
/* separator: "/" (monospace, var(--tx-3)) */
/* hover: animation-play-state: paused */
/* content duplicated 2x for seamless loop */
```

### 7.5 Counter Animation (CounterUp კომპონენტი)
```javascript
// Trigger: IntersectionObserver threshold 0.5
// Duration: 1600ms
// Easing: 1 - (1 - progress)^3 (ease-out cubic)
// Supports: suffix "+", "%", "x" and prefix "$", ">"
// once: true (no re-trigger)
```

### 7.6 Portfolio Card Hover (TiltCard კომპონენტი)
```javascript
// mouse position relative to card center
const rotateX = (mouseY - centerY) / height * -maxTilt   // ±10-12deg
const rotateY = (mouseX - centerX) / width * maxTilt

style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`

// glow follows mouse:
style.background = `radial-gradient(circle at ${relX}px ${relY}px, var(--blue-s) 0%, transparent 60%)`

// reset on mouseleave: transition 0.5s var(--ease)
// disabled on touch devices (useIsMobile)
```

### 7.7 Text Scramble Effect (TextScramble კომპონენტი)
```javascript
// "decode" ეფექტი — ასოები ჯერ random symbolic, შემდეგ ნამდვილი
const chars = '!@#$%^&*()_+=-<>?/{}[]|'
// ~30 iterations, 30ms interval
// თითოეული ასო ცალ-ცალკე "locks in" from left to right
// Trigger: IntersectionObserver entry, once: true
```

### 7.8 Custom Cursor (CustomCursor — Global, Desktop Only)
```javascript
// Ring: 40px idle → 60px hover, lerp speed 0.08, 1.5px border
// Dot: 4px, lerp speed 0.22, var(--blue) background
// Activator selectors: 'a', 'button', '[data-cur]'
//   → ring scales up, border becomes gradient
// Text indicator: data-cur="view" → "VIEW" text appears inside ring
// Click state: ring briefly shrinks to 30px
// Return null when: useIsMobile() === true
// CSS: @media(pointer:coarse) { .cursor-ring, .cursor-dot { display: none } }
```

### 7.9 Smooth Scrolling (LenisProvider — Global)
```javascript
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
})

// GSAP ScrollTrigger sync:
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// Route change handling:
// 1. lenis.scrollTo(0, { immediate: true })
// 2. Wait for new page render
// 3. ScrollTrigger.refresh() — recalculate all trigger positions
```

### 7.10 Page Transitions
```
იხილეთ Section 2.3 — Route change sequence დეტალურად.

Summary:
  exit:     opacity 0, y -10, 0.25s
  enter:    opacity 1, y 0,   0.45s, ease [0.22, 1, 0.36, 1]
  3D scene: lerps to new config during transition (0.8s)
```

### 7.11 Global Easing Functions
```css
--ease:        cubic-bezier(0.22, 1, 0.36, 1);     /* primary — smooth deceleration */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* slight overshoot */
--ease-in:     cubic-bezier(0.55, 0, 1, 0.45);     /* acceleration */
```

---

## 8. გვერდები და სექციები

### 8.0 Preloader (Global — First Visit Only)

```
Logic: 
  if (sessionStorage.getItem('sitely-loaded')) → skip preloader entirely
  else → show preloader, on complete: sessionStorage.setItem('sitely-loaded', 'true')

Visual:
  - Full-screen overlay, z-index: 99999, bg: var(--bg)
  - Sitely logo (SVG path): stroke-dashoffset animation draws logo (1.5s)
  - Loading bar: gradient, width driven by R3F useProgress() (real 3D load %)
  - "Loading experience..." text (JetBrains Mono, 0.7rem, var(--tx-3))
  - Complete: logo pulses once → overlay clips up (clip-path: inset(0 0 100% 0), 0.6s)
```

### 8.1 Navigation (Navbar — Global)

```
Structure:     fixed, top: 16px, centered, max-width: var(--mw)
Style:         pill shape (border-radius: 60px)
Background:    glassmorphism — backdrop-filter: blur(24px), var(--glass)
Border:        1px solid var(--brd)
Shadow:        appears on scroll > 50px — 0 4px 30px rgba(0,0,0,0.3)

Desktop:       Logo | Nav Links | Theme Toggle | CTA Button
Mobile:        Logo | Theme Toggle | Hamburger → Full-screen Panel

Logo:          "sitely" wordmark — Space Grotesk 700, 1.1rem
               dot in "i" = gradient circle (blue→violet)
               hover: dot pulses
               <Link href="/">

NavLinks:      Home, Services, Portfolio, About, Contact
               Next.js <Link> components with prefetch
               uppercase, 0.8rem, letter-spacing: 1px
               hover: color → var(--blue), underline slides in (left→right, 0.3s)
               active (current route via usePathname): gradient underline, font-weight: 600
```

**Mobile Menu (MobileMenu — Global):**
```
Full-screen overlay, var(--bg) with slight transparency, z-index: 9999
Open animation: clip-path: inset(0 0 0 100%) → inset(0) (from right, 0.5s var(--ease))
Links: centered, large (1.8rem), Space Grotesk 600, stagger (0.1s each)
3D scene: stays visible behind
Close: X button + Escape key + clicking any link (auto-close after navigate)
```

### 8.2 Footer (Global)

```
Grid: 1fr (mobile) → 2fr 1fr 1fr 1fr (768px+)

Col 1: Brand
  - "sitely" logo
  - description (2 lines, var(--tx-2), Inter 400)
  - social icons: GitHub, Dribbble, LinkedIn, X
    - 36px circles, var(--brd) border, hover: gradient bg + white icon + scale(1.1)

Col 2: Services — 3D Design, Animation, Development, UI/UX, Support
Col 3: Company — About, Portfolio, Process, Blog, Careers
Col 4: Contact — Email, Phone, Location

Bottom bar:
  - padding-top: 24px, border-top: 1px solid var(--brd)
  - left: "© 2026 Sitely. All rights reserved."
  - right: "Privacy Policy • Terms of Service"

Link hover: color → var(--blue), translateX(3px), 0.2s
```

---

### 8.3 Home Page (`/`)

**3D Config:** Full scene — blob blue, scale 1.0, all objects visible, 12 floaters, bloom 0.4, scroll camera ON

#### Hero
```
Centered, min-height: 100vh, flex center
1. <SectionLabel>WEB DEVELOPMENT STUDIO</SectionLabel>
2. Title: "We Build Websites in Three <GradientText>Dimensions</GradientText>"
   — GSAP stagger word animation (Section 7.2)
3. Subtitle: "3D visuals. Smooth animations. Immersive pages."
4. <Button variant="primary">See Our Work</Button> → /portfolio
   <Button variant="ghost">Get in Touch</Button> → /contact
5. Scroll indicator (bottom): mouse icon + bouncing dot + "Scroll to explore"
   — fades out on scrollY > 100
Frame: 4 corner brackets (L-shape, ::before/::after, var(--brd-2), opacity 0.3)
```

#### Tech Stack Marquee
```
<Marquee />
"Next.js / React / Three.js / GSAP / Supabase / TypeScript / Tailwind / Node.js"
```

#### Services Preview (top 3)
```
<SectionLabel>WHAT WE DO</SectionLabel>
<SectionTitle accent="Stand Out">Services That</SectionTitle>
Grid 1→2→3 col, staggered (even cards translateY(36px))
<Button variant="ghost">All Services →</Button> → /services
```

#### Portfolio Preview (2-3 featured)
```
<SectionLabel>OUR WORK</SectionLabel>
<SectionTitle accent="Motion">Projects in</SectionTitle>
<TiltCard /> for each project
<Button variant="primary">View Portfolio</Button> → /portfolio
```

#### About Preview
```
<SectionLabel>WHO WE ARE</SectionLabel>
<SectionTitle accent="Future">Building the</SectionTitle>
Asymmetric grid: text left, 2x2 <CounterUp /> stat boxes right
```

#### Testimonials
```
<SectionLabel>CLIENT REVIEWS</SectionLabel>
<SectionTitle accent="Say">What Clients</SectionTitle>
Carousel: Framer Motion AnimatePresence, manual nav only (no auto-advance)
Card: glass surface, stars, italic quote, initials avatar, name, company
Controls: prev/next ghost circles + dot indicators
```

#### CTA
```
Rounded box, bg: var(--bg-2), radial gradient glows (blue-g + violet-g)
<RevealOnScroll type="clip">
  <SectionLabel>READY TO START?</SectionLabel>
  <SectionTitle accent="Extraordinary">Let's Build Something</SectionTitle>
  <Button variant="primary" size="lg">Start a Project →</Button>
</RevealOnScroll>
```

#### Side Navigation Dots (Home page ONLY)
```
position: fixed, right: 20px, vertically centered
One dot per section, gradient when active, scale(1.4)
Hover: tooltip label, Click: lenis.scrollTo(section)
Hidden below 1100px
```

#### Geometric Dividers (between sections)
```
3 SVG patterns: Circuit, Diamond Grid, Pulse
SVG max-width 500px, viewBox 0 0 1000 40
color: var(--tx-3), opacity: 0.4
```

---

### 8.4 Services Page (`/services`)

**3D Config:** blob violet, scale 0.7, cameraZ 38, floaters 8, bloom 0.3

```
ServicesHero:
  <SectionLabel>OUR SERVICES</SectionLabel>
  Page title: "What We <GradientText>Build</GradientText>"
  Subtitle paragraph

ServicesList:
  Complete 6 service cards — staggered grid 1→2→3 col
  Each <Card hover="lift" glowLine>:
    ghost number "01", icon pill, title, expanded description, tech tags

CTA at bottom → /contact
```

### 8.5 Portfolio Page (`/portfolio`)

**3D Config:** blob cyan, scale 0.5, cameraZ 42, floaters 6, bloom 0.2

```
PortfolioHero:
  <SectionLabel>OUR WORK</SectionLabel>
  "Projects in <GradientText>Motion</GradientText>"

Filter tabs: All, Corporate, E-Commerce, Landing Pages, Web Apps
  - pill buttons, gradient on active, layout animation on filter

PortfolioGrid: asymmetric — featured span 2x2, standard 1x1
  <TiltCard /> for each project
  hover: tilt + glow + dark overlay + info slides up
  click: <Link href="/portfolio/[slug]" />
```

### 8.6 Portfolio Case Study (`/portfolio/[slug]`)

```
Hero image/video (full-width, 60vh)
Project: name, client, year, tech stack
Sections: Challenge → Solution → Result
Screenshots gallery
Link to live site
"Next Project" → next case study
```

### 8.7 About Page (`/about`)

**3D Config:** blob blue, scale 0.8, cameraZ 36, floaters 8, bloom 0.3

```
AboutHero: story + mission
Stats row: <CounterUp /> — "50+/Projects", "99%/Satisfaction", etc.

Process:
  Desktop (1024px+): horizontal timeline, 4 steps, gradient line draws on scroll
  Mobile: vertical timeline, gradient line left
  Steps: Discovery → Design → Develop → Launch

Team (optional): member cards, photos, roles, social links
```

### 8.8 Contact Page (`/contact`)

**3D Config:** blob violet, scale 0.5, cameraZ 40, floaters 4, bloom 0.15

```
ContactHero:
  "Start Your <GradientText>Project</GradientText>"

Grid 1→2 col:
  Left: ContactForm
    Fields: Name, Email, Company (optional), Budget (select), Message
    Input: var(--surf) bg, focus: blue border + glow ring
    Submit → /api/contact (POST → Supabase insert + email)
    
  Right: ContactInfo
    Email, Phone, Location (each with gradient icon circle)
    Working hours
    Social links

Optional FAQ <Accordion /> below
```

---

## 9. UI Elements

### 9.1 Buttons

| Variant | Style |
|---------|-------|
| `primary` | Gradient bg (blue→violet), white text, radius 50px, glow shadow, hover: translateY(-2px) |
| `ghost` | Transparent, border var(--brd-3), radius 50px, hover: border+text → blue |
| `outline` | Transparent, gradient border (::before pseudo), radius 50px, hover: fill gradient |

Sizes: `sm` (px:16 py:8), `md` (px:24 py:12), `lg` (px:32 py:16)

### 9.2 Card

```
Base: radius 20px, bg var(--surf), backdrop-filter blur(8px), border 1px var(--brd)
Padding: clamp(24px, 4vw, 40px)

hover="lift"  → translateY(-8px), border-color var(--brd-3), box-shadow
hover="tilt"  → TiltCard behavior (3D mouse tracking)
glowLine      → ::before gradient top line (opacity 0→1 on hover)
```

### 9.3 Section Components

```tsx
<SectionLabel>WHAT WE DO</SectionLabel>
→ gradient left border (2px) + monospace text (0.7rem, uppercase, tracking 2px)

<SectionTitle accent="Stand Out">Services That</SectionTitle>
→ heading + gradient <span> for accent word
```

### 9.4 Noise Overlay (Global)
```css
.noise-overlay {
    position: fixed; inset: 0; z-index: 9998; pointer-events: none;
    background-image: url('/textures/noise.png');
    background-repeat: repeat;
    background-size: 128px 128px;
    opacity: 0.025;  /* dark */
    mix-blend-mode: overlay;
}
[data-theme="light"] .noise-overlay { opacity: 0.015; }
/* PNG texture — no per-frame GPU cost unlike SVG filter */
```

### 9.5 Card Top Glow Line
```css
.card-glow::before {
    content: '';
    position: absolute; top: -1px;
    left: 20%; right: 20%; height: 1.5px;
    background: linear-gradient(90deg, var(--blue), var(--violet));
    opacity: 0;
    transition: opacity 0.3s var(--ease);
}
.card-glow:hover::before { opacity: 1; }
```

### 9.6 Icon Color System
```css
.accent-blue   { background: var(--blue-s);   color: var(--blue);   }
.accent-violet { background: var(--violet-s); color: var(--violet); }
.accent-cyan   { background: var(--cyan-s);   color: var(--cyan);   }
/* Icon container: 48px square, border-radius: 14px */
```

---

## 10. Accessibility & Performance

### 10.1 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
    [data-rv] {
        opacity: 1 !important;
        transform: none !important;
        clip-path: none !important;
    }
    /* 3D scene: frozen morphing, slow rotation only */
    /* Custom cursor: disabled */
    /* Lenis: disabled, native scroll */
    /* Page transitions: instant */
    /* Marquee: stopped */
}
```

### 10.2 Accessibility Checklist
```
- focus-visible: 2px solid var(--blue), offset 2px on all interactive elements
- Keyboard nav: Tab, Enter, Escape (mobile menu)
- Images: alt text on every <img>
- Color contrast: WCAG AA on both themes
- Screen reader: aria-labels on icon-only buttons, aria-hidden on decorative elements
- 3D canvas: aria-hidden="true" (purely decorative)
- Skip to content: visually hidden link, visible on focus
```

### 10.3 Performance Budget
```
First load JS:       < 200KB (3D code-split via next/dynamic ssr: false)
3D chunk:            ~400KB (loaded async, separate chunk)
3D frame budget:     < 16ms (60fps)
LCP:                 < 2.5s (hero text first, 3D loads behind preloader)
CLS:                 < 0.1
FID:                 < 100ms
Images:              WebP/AVIF via next/image, lazy loaded
Fonts:               next/font/google (preloaded, no layout shift)
```

### 10.4 Mobile Optimizations
```
3D objects:          40% fewer (12→5 floaters)
Geometry:            lower subdivision (5→4 blob, 32→24 sphere)
Post-processing:     completely disabled
Custom cursor:       return null (not rendered)
Side nav dots:       hidden below 1100px
Lenis:               reduced touch sensitivity
Staggered grid:      disabled below 640px (single column)
TiltCard:            disabled (no mouse on touch)
Noise overlay:       opacity 0.025 → 0.015
```

---

## 11. Spacing System

```
--mw:                     1280px
Container padding:        clamp(20px, 5vw, 56px)
Section padding (y):      clamp(80px, 12vw, 140px)
Card padding:             clamp(24px, 4vw, 40px)
Card border-radius:       20px (cards), 14px (small), 50-60px (pills/nav)
Grid gap:                 clamp(12px, 2vw, 20px)
Nav element gap:          8-16px
```

---

## 12. Breakpoints

| Breakpoint | ცვლილებები                                           |
|------------|-----------------------------------------------------|
| < 640px    | 1 column grids, smaller 3D, 5 floaters, no stagger  |
| 640px      | 2 col service/portfolio grid                         |
| 768px      | About/Contact 2 col, footer 4-col grid               |
| 1024px     | 3 col service grid, horizontal process timeline      |
| 1060px     | Full desktop nav (all links + CTA visible)           |
| 1100px     | Side navigation dots visible (home only)             |

---

## 13. საკვანძო დიზაინ პრინციპები (Summary)

1. **Multi-page persistence** — 3D Canvas, Cursor, Nav, Scroll, Theme providers არასდროს remount-დება
2. **Route-aware 3D** — Canvas ერთია, config route-ით იცვლება smooth lerp-ით
3. **Deep space aesthetic** — ფონი #06060b (not pure black), ტექსტი #eaeaff (cool white)
4. **GPU shader morphing** — blob deformation vertex shader-ით, არა CPU loop-ით
5. **3 accent colors** — Blue (primary), Violet (secondary), Cyan (tertiary)
6. **Gradient text** — ბრენდის/accent სიტყვები ყოველთვის gradient (blue→violet)
7. **Clip-path reveals** — 4 ვარიანტი: fade, clip, mask, scale
8. **GSAP + Framer Motion** — GSAP: scroll-triggered, timelines. Framer Motion: page transitions, layout
9. **Lenis smooth scroll** — global, GSAP-თან synchronized, route change-ზე reset
10. **3D tilt cards** — portfolio mouse-tracking tilt + radial glow
11. **Monospace accents** — JetBrains Mono tech labels, section eyebrows
12. **Noise overlay (PNG)** — subtle static texture, no runtime GPU cost
13. **Post-processing** — Bloom + Vignette + ChromaticAberration (desktop dark only)
14. **Performance-first mobile** — reduced 3D, no post-processing, disabled effects
15. **Reusable components** — RevealOnScroll, Card, Button, SectionTitle — any page, any context

---

*Sitely "DIMENSION" Design System v2 — Multi-Page Architecture. ყველა ფერი, ანიმაცია, 3D, Provider system, კომპონენტების არქიტექტურა და page specifications — Next.js App Router + React Three Fiber.*
