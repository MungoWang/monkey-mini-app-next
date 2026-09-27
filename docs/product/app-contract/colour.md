---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Colour the app consumes

Layer: [App contract](README.md). Index: [features.md](../features.md). Read [style.md](style.md) first.

- Owner: App contract for what the app writes. Host and Panel resolve which palette paints.
- Input: token variables in the UI, or an optional `theme.css` in the app directory when the style itself depends on a hue. A plain records, table, or settings app ships neither a theme file nor hex.
- Output: the iframe paints with the effective palette. Resolution order: an explicit user pin wins; with no pin, `theme.css` wins; with neither, the host palette wins. `__global__` means the host palette even when `theme.css` exists. `__local__` means the app file. Deleting the pin restores the app default, which is a different action from following the host.
- `theme.css` declares the tokens directly: `background`, `foreground`, `card`, `card-foreground`, `border`, `muted`, `muted-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `ring`, `input`, `radius`, `shadow`. Both `:root[data-mode="light"]` and `:root[data-mode="dark"]` are present. `background`, `foreground`, and `primary` are required in both. A header comment `/* name: ... */` supplies the picker label. There is no short-name mapping.
- Failure: a file missing a required token is ignored and listed as ignored. The app paints with the next palette in the resolution order. A short name such as `--bg` does not count. The file is not partially applied.
- Non-goals: a theme editor; a per-app theme file that is not `theme.css`; hex in `ui.tsx` as a supported path.

Host copies the declared tokens into the first HTML response. A later theme message copies those same names onto the document. A token that is absent is omitted. No second name is invented.

## Implementation


Role: definition of the theme file contract. `themeTokens` is the one name list. `resolveFirstPaint` chooses the source and copies those names. `renderRunnerDocument` bakes that CSS, clears boot art before mount, and injects the error boundary. A missing optional token is omitted. No fallback colour is invented. A file that fails `resolve*` is ignored. `GET /app/:appId` serves that HTML. Plan: [implementation.md](../implementation.md).
