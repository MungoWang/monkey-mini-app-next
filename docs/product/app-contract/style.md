---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Style, in one pass

Layer: [App contract](README.md). Index: [features.md](../features.md). Detail: [colour](colour.md), [themes](../host/themes.md).

Read this page first. Do not invent a second name for a token.

## 1. Names

One list, `themeTokens`. The theme file uses these names as CSS variables. No second spelling of a token. Tailwind's own compiler is the class language: `bg-background` is Tailwind's name for `var(--background)`, connected by Tailwind's `@theme`, not by a host parser.

`background` `foreground` `card` `card-foreground` `border` `muted` `muted-foreground` `primary` `primary-foreground` `secondary` `secondary-foreground` `accent` `accent-foreground` `destructive` `destructive-foreground` `ring` `input` `radius` `shadow`

Required in both modes: `background`, `foreground`, `primary`.

## 2. Who writes the values

A theme file sets values for those names. It does not rename them.

```css
:root[data-mode="light"] { --background: white; --foreground: black; --primary: blue; }
:root[data-mode="dark"]  { --background: black; --foreground: white; --primary: blue; }
```

`--bg` does not count. A missing required name ignores the whole file. A missing optional name is omitted. Nothing fills it from another file.

## 3. Slots on the page

Two style slots. The upper slot wins on the same property. The theme read order is not a third slot. It only fills the lower slot.

```text
page, top wins
┌─────────────────────────────────────────┐
│ 2  in-app styles                        │
│    the author's own CSS in the app      │
│    can paint one element                │
│    cannot replace --card                │
├─────────────────────────────────────────┤
│ 1  theme styles                         │
│    CSS variables on the document        │
│    --background  --card  --primary ...  │
│    appearance chooses light or dark     │
└─────────────────────────────────────────┘
```

The app sheet is whatever Tailwind emits for that app, plus the author's `ui.css` appended unchanged. Host does not read `className` itself. `@tailwindcss/oxide` does. Tailwind `@source` scans the app directory and the kit package, because kit classes live in `/mma/sdk.js` rather than in the app. Do not add a second class map.

## 4. What fills theme styles

One file replaces the whole variable set. Files are not merged. A bad file is skipped.

```text
follow-host pin
  → host palette file
  → app theme.css is not read

palette-id pin
  → ~/.mini-app/themes/theme-<id>.css
  → else shipped theme-<id>.css
  → else continue below

no pin, or app-file pin
  → app theme.css
  → else host palette file
  → else no values
```

Inside a palette lookup, the user file replaces the shipped file with the same id.

Appearance is not another file. `light` and `dark` set `data-mode`. `system` follows the OS. Authors do not set `data-mode`.

## 5. What the author writes

Author CSS does not enter the list above. It does not replace `--card`.

| Author writes | Effect |
| --- | --- |
| `background: var(--card)` | uses the winning value of `--card` |
| `.panel { padding: 16px }` | layout only |
| a second `--card` in `ui.tsx` | not a theme |

## One example

App `theme.css` says `--card: snow`. The pin is follow-host. The host palette is `slate`.

The winner is `slate`. `snow` is not used. An author rule `background: var(--card)` paints `slate`'s `--card`. `.panel { padding: 16px }` does not change that.
