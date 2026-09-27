# Agent Note: Panel page find

Status: proposed

Post-1.0. Do not implement in the 1.0 cut.

## Problem

The Mohou window has no browser-style find-in-page. CodeEditor has its own Mod-f. Everywhere else, Mod-f does nothing useful. Users expect whole-page search over the visible panel and the current app iframe.

## Proposal

Ship a **panel-level find bar** after 1.0:

- Mod-f / Ctrl-f opens the bar when CodeEditor (or another editor that already owns find) is not handling the event.
- Search the panel document and the **currently visible** same-origin iframe only. Skip hidden app stages.
- Build `Range` lists without rewriting React DOM. Prefer CSS Custom Highlight API; scroll the current match into view.
- Debounce query input. Next/previous only advances the current index.
- Panel locale labels for the bar.
- No Tauri IPC. The page stays without shell IPC.

Product home when written: [Page find](../../../docs/product/panel/find.md).

## Alternatives considered

- Native WKWebView / WebView2 find via Rust and IPC. Cross-platform, fights “no Tauri IPC on the page,” and still needs a JS bar for match UI. Deferred with the whole feature.
- Rely on the embedder’s default Mod-f. WKWebView/WebView2 do not give a consistent browser find bar. Rejected as the product answer.
- Per-app find only. Does not cover gallery, settings, or storage chrome. Rejected as the shell-level answer.
- Search every mounted iframe including hidden tabs. Cost grows with open tabs; matches the user cannot see. Rejected for a first ship.

## Acceptance criteria

- On a typical library or app page, typing in the bar updates matches without a visible stall; next/previous feels immediate.
- Hidden app iframes are not searched.
- Focus inside CodeMirror still opens editor find, not the panel bar.
- en and zh-CN labels exist for the bar.
- No Tauri command or `withGlobalTauri` is required.

## Risks

- CSS Highlight support varies by OS webview version; need a small fallback path.
- Very large DOM or many text nodes can still hitch on the first scan if debounce is too aggressive to remove.
- Virtualized lists and canvas text remain out of scope for page find, same as browsers for those surfaces.
