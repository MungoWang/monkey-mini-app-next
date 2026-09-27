# Agent Note: Theme menu shows the current choice

Status: implemented

## Problem

The toolbar theme menu listed appearance and palettes with no pressed row, hashed dots instead of the theme color, and no way to pin the open app. The original menu showed the scope, the selected pill, a color chip, and a system badge.

## Decision

Global scope writes host appearance and palette. The pressed appearance is the stored theme. The pressed palette row is the stored palette, with that file's light primary as the dot and a system badge. App scope, shown only while an app tab is open, writes the pin. Follow global is the first palette row, not a separate control. The app file is another row only when `theme.css` parsed. A named palette is the rest. Saving a pin reloads that app's frame.

## Alternatives considered

- Keep the hash-colored dots. Rejected: they do not match the theme the row selects.
- Put app pins on the global list. Rejected: a pin is per app, and the product hides the app file outside app scope.

## Consequences

The palette list carries `swatch`. A panel that ignores it still has `id` and `name`. Choosing a palette writes the policy or the pin and replaces the paint style in place. It does not reload the panel or the app. A source change and the toolbar refresh still refetch the app document.
