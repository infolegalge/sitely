# Tech Galaxy — დეტალური იმპლემენტაციის გეგმა

## 1. ხედვა

კოსმიური გალაქტიკა, სადაც პროგრამული ენები/ტექნოლოგიები პლანეტების სახით
ტრიალებენ ორბიტებზე. ბექგრაუნდი ყველა გვერდისთვის ერთი და იგივეა —
პერსისტენტული, route-ის ცვლილებისას არ იშლება.

### ფერების პალიტრა (Carina Nebula ინსპირაცია)

**Dark Mode — კოსმიური ნებულა:**
- ღრმა შავი ფონი: `#06060b`
- ნებულის ლურჯი: `#1a3a8a` → `#2563eb`
- ნებულის იისფერი: `#6b21a8` → `#a855f7`
- ნებულის ვარდისფერი: `#9f1239` → `#f472b6`
- ნებულის ციანი: `#0e7490` → `#22d3ee`
- ცხელი ვარსკვლავები: `#fef3c7` (თბილი თეთრი)
- ცივი ვარსკვლავები: `#e0e7ff` (ცისფერი-თეთრი)
- ნარინჯისფერი glow: `#c2410c` → `#fb923c` (ნებულის კიდეები)

**Light Mode — "Cosmic Blueprint":**
- ღია ფონი: `#f0f2f8`
- ნებულის ლურჯი: `#93c5fd` (პასტელური)
- ნებულის იისფერი: `#c4b5fd` (ნაზი)
- ნებულის ვარდისფერი: `#fda4af` (ღია)
- ორბიტები: `rgba(59, 92, 228, 0.15)` (blueprint ხაზები)
- ვარსკვლავები: `#94a3b8` (ვერცხლისფერი dots)
- პლანეტები: matte finish, soft shadows
- Bloom: მინიმალური (0.1)

---

## 2. კომპონენტური არქიტექტურა

```
src/components/three/
├── SceneCanvas.tsx              ← R3F Canvas, layout-ში (fixed, z-index: -1)
│
├── scenes/
│   └── GalaxyScene.tsx          ← ორკესტრატორი: ყველა ობიექტს აერთიანებს
│
├── objects/
│   ├── Starfield.tsx            ← ვარსკვლავების ველი (InstancedMesh)
│   ├── NebulaCloud.tsx          ← კოსმიური ნისლი (shader-based planes)
│   ├── GalacticCore.tsx         ← ცენტრალური "მზე" (Sitely glow orb)
│   ├── TechPlanet.tsx           ← ერთი ტექნო-პლანეტა (reusable)
│   ├── OrbitPath.tsx            ← ორბიტალური ხაზი (Line geometry)
│   ├── HyperspaceEffect.tsx     ← Lightspeed intro ეფექტი
│   └── AsteroidBelt.tsx         ← მცირე ტექნოლოგიების ნაწილაკები
│
├── effects/
│   └── SpacePostProcessing.tsx  ← Bloom + Vignette + optional ChromaticAberration
│
└── hooks/
    ├── useScrollSpeed.ts        ← Lenis scroll velocity → Three.js
    └── useThemeColors.ts        ← CSS variables → Three.js materials
```

---

## 3. იმპლემენტაციის ფაზები

### ფაზა A: ფუნდამენტი (SceneCanvas + Starfield)

**A1: SceneCanvas.tsx**
- R3F `<Canvas>` კომპონენტი
- `position: fixed; inset: 0; z-index: -1` — კონტენტის უკან
- layout.tsx-ში `<Navbar />`-ს გვერდით
- PerspectiveCamera, fov: 60, near: 0.1, far: 2000
- frameloop: "always" (მუდმივი რენდერი)
- dpr: `[1, 1.5]` (performance balance)
- Resize handler

**A2: Starfield.tsx — ვარსკვლავების ველი**
- **რაოდენობა:** 3000 (desktop), 1000 (mobile)
- **InstancedMesh** — ერთი draw call
- **განაწილება:** სფერული, რადიუსი 500-1500
- **ზომა:** 0.3–2.0 (შემთხვევითი)
- **ფერი:** 70% ცისფერ-თეთრი, 20% თბილი-ყვითელი, 10% ცისფერი
- **Twinkle ანიმაცია:** sin(time + offset) — სხვადასხვა ფაზით
- **Scroll parallax:** შორი ვარსკვლავები × 0.02, ახლო × 0.1

**A3: SpacePostProcessing.tsx**
- UnrealBloomPass: strength=0.3, radius=0.8, threshold=0.6
- Vignette: darkness=0.4, offset=0.3
- Dark mode-ში ინტენსიური, Light-ში სუსტი

---

### ფაზა B: ნებულა (კოსმიური ნისლი)

**B1: NebulaCloud.tsx — Carina Nebula სტილის ნისლი**
- **ტექნიკა:** 6-8 PlaneGeometry + Custom ShaderMaterial
- **Shader:** Perlin/Simplex noise × fbm (fractal brownian motion)
- თითოეული plane = ნისლის "ფენა" სხვადასხვა სიღრმეზე
- **ფერები (dark):**
  - Plane 1: ღრმა ლურჯი (#1a3a8a, opacity 0.15)
  - Plane 2: იისფერი (#6b21a8, opacity 0.12)
  - Plane 3: ვარდისფერი (#9f1239, opacity 0.08)
  - Plane 4: ციანი (#0e7490, opacity 0.10)
  - Plane 5-6: ნარინჯისფერი კიდეები (#c2410c, opacity 0.06)
- **ფერები (light):** იგივე hue, saturation: 30%, lightness: +40%
- **ანიმაცია:** ძალიან ნელი drift (0.001 speed), turbulence
- **Scroll:** parallax factor 0.03–0.08 (ფენის სიღრმის მიხედვით)
- **Opacity overall:** dark=1.0, light=0.4

---

### ფაზა C: გალაქტიკის ბირთვი + ორბიტები

**C1: GalacticCore.tsx — ცენტრალური ვარსკვლავი**
- Sphere (radius: 3) + custom emissive shader
- Pulsating glow: sin(time) × 0.2 amplitude
- God rays / volumetric light (sprite-based)
- ფერი: ცხელი თეთრი ცენტრში (#fef3c7) → ლურჯი ბოლოებზე (#2563eb)
- Corona effect: particle ring around core
- **Light mode:** ოქროსფერ-ლურჯი (#3b82f6), გამჭვირვალე glow

**C2: OrbitPath.tsx — ორბიტალური ხაზები**
- **რაოდენობა:** 6 ორბიტა (inner → outer)
- **ტიპი:** EllipseCurve → BufferGeometry → Line
- **Tilt:** თითოეული orbit-ს აქვს სხვადასხვა inclination (10°–35°)
- **ვიზუალი (dark):** rgba(255,255,255, 0.04) — ძლივს ხილვადი
- **ვიზუალი (light):** rgba(59, 92, 228, 0.08) — blueprint სტილი
- **Dashed line:** dash pattern ანიმაცია (flowing effect)

**C3: ორბიტალური რაგიუსები:**
```
Orbit 1 (Inner):    radius=15,  tilt=12°   — Core technologies
Orbit 2:            radius=25,  tilt=18°   — Primary languages
Orbit 3:            radius=38,  tilt=25°   — Backend/Runtime
Orbit 4:            radius=52,  tilt=15°   — Databases
Orbit 5:            radius=70,  tilt=30°   — Cloud/DevOps
Orbit 6 (Outer):    radius=90,  tilt=22°   — Frontend frameworks
Asteroid Belt:      radius=110, scatter=±8  — Tools/misc
```

---

### ფაზა D: ტექნო-პლანეტები

**D1: TechPlanet.tsx — Reusable კომპონენტი**

Props:
```ts
type TechPlanetProps = {
  name: string;           // "React"
  icon: string;           // ლოგოს URL ან SVG path
  color: string;          // ბრენდის ფერი
  size: number;           // 1.0–3.5
  orbitRadius: number;    // ცენტრიდან მანძილი
  orbitTilt: number;      // ორბიტის დახრა (degrees)
  orbitSpeed: number;     // baseline speed (rad/s)
  startAngle: number;     // საწყისი პოზიცია ორბიტაზე
  scrollMultiplier: number; // scroll-ზე სიჩქარის მამრავლი
};
```

**ვიზუალი:**
- სფერო + emissive glow (ბრენდის ფერით)
- ლოგო: decal texture სფეროზე ან billboard sprite
- Atmosphere ring: ნახევარგამჭვირვალე halo
- Trail: მოკლე particle trail ორბიტაზე (comet-like)
- Hover effect (მომავალში): გადიდება + info popup

**D2: პლანეტების სრული სია:**

```
ORBIT 1 — Core (radius: 15, speed: fastest)
├── React          color: #61dafb  size: 3.0
├── Next.js        color: #ffffff  size: 2.8
├── TypeScript     color: #3178c6  size: 2.5
└── JavaScript     color: #f7df1e  size: 2.5

ORBIT 2 — Primary Languages (radius: 25)
├── Python         color: #3776ab  size: 2.2
├── Rust           color: #ce422b  size: 2.0
├── Go             color: #00add8  size: 2.0
├── Java           color: #ed8b00  size: 2.3
└── C#             color: #239120  size: 2.0

ORBIT 3 — Backend/Runtime (radius: 38)
├── Node.js        color: #339933  size: 2.2
├── Deno           color: #ffffff  size: 1.8
├── Django         color: #092e20  size: 1.8
├── Express        color: #ffffff  size: 1.5
└── FastAPI        color: #009688  size: 1.5

ORBIT 4 — Databases (radius: 52)
├── MongoDB        color: #47a248  size: 2.0
├── PostgreSQL     color: #4169e1  size: 2.0
├── Redis          color: #dc382d  size: 1.8
├── Firebase       color: #ffca28  size: 2.0
├── Supabase       color: #3ecf8e  size: 1.8
└── GraphQL        color: #e10098  size: 1.5

ORBIT 5 — Cloud/DevOps (radius: 70)
├── Docker         color: #2496ed  size: 2.0
├── AWS            color: #ff9900  size: 2.2
├── Kubernetes     color: #326ce5  size: 1.8
├── Vercel         color: #ffffff  size: 1.5
├── GitHub         color: #ffffff  size: 2.0
└── Linux          color: #fcc624  size: 1.8

ORBIT 6 — Frontend Frameworks (radius: 90)
├── Vue.js         color: #4fc08d  size: 2.0
├── Angular        color: #dd0031  size: 2.0
├── Svelte         color: #ff3e00  size: 1.8
├── Tailwind       color: #06b6d4  size: 1.8
├── Three.js       color: #ffffff  size: 1.8
└── Framer Motion  color: #0055ff  size: 1.5

ASTEROID BELT (radius: 110, tiny particles)
├── HTML5          color: #e34f26  size: 0.8
├── CSS3           color: #1572b6  size: 0.8
├── Git            color: #f05032  size: 0.8
├── npm            color: #cb3837  size: 0.8
├── Webpack        color: #8dd6f9  size: 0.8
├── Vite           color: #646cff  size: 0.8
├── Sass           color: #cc6699  size: 0.8
├── Jest           color: #c21325  size: 0.8
├── Cypress        color: #17202c  size: 0.8
└── Figma          color: #f24e1e  size: 0.8
```

---

### ფაზა E: Hyperspace Intro ანიმაცია

**E1: HyperspaceEffect.tsx**
- **Timing:** 0–3 წამი (Preloader-ის პარალელურად)
- **ტექნიკა:** იგივე Starfield particles, მაგრამ:
  - z-velocity: 200 → 0 (ანელებს)
  - Star streak: position + velocity vector → stretched billboard
  - Streak length: proportional to velocity
- **Chromatic Aberration:** 0 → 0.02 → 0 (peak at 1.5s)
- **Bloom:** 0.3 → 1.0 → 0.3 (peak at 2.5s, "flash")
- **Camera FOV:** 60 → 90 → 60 (warp effect)

**E2: Big Bang Transition (3–4s)**
- Hyperspace ჩერდება
- White flash (0.3s)
- პლანეტები: center → orbit positions (expo.out, staggered)
- Starfield: streaks → dots (velocity → 0)
- ნებულა: opacity 0 → 1 (fade in)

---

### ფაზა F: სქროლის ინტეგრაცია

**F1: useScrollSpeed.ts — Lenis → Three.js ხიდი**
```ts
// Lenis scroll velocity-ს გარდაქმნის normalized 0–1 სიჩქარედ
// Smoothing: exponential decay (დეცელერაცია)
// Output: { speed: number, progress: number, direction: 1 | -1 }
```

**F2: სქროლის ეფექტები:**

| Scroll % | ორბიტალური სიჩქარე | Camera Position | Camera LookAt |
|----------|---------------------|-----------------|---------------|
| 0%       | baseline × 1.0      | (0, 80, 120)    | (0, 0, 0)     |
| 25%      | baseline × 1.5      | (40, 50, 100)   | (0, 0, 0)     |
| 50%      | baseline × 2.0      | (80, 20, 60)    | (0, 0, 0)     |
| 75%      | baseline × 2.5      | (30, 10, 30)    | (15, 0, 0)    |
| 100%     | baseline × 1.0      | (-20, 100, 150) | (0, 0, 0)     |

- Camera transitions: GSAP ScrollTrigger → smooth interpolation
- During active scroll: +velocity bonus to orbit speed
- ვარსკვლავები: parallax (შორი < ახლო)
- ნებულა: ნელი parallax (0.03-0.08)

**F3: სხვა გვერდების სქროლი:**
- იგივე სისტემა, მაგრამ camera keyframes განსხვავებული
- SceneProvider-ის config-იდან იღებს route-specific camera paths

---

### ფაზა G: Dark/Light Mode Transition

**G1: useThemeColors.ts**
- `getComputedStyle` → CSS variables → Three.js Color objects
- `data-theme` attribute listener → color transition
- Transition duration: 0.8s (GSAP tween on material uniforms)

**G2: Material Transitions:**
- ნებულა opacity: dark(1.0) ↔ light(0.35)
- ვარსკვლავები: dark(white, bright) ↔ light(silver, dim)
- Bloom: dark(0.3) ↔ light(0.1)
- Core glow: dark(intense white-blue) ↔ light(soft gold-blue)
- Planet emissive: dark(high) ↔ light(low, add soft shadow)
- Background: dark(#06060b) ↔ light(#f0f2f8)
- ორბიტები: dark(white, 0.04 alpha) ↔ light(blue, 0.1 alpha)

---

## 4. Performance Budget

| მეტრიკა | Desktop | Mobile |
|----------|---------|--------|
| ვარსკვლავები | 3000 | 1000 |
| ნებულის ფენები | 8 | 4 |
| პლანეტები (სრული) | 40+ | 20 (inner orbits only) |
| Asteroid belt | 10 particles | hidden |
| PostProcessing | Bloom + Vignette | Bloom only (reduced) |
| Target FPS | 60 | 30+ |
| Draw calls | <50 | <25 |
| Texture memory | <20MB | <8MB |

**Optimization ტექნიკები:**
- InstancedMesh ვარსკვლავებისთვის (1 draw call for 3000)
- InstancedMesh asteroid belt-ისთვის
- Frustum culling (Three.js default)
- LOD: შორი პლანეტები = sprite, ახლო = mesh
- Texture atlas: ლოგოები ერთ atlas ტექსტურაში
- `useFrame` throttle: mobile-ზე skip every other frame
- Offscreen detect: tab unfocused → pause rendering
- Adaptive DPR: `dpr={[1, Math.min(devicePixelRatio, 1.5)]}`

---

## 5. იმპლემენტაციის თანმიმდევრობა (Steps)

```
Step 1:  SceneCanvas.tsx → layout.tsx-ში        [ფუნდამენტი]
Step 2:  Starfield.tsx (InstancedMesh + twinkle) [ვიზუალი]
Step 3:  SpacePostProcessing.tsx (Bloom)         [ეფექტები]
Step 4:  NebulaCloud.tsx (shader planes)         [ატმოსფერო]
Step 5:  GalacticCore.tsx (ცენტრი)               [ანქარი]
Step 6:  OrbitPath.tsx (ხაზები)                   [სტრუქტურა]
Step 7:  TechPlanet.tsx (reusable)               [კომპონენტი]
Step 8:  ყველა პლანეტის დამატება                  [კონტენტი]
Step 9:  useScrollSpeed.ts + camera system       [ინტერაქცია]
Step 10: HyperspaceEffect.tsx (intro)            [ანიმაცია]
Step 11: Dark/Light mode transitions             [თემა]
Step 12: Mobile optimization + LOD               [performance]
Step 13: Polish + timing sync with hero          [ფინიში]
```

---

## 6. ფაილების დამოკიდებულებები

```
SceneCanvas
└── GalaxyScene
    ├── Starfield          (standalone)
    ├── NebulaCloud        (standalone, uses useThemeColors)
    ├── GalacticCore       (standalone, uses useThemeColors)
    ├── OrbitPath × 6      (standalone)
    ├── TechPlanet × 40+   (uses OrbitPath data)
    ├── AsteroidBelt       (InstancedMesh, standalone)
    ├── HyperspaceEffect   (uses Starfield data, intro only)
    └── SpacePostProcessing (uses useThemeColors)

Hooks:
├── useScrollSpeed         (← LenisProvider context)
└── useThemeColors         (← ThemeProvider context, CSS vars)
```

---

## 7. რისკები და გამოწვევები

| რისკი | გავლენა | გამოსავალი |
|-------|---------|-----------|
| 40+ პლანეტა = ბევრი draw call | FPS drop | InstancedMesh + LOD |
| ნებულის shader heavy | GPU load | Simplified on mobile, lower res |
| Hyperspace + hero animation timing | Sync issues | Shared timeline ref |
| Light mode-ში კოსმოსი უცნაურად გამოიყურება | Visual coherence | "Blueprint" aesthetic ნაცვლად რეალისტურის |
| ლოგო ტექსტურები loading time | Asset size | Texture atlas + lazy load |
| Scroll jank | UX issue | Lenis smoothing + RAF-based interpolation |
