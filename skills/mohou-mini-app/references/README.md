# How this tree is read

Start at [../SKILL.md](../SKILL.md). Then open one file. Do not read this directory as a list.

## Guide

Hand-written. One need, one file.

| Need | File |
|---|---|
| Confirm, options, red flags | [guide/choices.md](guide/choices.md) |
| A short `kv()` list | [guide/skeleton.md](guide/skeleton.md) |
| `ctx` members | [guide/ctx.md](guide/ctx.md) |
| Model JSON in a string | [guide/llm-json.md](guide/llm-json.md) |
| External HTTP, CLI, MCP, install | [guide/tools.md](guide/tools.md) |
| Files, imports, reload codes | [guide/loader.md](guide/loader.md) |
| Smoke tests | [guide/test.md](guide/test.md) |
| Something failed | [guide/troubleshoot.md](guide/troubleshoot.md) |
| Tailwind | [guide/styling.md](guide/styling.md) |
| Icons | [guide/icons.md](guide/icons.md) |
| History | [guide/history.md](guide/history.md) |
| What the rendered view shows | [guide/eval.md](guide/eval.md) |

## Generated UI material

Open the index, then one page. Do not scan the folder.

| Need | File |
|---|---|
| Which component | [catalog.md](catalog.md) |
| Props and parts | [contracts/](contracts/) — one component |
| A runnable widget | [examples/](examples/) — the catalog names the file |
| A named look | [looks/index.md](looks/index.md) |
| Colour tokens | [theme.md](theme.md) |

Facades are [../templates/](../templates/). Open one directory after the loop for that region is chosen.

When authoring tools fail, run `node ../bin/diagnose.mjs` from this skill tree.
