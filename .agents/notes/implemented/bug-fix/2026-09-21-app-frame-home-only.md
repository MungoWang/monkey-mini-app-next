# Agent Note: App frame only on the home slot

Status: implemented

## Problem

Every app tab reused the home window chrome: 16px inset, a 24px radius, a border, and a shadow. That chrome is the home workbench card. On an opened app it only left a gap under the tab strip.

## Decision

`mma-app-frame` owns the inset, radius, border, and shadow. The gallery tab applies it to the builtin library and to a workbench iframe. An opened app tab does not.

## Alternatives considered

- A Settings appearance toggle named for the mini-app window border. The split is which tab is showing, not a preference. A toggle would put the gap back on app tabs. Rejected.
- Leave the radius on `.mma-frame` and only drop the stage padding. The app would still read as a floating card. Rejected.

## Consequences

The builtin library scrolls inside the frame. Its fill is translucent, so the host gradient shows through. A workbench iframe keeps the solid frame fill, because the iframe covers it. Switching the home to a workbench keeps the same inset.
