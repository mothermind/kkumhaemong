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

## Color System (Dark Theme Only)

All dark. No light mode. The palette is essentially:

| Role | Color |
|---|---|
| Page background (`body`, `layout`) | `bg-gray-900` = `#111827` |
| Header | `bg-gray-900/95` + `backdrop-blur-sm` |
| Primary text | `text-white` |
| Secondary text | `text-gray-200` / `text-gray-400` |
| Muted text | `text-gray-500` / `text-gray-600` |
| Auspicious (길몽) headings | `text-emerald-400` |
| Inauspicious (흉몽) headings | `text-red-400` |
| Neutral headings | `text-gray-300` |
| Borders | `border-white/10` / `border-white/20` |
| Surface overlays | `bg-white/5` / `bg-white/[0.03]` |

---

## Typography

- **Font**: Pretendard (9 weights, CDN via jsdelivr) — applied globally
- **Body**: `font-size: 17px`, `line-height: 1.92`
- **Korean**: `word-break: keep-all`, `overflow-wrap: break-word` via `:lang(ko)`
- **Font smoothing**: `-webkit-font-smoothing: antialiased` globally

---

## Layout Structure

```
<html lang={locale}>
  <body class="min-h-screen bg-gray-900 text-white">
    <Header>                    ← sticky top, z-50, h-14, max-w-3xl
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
Full article layout in `<article class="mx-auto max-w-3xl px-4 py-10">`:

| Component | Description |
|---|---|
| `ReadingProgress` | Fixed top bar, 3px, `bg-white` fill, z-60 |
| `DreamHero` | Hero image (`aspect-square` → `aspect-video` on sm+), H1, intro via MarkdownBody |
| `TableOfContents` | Numbered list inside `rounded-xl border border-white/10 bg-white/[0.03]` |
| `DreamSection` | H2 colored by type (emerald/red/gray), optional image `aspect-[3/2]`, body via MarkdownBody |
| `DreamVariations` | H2 heading, variations as `border-l-[2.5px] border-white/20 pl-5` left-bordered cards |
| `culturalContext` section | H2 + MarkdownBody inline in page |
| `westernContext` section | H2 + MarkdownBody, conditional |
| `DreamFAQ` | Accordion (client component), `divide-y divide-white/10`, +/- toggle |
| `conclusion` section | MarkdownBody in `italic text-gray-500` |
| `RelatedDreams` | 2–3 col grid of linked cards (⚠️ still uses light theme colors — needs dark mode fix) |

### MarkdownBody
Renders LLM markdown. Custom components for: `p`, `strong`, `em`, `ul`, `ol`, `li`, `h3`, `h4`, `blockquote`.

---

## Known Issues

- `RelatedDreams` component still has **light-mode colors** (`border-gray-200`, `text-gray-800`, `bg-gray-100`, `hover:border-indigo-300`, `hover:text-indigo-600`) — these look broken against the dark `bg-gray-900` background and need to be updated.
