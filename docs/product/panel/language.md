---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Panel chrome language

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel.
- Input: host locale `zh-CN` or `en`.
- Output: every panel chrome string in both locales. A missing key in development fails the lookup. A missing key in production falls back to the key, not to a hard-coded English sentence in the component.
- Non-goals: translating app content (the app owns its strings); a third locale in this product.

## Implementation


Role: consumer. `panelText` reads the locale dictionary. A missing key fails in development and falls back to the key in production. An unsupported locale fails in both modes. App strings are not translated here. Plan: [implementation.md](../implementation.md).
