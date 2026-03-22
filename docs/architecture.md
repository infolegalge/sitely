# Sitely — Project Architecture & Coding Standards

## Strict Rules

1. **NO inline styles** — ყველა სტილი CSS Modules-ში (`.module.css`)
2. **page.tsx = მხოლოდ კომპონენტები** — არანაირი styles, არანაირი ლოგიკა, მხოლოდ imports + JSX
3. **NO props data-sharing** — კომპონენტებს შორის მონაცემები მხოლოდ Context API-თ
4. **ყველა კომპონენტს თავისი ფოლდერი** — `ComponentName/ComponentName.tsx` + `ComponentName.module.css`
5. **კომპონენტები კატეგორიების მიხედვით** — სუბფოლდერებით განცალკევებული

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # CSS ცვლადები, @theme, base styles, utilities
│   ├── layout.tsx                # Root layout — providers + layout კომპონენტები
│   ├── page.tsx                  # Home — მხოლოდ <HeroSection /> და სხვა sections
│   │
│   ├── services/
│   │   └── page.tsx              # მხოლოდ კომპონენტები
│   ├── portfolio/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   └── api/                      # API routes
│       └── contact/
│           └── route.ts
│
├── components/
│   ├── layout/                   # საიტის ჩარჩო (Navbar, Footer, Preloader...)
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   └── Navbar.module.css
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   └── Footer.module.css
│   │   ├── Preloader/
│   │   │   ├── Preloader.tsx
│   │   │   └── Preloader.module.css
│   │   ├── CustomCursor/
│   │   │   ├── CustomCursor.tsx
│   │   │   └── CustomCursor.module.css
│   │   ├── ScrollProgress/
│   │   │   ├── ScrollProgress.tsx
│   │   │   └── ScrollProgress.module.css
│   │   ├── ScrollToTop/
│   │   │   ├── ScrollToTop.tsx
│   │   │   └── ScrollToTop.module.css
│   │   ├── NoiseOverlay/
│   │   │   ├── NoiseOverlay.tsx
│   │   │   └── NoiseOverlay.module.css
│   │   └── PageTransitionWrapper/
│   │       ├── PageTransitionWrapper.tsx
│   │       └── PageTransitionWrapper.module.css
│   │
│   ├── sections/                 # გვერდის სექციები (page-specific)
│   │   ├── home/
│   │   │   ├── HeroSection/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   └── HeroSection.module.css
│   │   │   ├── ServicesPreview/
│   │   │   │   ├── ServicesPreview.tsx
│   │   │   │   └── ServicesPreview.module.css
│   │   │   ├── PortfolioPreview/
│   │   │   │   ├── PortfolioPreview.tsx
│   │   │   │   └── PortfolioPreview.module.css
│   │   │   └── Testimonials/
│   │   │       ├── Testimonials.tsx
│   │   │       └── Testimonials.module.css
│   │   ├── services/
│   │   │   ├── ServicesList/
│   │   │   └── ServiceDetail/
│   │   ├── portfolio/
│   │   │   ├── PortfolioGrid/
│   │   │   └── ProjectDetail/
│   │   ├── about/
│   │   │   ├── TeamSection/
│   │   │   └── MissionSection/
│   │   └── contact/
│   │       └── ContactForm/
│   │
│   ├── ui/                       # Reusable UI კომპონენტები
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── Card.module.css
│   │   ├── SectionLabel/
│   │   │   ├── SectionLabel.tsx
│   │   │   └── SectionLabel.module.css
│   │   ├── SectionTitle/
│   │   │   ├── SectionTitle.tsx
│   │   │   └── SectionTitle.module.css
│   │   └── GradientText/
│   │       ├── GradientText.tsx
│   │       └── GradientText.module.css
│   │
│   ├── animations/               # ანიმაციის wrapper კომპონენტები
│   │   ├── RevealOnScroll/
│   │   │   ├── RevealOnScroll.tsx
│   │   │   └── RevealOnScroll.module.css
│   │   ├── StaggerChildren/
│   │   │   ├── StaggerChildren.tsx
│   │   │   └── StaggerChildren.module.css
│   │   └── TextScramble/
│   │       ├── TextScramble.tsx
│   │       └── TextScramble.module.css
│   │
│   ├── three/                    # 3D / R3F კომპონენტები
│   │   ├── scenes/
│   │   │   ├── GlobalScene/
│   │   │   │   └── GlobalScene.tsx
│   │   │   └── SceneCanvas/
│   │   │       └── SceneCanvas.tsx
│   │   └── objects/
│   │       ├── MorphingBlob/
│   │       │   └── MorphingBlob.tsx
│   │       ├── WireframeShapes/
│   │       │   └── WireframeShapes.tsx
│   │       └── FloatingParticles/
│   │           └── FloatingParticles.tsx
│   │
│   └── providers/                # Context Providers
│       ├── ThemeProvider.tsx
│       ├── LenisProvider.tsx
│       └── SceneProvider.tsx
│
├── contexts/                     # Context definitions (separate from providers)
│   ├── ThemeContext.ts
│   ├── LenisContext.ts
│   └── SceneContext.ts
│
├── hooks/                        # Custom hooks
│   ├── useTheme.ts
│   ├── useLenis.ts
│   ├── useSceneConfig.ts
│   ├── useScrollProgress.ts
│   └── useIsMobile.ts
│
├── lib/                          # Utilities & constants
│   ├── utils.ts
│   └── constants.ts
│
└── types/                        # TypeScript types
    └── index.ts
```

---

## Component Pattern

ყოველი კომპონენტი = ფოლდერი:

```
ComponentName/
├── ComponentName.tsx             # კომპონენტის ლოგიკა
└── ComponentName.module.css      # კომპონენტის სტილები
```

### ComponentName.tsx — Template

```tsx
"use client";

import { useTheme } from "@/hooks/useTheme";
import s from "./ComponentName.module.css";

export default function ComponentName() {
  const { theme } = useTheme();          // Context API — NOT props

  return (
    <div className={s.wrapper}>
      {/* ... */}
    </div>
  );
}
```

### ComponentName.module.css — Template

```css
.wrapper {
  /* styles here */
}
```

---

## page.tsx Pattern

```tsx
import HeroSection from "@/components/sections/home/HeroSection/HeroSection";
import ServicesPreview from "@/components/sections/home/ServicesPreview/ServicesPreview";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesPreview />
    </>
  );
}
```

- **არანაირი** `style={{}}` ❌
- **არანაირი** CSS import ❌
- **არანაირი** ლოგიკა ❌
- **მხოლოდ** კომპონენტის imports + JSX ✅

---

## Data Flow

```
Context Provider (layout.tsx)
    ↓ Context API
Component A ← useContext() → reads/writes shared state
Component B ← useContext() → reads/writes shared state
```

- **არანაირი props** მონაცემების გასაზიარებლად ❌
- **მხოლოდ Context API** + custom hooks (`useTheme`, `useLenis`, etc.) ✅
- Provider-ები `layout.tsx`-ში, hook-ები კომპონენტებში

---

## CSS Rules

| Rule | Example |
|------|---------|
| CSS ცვლადები | `var(--blue)`, `var(--tx)` |
| CSS Modules | `import s from "./X.module.css"` |
| Global utilities | `globals.css`-ში: `.grad-text`, `.grad-primary` |
| Responsive | CSS Modules-ში `@media` queries |
| Dynamic values (JS-driven) | `style={{ width }}` — მხოლოდ JS-ით ცვალებადი მნიშვნელობები |
| Hover/focus/pseudo | CSS Modules-ში — `.button:hover {}` |
| Data-driven states | `data-*` attributes — `[data-active="true"] {}` |

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component folders | PascalCase | `HeroSection/` |
| CSS Module files | PascalCase.module.css | `HeroSection.module.css` |
| CSS class names | kebab-case | `.cta-primary` |
| Hooks | camelCase with `use` prefix | `useTheme.ts` |
| Context files | PascalCase + Context | `ThemeContext.ts` |
| Page files | lowercase | `page.tsx` |
| Types | PascalCase | `SceneConfig` |
| Constants | SCREAMING_SNAKE | `NAV_ITEMS` |
