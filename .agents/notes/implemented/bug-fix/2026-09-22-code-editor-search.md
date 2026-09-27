# Agent Note: CodeEditor find

Status: implemented

## Problem

`CodeEditor` had no in-editor find. Authors expected Monaco-style search for config and scripts.

## Decision

Load `@codemirror/search` with the other CDN modules. Mod-f / Ctrl-f opens the panel. Next, previous, match case, and regexp stay on that package. The panel uses theme tokens. Button and field labels go through `codeEditor` kit phrases (`EditorState.phrases`) in `en` and `zh-CN`.

## Alternatives considered

- A custom React find bar. Duplicates what CodeMirror already ships. Rejected.
- Switch the engine to Monaco. The kit already owns CodeMirror via CDN. Rejected.

## Consequences

When the CDN fails, the plain textarea has no find panel. Browser find still works on that text.
