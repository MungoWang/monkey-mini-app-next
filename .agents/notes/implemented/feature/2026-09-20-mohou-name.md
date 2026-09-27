# Agent Note: The product name is Mohou

Status: implemented

## Problem

The window title was `mini-app`. That is the package category, not a product name. A display name also has to follow the panel locale, and the meaning has to stay where a person can read it.

## Decision

The English name is Mohou. The Chinese name is 墨猴. The panel sets `document.title` from the current locale, and the window copies that title. Before the page loads, the title is Mohou. Settings about shows the name and the meaning in the current locale. [Window and event bridge](../../../docs/product/shell/window.md) owns the wording. The binary stays `mini-app-window`. The packages stay `@mini-app/*`.

Mohou is the small monkey once kept to grind ink. It is small, stays at hand, and serves one task. This product is that set of tools. The user brings the idea. The language model writes the implementation. Mohou supplies the brush, the ink, the paper, the inkstone, the library, and the shelf.

## Alternatives considered

- Shelf, Nest, or Booth. Lost because each is only a container.
- Ink Monkey. Lost because it explains the Chinese name instead of naming the product.
- Famulus. Lost because the user chose not to translate, and Mohou is the English name.

## Consequences

- The build binary stays `mini-app-window`. The packaged file is named Mohou, because macOS uses that file name as the Dock label. A private process-name call crashed the window, so it is not used.
- A locale change is visible after the panel reloads, which settings save already does.
