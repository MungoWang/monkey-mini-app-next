# Styling

Colour is tokens. Tailwind compiles the app sheet. Host does not parse `className`.

## Tokens

One list: [theme.md](../theme.md). Do not invent a second class for a token. Do not put hex in `ui.tsx`. The host sets `data-mode`. Do not set it.

```tsx
<div className="bg-card text-card-foreground border-border">
  <span className="text-muted-foreground">…</span>
</div>
```

`var(--token)` only where a utility cannot reach: SVG fill, a chart colour, or `style`. Token translucency is `color-mix`, not `bg-card/60` as a promise:

```tsx
<div style={{ backgroundColor: "color-mix(in oklch, var(--card) 60%, transparent)" }} />
```

`Illu*` already follow `--primary`.

## Class names are literals

Tailwind reads source text. A composed name produces no CSS and no error.

```tsx
// ✗
<span className={`bg-${tone}-100`} />

// ✓
const map = { ok: "bg-emerald-100 text-emerald-700", bad: "bg-rose-100 text-rose-700" } as const
<span className={map[tone]} />
```

The author's `ui.css`, when present, is appended unchanged. It cannot replace `--card`.

## Layout

No `Stack` / `Text` / `Box`. Use Tailwind on elements or `className`. The panel width is user-dragged — size with explicit spans (`w-full`, `min-w-0`, `grid-cols-2`), not `md:` as a stand-in for panel width. Fill the iframe (`h-full`, `min-h-0`, `overflow-auto`).

## Theme files

Write `theme.css` in the app dir only when the look depends on a hue. Same token names, both `:root[data-mode]` blocks. A plain CRUD app does not ship it. `theme.json` is a panel pin — do not author it.

A named host palette is `~/.mini-app/themes/theme-<id>.css`. `mini_app_*` cannot write that path. Skeleton: [theme.md](../theme.md).

## Animation

`import { motion, AnimatePresence } from "motion/react"` — UI only. Hover on one property: Tailwind `transition`. Staggered entrance: kit `<Reveal delay={i * 60}>` (honours reduced motion). Exit / layout: `motion`.

Custom `@keyframes` need a name this app owns. Reserved names (`spin`, `pulse`, `enter`, `exit`, …) are a reload **notice**, not a failure. Do not `mini_app_install` `motion`.

## After reload

`caches.appCss` is `dropped`. `caches.views` is `refetch` or `not-open`. Compile green is not a painted view — `mini_app_view_eval`. Do not curl the host.
