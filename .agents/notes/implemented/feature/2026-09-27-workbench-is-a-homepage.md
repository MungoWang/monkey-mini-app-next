# Agent Note: A workbench is a homepage

Status: implemented

## Problem

The confirm gate described a workbench as a queue plus a rail of other apps, and told the agent that shared-screen regions must stay an ordinary app. That made `kind: "workbench"` a fixed layout. The sample aside was read as the type.

## Decision

A workbench is a homepage the author designs. `kind: "workbench"` puts that app in the panel home slot. The page shows what this person wants to see first, and it arranges other apps and their entry points in any layout, including one that uses no kit component. `listApps` and `openApp` supply the apps and the open. They do not require a rail, a grid, or the sample. The sample queue and rail are one sketch. The app keeps every ordinary capability. `openApp` still asks the panel to add a tab.

## Alternatives considered

- Keep the rail as the only taught layout. Lost: the author cannot design the homepage they asked for, and the kit becomes the layout again.
- Drop `kind` and treat every multi-section app as a workbench. Lost: the panel home slot and `ctx.workbench` exist only for this kind.

## Consequences

[Workbench](../../../docs/product/panel/workbench.md), [Write loop](../../../docs/product/author-skill/write-loop.md), and [Facades and looks](../../../docs/product/author-skill/facades.md) use this definition. The skill sample remains one homepage, labeled as a sketch.
