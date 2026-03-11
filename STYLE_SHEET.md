# UI Style Sheet — 꿈해몽

## Tech Stack

| Layer | Package | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| i18n | next-intl | ^4.8.3 |
| Runtime | React / React DOM | 19.2.3 |
| Markdown | react-markdown | ^10.1.0 |
| Deployment | @opennextjs/cloudflare | ^1.17.1 |
| React Compiler | babel-plugin-react-compiler | 1.0.0 |

---

## Color System — "Deep Night" (Eye-Comfort, Dark Only)

Avoids the pure-white-on-pure-black halation trap. Text is constrained to softer gray tones.
Semantic colors (emerald/rose) are soft enough not to vibrate against the dark canvas.

| Layer (Z-Axis Depth) | Tailwind | Hex / Opacity | Role |
|---|---|---|---|
| Base Canvas | `bg-gray-950` | `#030712` | Deepest background. Not `#000`. |
| Surface Level 1 | `bg-gray-900` | `#111827` | Article container, card backgrounds. |
| Surface Level 2 | `bg-white/[0.03]` | `rgba(255,255,255,0.03)` | Glassmorphism inputs, TOC, nested cards. |
| Borders | `border-white/10` | `rgba(255,255,255,0.1)` | Subtle dividers. |
| Body Text (Base) | `text-gray-300` | `#d1d5db` | All long-form reading. Core eye-comfort choice. |
| Primary Text (High) | `text-gray-100` | `#f3f4f6` | H1, H2, active UI. Never pure white. |
| Muted Text (Low) | `text-gray-500` | `#6b7280` | Meta, footer, captions. |
| Auspicious (길몽) | `text-emerald-400` | `#34d399` | Soft green. Pair with `bg-emerald-400/10`. |
| Inauspicious (흉몽) | `text-rose-400` | `#fb7185` | Rose, not red — softer for extended reading. |

---

## Typography

- **Font**: Pretendard (9 weights, CDN via jsdelivr) — applied globally
- **Body**: `font-size: 17px`, `line-height: 1.8` (1.92 was too loose for line tracking)
- **Body tracking**: `tracking-[-0.01em]` on paragraphs
- **Korean**: `word-break: keep-all`, `overflow-wrap: break-word` via `:lang(ko)`
- **Font smoothing**: `-webkit-font-smoothing: antialiased` globally

### Text Hierarchy (Z-Axis Depth)

| Level | Classes | Notes |
|---|---|---|
| H1 (title) | `text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight text-balance mb-6` | `text-balance` prevents orphan words in Korean |
| Intro paragraph | `text-lg sm:text-[19px] text-gray-200 font-medium leading-[1.8]` + `border-b border-white/10` | Brighter + larger than body; bottom border creates break |
| H2 (section) | `text-2xl font-semibold text-gray-100 tracking-tight mt-16 mb-6` | `mt-16` is intentional — signals topic shift |
| H3 (sub-section) | `text-xl font-medium mt-10 mb-4` | Uses semantic colors (emerald/rose/gray-100) |
| Body `p` | `text-[17px] text-gray-300 leading-[1.8] tracking-[-0.01em] mb-6 last:mb-0` | Core reading comfort |
| Muted / meta | `text-gray-500` | Footer, captions, TOC label |
| Blockquote | `border-l-[3px] border-gray-600 bg-gradient-to-r from-white/[0.04] to-transparent py-4 px-5 text-gray-400 rounded-r-lg my-8` | Gradient fade mimics depth |

---

## Layout Structure

```
<html lang={locale}>
  <body class="min-h-screen bg-gray-950 text-gray-300">
    <Header>                    ← sticky top, z-50, h-14, max-w-3xl, bg-gray-950/95
      Logo | Nav links | LanguageToggle
    </Header>
    <main class="flex-1">
      {page content}
    </main>
    <Footer>                    ← border-t border-white/10, max-w-3xl
    </Footer>
  </body>
```

All content constrained to `max-w-3xl` (48rem) centered.

---

## Page Components

### Homepage (`/[locale]/page.tsx`)
- Vertically centered hero with search form (`min-h-[70vh]`)
- Input: glassmorphism (`bg-white/5`, `border-white/20`)
- Submit button: white with dark text

### Dream Article Page (`/[locale]/dream/[slug]/page.tsx`)
Article container: `mx-auto max-w-3xl px-4 py-10 bg-gray-900 sm:rounded-2xl sm:my-6`

| Component | Key Styles |
|---|---|
| `ReadingProgress` | Fixed top bar, 3px, `bg-white` fill, z-60 |
| `DreamHero` | Hero image (`aspect-square` → `aspect-video` on sm+), H1 `text-gray-100`, intro `text-gray-200 font-medium`, bottom `border-white/10` |
| `TableOfContents` | `rounded-xl border border-white/10 bg-white/[0.03]`, links `text-gray-400 hover:text-white` |
| `DreamSection` | H2 `text-2xl` with semantic color, `mt-16`, body via MarkdownBody |
| `DreamVariations` | H2 `text-gray-100`, items with `border-l-[2.5px] border-white/20`, H3 `text-gray-100` |
| `culturalContext` | H2 `text-gray-100`, body via MarkdownBody |
| `westernContext` | H2 `text-gray-100`, body via MarkdownBody, conditional |
| `DreamFAQ` | Accordion, `divide-y divide-white/10`, question `text-gray-200`, answer `text-gray-400` |
| `conclusion` | `italic text-gray-500 leading-[1.8]`, `border-t border-white/10` |
| `RelatedDreams` | Grid, cards `border-white/10 bg-white/[0.03]`, text `text-gray-300 group-hover:text-gray-100` |

### MarkdownBody
Renders LLM markdown. Custom components:
- `p` → `text-gray-300 leading-[1.8] tracking-[-0.01em]`
- `strong` → `font-semibold text-gray-200`
- `ul/ol` → `text-gray-300 leading-[1.8]`
- `h3` → `text-xl font-medium text-gray-100`
- `blockquote` → gradient + `text-gray-400`
