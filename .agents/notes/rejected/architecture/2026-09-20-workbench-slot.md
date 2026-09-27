# Agent Note: Workbench slot

Status: rejected — superseded by workbench apps with ctx.workbench

Superseded: a workbench is an app with `ctx.workbench`, not a document injected into the panel. [Workbench](../../../docs/product/panel/workbench.md) owns that decision. This note keeps the earlier slot proposal.

## Problem

The gallery body, heat, and recommendation were about to be designed as one screen. A custom home that can host those later needs a slot that does not change when a new source appears. The home also has to fail without taking the tab strip or the host actions with it.

## Proposal

Three pages own the behavior. This note owns the order and the choices that are still open. Nothing here is on a blueprint node.

1. [Heat](../../../docs/product/host/heat.md). `activity.json` in the runtime root stores `{ openCount, lastOpenedAt }` per app. `mini_app_open` updates that entry. The pure fold does not import the slot.
2. Manifest `tags`, then the owner list returns them. [Directory and entries](../../../docs/product/app-contract/directory.md) owns the token rule. [List](../../../docs/product/owner-surface.md#list) returns `tags` when the manifest has them. Heat does not read tags.
3. [Workbench](../../../docs/product/panel/workbench.md). This waits on 1. The first `WorkbenchSources` includes `apps`, `workbenches`, and `heat`. Host fills `apps` and `heat`. When heat is ready, the app list is ordered by open count, descending. The slot fills the workbench list, `sortApps`, and the rest of the props. A document may ignore `heat` and may sort again. Tags, `createdAt`, and `updatedAt` arrive on each app, not as their own sources.
4. Load a document other than the builtin one. This waits on 3. The file format is not chosen, so this step cannot start.

`selectWorkbench` is part of step 3. With only the builtin entry, selecting that id does not remount it.

[Recommendation](../../../docs/product/host/recommendation.md) is deferred. It is not a step.

## Alternatives considered

- A Handlebars document, a narrowed `ui.tsx`, and a full mini-app were all ways to author the body. The slot calls `WorkbenchDocument` either way. The file format was left open so step 1 does not pick one.
- An iframe, matching the app view, and a separate process were both proposed as the failure boundary. The body stays in the panel and an error boundary catches a thrown render. A hang can freeze the panel. That limit was accepted.
- Passing `AppCard` as a component lost to `renderAppCard`. The document calls one method and places the returned node.
- Giving the document only the context lost to giving it the panel clients. The tab strip and the host action buttons still stay outside the body.
- A single score of pin, recency, and open count, with one featured band, was not specific enough to build. Heat keeps the two observed fields and no score.
- A recommendation over heat, tags, and time of day was set aside. The manifest has no type until tags land, and no durable open log exists, so the judgment would have been invented.
- Building the slot before the heat value existed was set aside. The first document would then have been written against a source map that still had to grow.

## Acceptance criteria

- A thrown render of a non-builtin document shows the builtin body and a modal with that document id and the message. The tab strip and the host action buttons stay mounted.
- A `failed` apps source does not swap the document.
- A `failed` workbenches source does not swap the mounted document.
- `renderAppCard` paints one card and calls `onOpen`. It does not call `client.open`.
- Heat tests call `heat` with samples and do not import the panel.
- The slot is not implemented before heat. The first `WorkbenchSources` includes `heat` and does not include a recommendation field.
- A manifest without `tags` still loads. A bad tag is `manifest-invalid`. The owner list omits `tags` when the manifest omits them.

## Risks

- The error boundary does not stop a hung render. The panel freezes with the tab strip.
- A document holds the panel clients, so it can delete an app or open settings. The chrome buttons are not a permission boundary.
- `activity.json` is one file for every app. A second kind of usage is another field on that document, not a new file.
- Step 4 has no file format. A loader built now would be thrown away when the format is chosen.
