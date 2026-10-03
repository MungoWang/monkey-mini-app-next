# Agent Note: A view dump survives an SVG class name

Status: implemented

## Problem

A view query that walked into an inline SVG came back with `error: element.className.trim is not a function` and a partial outline. `describe` and `selectorOf` read `element.className` as a string, and an `SVGElement` answers that property with `SVGAnimatedString`. Icons are inline SVG in this kit, so any app with one lost the outline from that node down. The dump still returned a result, which is why the failure looked like a truncated answer rather than a thrown query.

## Decision

`BridgeElement.className` is `string | { baseVal: string }`, and `classNames` reads `baseVal` when the value is not a string. No other reader of `className` exists in the bridge.

## Alternatives considered

- Read the `class` attribute instead of the property. The bridge element interface carries no `getAttribute`, and the runner emits the bridge as text into a document it does not own; the property pair is the smaller surface.
- Guard with `String(element.className)`. On an `SVGAnimatedString` that yields `[object SVGAnimatedString]`, which would put a wrong class into the outline and into the selector.

## Consequences

The outline and `mma.selector` treat an SVG class list like any other. A host that answers `className` with a third shape still breaks the dump; the union names the two shapes the DOM defines.
