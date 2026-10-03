# Agent Note: A reload failure keeps the esbuild text

Status: implemented

## Problem

`mini_app_reload` reported every bundle failure as `ui-invalid` with the sentence `ui failed to bundle`. The reason esbuild gave — for example `No matching export in "shared/mcp.ts" for import "MCP_PRESETS"` — reached only the host stderr, so the authoring agent saw a code and a sentence that named no cause. Finding one missing export took an esbuild run by hand plus a bisect of the import. The backend path hid syntax and export failures behind `backend failed to load` the same way.

`stopped.message` is set only by the resolve plugin, which names the rule it enforced (`ui cannot import left-pad`). Every other build failure arrives as an esbuild rejection whose `errors` array the catch block never read.

## Decision

`bundleUi` and `loadBackend` fall back to `buildFailureText(error)` before the generic sentence. It reads the esbuild messages, renders each one as `file:line:column: text`, and keeps the first five with an `and N more` line. A resolve plugin message still wins, because it names the rule that failed. A failure that carries no message keeps the old sentence.

## Alternatives considered

- Keep the generic sentence and let the author run esbuild by hand: that esbuild run is the bug. The tool result is the only channel the authoring agent reads; host stderr is not.
- Use `error.message` verbatim: it repeats esbuild's `Build failed with N errors:` framing, which duplicates the failure code, and its layout is esbuild's to change.
- Report a fixed sentence per esbuild error class: the class table would need an entry for every esbuild diagnostic, and the text still would not name the file, line, or symbol.

## Consequences

One reload failure message can now span six lines. The code stays the match key; the text stays for a person. `FAILURE_LINES_MAX` caps the text, so a large failure stays readable, and the count of hidden messages is still stated.
