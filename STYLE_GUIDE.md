# 꿈해몽 UI Style Guide

> Covers the homepage design system. All values are production-confirmed. Last updated: 2026-03-14.

---

## Color Palette

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| Midnight | `#050a14` | `bg-midnight` / `text-midnight` | Page background, header bg |
| Gold | `#d4af37` | `bg-gold` / `text-gold` / `border-gold` | Accent, hover states, badges |
| Indigo Deep | `#0a0a23` | `bg-indigo-deep` | Footer background |
| White overlay | — | `bg-white/[0.03]` | Card resting state |
| White overlay hover | — | `bg-white/[0.07]` | Card hover state |
| Body text | — | `text-slate-200` | Primary text on dark bg |
| Secondary text | — | `text-slate-300` | Nav links, subtitles |
| Muted text | — | `text-slate-400` / `text-slate-500` | Excerpts, captions |

> Custom colors are defined via `@theme` in `src/app/globals.css` and available as Tailwind utility classes.

### Selection
```css
::selection { background: #d4af37; color: #050a14; }
```

---

## Typography

### Font Families
| Role | Family | CSS var |
|------|--------|---------|
| Headings / brand | Nanum Myeongjo | `var(--font-serif)` |
| Body / UI | Pretendard | system default via `globals.css` |

Apply serif via inline style: `style={{ fontFamily: "var(--font-serif)" }}`

### 명조체 Usage Rule

**명조체 is for editorial headings only** — elements that structure the reading experience. The test: *"Is this a heading the reader navigates content by?"*

| ✅ Use serif | ❌ Do NOT use serif |
|-------------|-------------------|
| Brand logo (header) | Body paragraphs |
| Page H1 (hero tagline, article title) | Section eyebrow labels (e.g. "Trending Interpretation") |
| Section H2 (major content divisions) | UI labels: badges, pills, nav links, buttons |
| Article H3 (body content, variations) | Captions, excerpts, card text |
| | Footer headings and body |
| | TOC item links |

**Why**: 명조체 carries cultural weight and editorial authority. Overusing it dilutes both effects. Reserve it for structural headings — everything else reads better in the clean, modern Pretendard.

### Type Scale

| Element | Mobile | Desktop | Weight |
|---------|--------|---------|--------|
| Hero H1 | `text-4xl` | `text-6xl` / `text-7xl` (lg) | `font-bold` |
| Hero subtitle | `text-lg` | `text-xl` | `font-light` |
| Section label (eyebrow) | `text-xs` | `text-xs` | `font-bold uppercase tracking-widest` |
| Section H2 | `text-3xl` | `text-3xl` | `font-bold` |
| Card title | `text-sm` | `text-base` | `font-semibold` |
| Card excerpt | `text-xs` | `text-sm` | normal |
| Card badge | `text-[9px]` | `text-[10px]` | `font-bold uppercase tracking-wider` |
| Footer heading | `text-xs` | `text-xs` | `font-bold uppercase tracking-widest` |
| Footer body | `text-sm` | `text-sm` | normal |
| Footer disclaimer | `text-[10px]` | `text-[10px]` | `font-light italic` |

---

## Layout

### Breakpoints (Tailwind defaults)
| Prefix | Min-width |
|--------|-----------|
| `md` | 768px |
| `lg` | 1024px |

### Max Widths
| Section | Max width |
|---------|-----------|
| Header inner | `max-w-7xl` |
| Hero content | `max-w-4xl` |
| Trending section | `max-w-2xl` |
| Footer inner | `max-w-7xl` |

---

## Header

```
fixed top-0 w-full z-50
bg-midnight/80 backdrop-blur-md
border-b border-white/5
height: h-20
```

| Element | Spec |
|---------|------|
| Brand logo | Serif, `text-2xl font-bold tracking-widest text-white` |
| Brand subtitle | `text-[10px] opacity-60 uppercase` — "Kkumhaemong" |
| Nav (desktop only) | `hidden md:flex gap-8` — `text-sm font-medium text-slate-300 hover:text-gold` |
| Nav (mobile) | Hidden; accessed via hamburger menu |
| Hamburger button | `md:hidden`, 3-line / X icon, `hover:bg-white/10 rounded-full p-2` |
| Mobile dropdown | `bg-midnight/95 backdrop-blur-md border-t border-white/5 px-6 py-4` |
| Language toggle | `rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-gold hover:text-gold` — shows `한국어 · English` |
| Theme toggle | Simple moon/sun icon button, `p-2 rounded-full hover:bg-white/10` |

---

## Hero Section

```
h-screen w-full
relative overflow-hidden
-mt-20  (offsets the fixed header's pt-20 on <main>)
flex flex-col items-center justify-center
```

### Background Image
- File: `public/images/home/hero_05.png`
- Recommended resolution: **1920×1080px, 16:9**
- Next.js: `fill priority quality={90} sizes="100vw" className="object-cover"`
- Overlay: `.hero-gradient` — `linear-gradient(to bottom, rgba(5,10,20,0.4), rgba(5,10,20,0.9))`

### Content block
```
relative z-10
text-center px-4 max-w-4xl
(no animation)
```

### Hero H1
```
text-4xl md:text-6xl lg:text-7xl
font-bold leading-tight text-white
whitespace-pre-line   ← enables \n line break in translation
font-serif
```
- KO: `"당신의 꿈,\n그 너머의 이야기"`
- EN: `"Your Dream,\nBeyond the Veil"`

### Hero Subtitle
```
text-lg md:text-xl font-light text-slate-300 mb-12 tracking-wide
```
- KO: `"전통과 현대가 만나는 한국형 꿈해몽 전문 공간"`

### Search Bar
```
relative w-full max-w-2xl mx-auto
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Input font | `text-sm` | `text-base` |
| Placeholder | Short: `"어떤 꿈을 꾸셨나요? (예: 호랑이, 뱀...)"` | Full: `"어젯밤 어떤 꿈을 꾸셨나요? (예: 흰 호랑이, 금반지...)"` |
| Input style | `bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-5 pl-8 pr-16 text-white placeholder-white/40` | Same + `px-8` |
| Focus ring | `focus:ring-2 focus:ring-gold/50 focus:border-gold` | Same |
| Search icon | `absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gold hover:text-white` | Same |

> Two `<input>` elements are rendered — `md:hidden` for mobile (short placeholder), `hidden md:block` for desktop (full placeholder) — sharing the same `query` state.

### Category Chips
```
flex flex-wrap justify-center gap-3 text-sm
```
Each chip:
```
px-6 py-2 rounded-full
border border-white/10 bg-white/5
hover:bg-gold hover:text-midnight
transition-all
```

| Slug | KO label | EN label |
|------|----------|----------|
| animals | 동물 | Animals |
| actions | 행동 | Actions |
| pregnancy | 태몽 | Pregnancy |
| money | 재물 | Money |
| death | 죽음 | Death |
| marriage | 사랑 | Love |

> KO locale uses Korean-only text. EN locale uses English.

### Scroll Indicator
```
absolute bottom-10 left-1/2 -translate-x-1/2 opacity-40
w-px h-16 bg-gradient-to-b from-white to-transparent
```

---

## Trending Interpretation Section

```
py-24 bg-midnight
max-w-2xl mx-auto px-6
```

### Section Header
```
mb-12 text-center
```
- Eyebrow: `text-gold text-xs uppercase tracking-widest font-bold` — "Trending Interpretation" (always EN)
- H2: `text-3xl font-bold mt-2 text-white font-serif` — i18n key `home.popularDreams`

### Card List
```
space-y-6
```
Ad slot injected every 6 cards.

---

## Dream Card

```
group flex items-center
gap-3 md:gap-5
p-3 md:p-4
rounded-xl
bg-white/[0.03] border border-white/5
hover:bg-white/[0.07] hover:border-gold/30
transition-all duration-300
```

### Thumbnail
| | Mobile | Desktop |
|--|--------|---------|
| Size | `w-14 h-14` (56px) | `w-20 h-20` (80px) |
| Shape | `rounded-lg` | same |
| Image | `fill`, `quality={85}`, `object-cover`, `placeholder="blur"` | same |
| Hover | `group-hover:scale-110 transition-transform duration-500` | same |

### Badge
| Type | Style |
|------|-------|
| 길몽 (Auspicious) | `bg-green-500/20 text-green-400` |
| 흉몽 (Inauspicious) | `bg-red-500/20 text-red-400` |
| Neutral | Hidden (no badge rendered) |

Badge text: `text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded`

### Title
```
text-sm md:text-base font-semibold
text-white group-hover:text-gold
transition-colors duration-300
leading-snug line-clamp-1
```

### Excerpt
```
text-xs md:text-sm text-slate-500
line-clamp-1
mt-0.5 md:mt-1 leading-relaxed
```

### Arrow Icon
```
w-4 h-4 flex-shrink-0
text-white/20 group-hover:text-gold/60
transition-colors duration-300
```

---

## Ad Slot

```
w-full h-32
bg-white/5 border border-dashed border-white/10
flex items-center justify-center
text-xs text-white/30 tracking-widest uppercase
```
Label: "Sponsored Content"

---

## View All CTA

```
inline-block px-8 py-3
border border-white/20
text-sm tracking-widest
hover:bg-white hover:text-midnight
transition-all duration-300
```
No border-radius (sharp rectangle, matches reference).

---

## Footer

```
bg-indigo-deep border-t border-white/5 py-20
max-w-7xl mx-auto px-6
grid md:grid-cols-4 gap-12 mb-16
```

| Column | Content |
|--------|---------|
| Brand (col-span-2) | Serif logo + "Kkumhaemong" + description text |
| Service | Gold heading + links (꿈해몽 백과, 카테고리 탐색) |
| Info | Gold heading + Privacy Policy, Terms of Service |

- Section headings: `text-xs font-bold uppercase tracking-widest text-gold mb-6`
- Links: `text-sm text-slate-400 hover:text-white transition-colors`
- Bottom bar: `pt-8 border-t border-white/5` — copyright `text-[10px] text-slate-600 uppercase tracking-widest`
- Disclaimer: `mt-8 text-center text-[10px] text-slate-700 font-light italic`

---

## Global CSS (`globals.css`)

```css
/* Custom colors via @theme */
--color-midnight: #050a14
--color-gold: #d4af37
--color-indigo-deep: #0a0a23

/* Body */
background: #050a14
color: #e2e8f0
font-family: Pretendard, -apple-system, sans-serif
font-size: 17px
line-height: 1.85

/* Hero gradient utility */
.hero-gradient {
  background: linear-gradient(to bottom, rgba(5,10,20,0.4), rgba(5,10,20,0.9));
}

/* Korean text */
:lang(ko) { word-break: keep-all; overflow-wrap: break-word; }
```

---

## Theme

- **Default**: Dark (always). `dark` class applied to `<html>` on load.
- **Toggle**: Moon/sun icon button in header. Stores preference in `localStorage`.
- Light mode: available via toggle but not the primary design target.
