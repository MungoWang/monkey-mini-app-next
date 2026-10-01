# Structured JSON (`opts.schema`)

When you need an object or an array, pass `schema`. Do not stack "JSON only" lines in the prompt.

| | |
|--|--|
| Entry | `ctx.llm(prompt, { schema })` or `ctx.agent(goal, { schema })` |
| Returns | A string that `JSON.parse` accepts, or a thrown error |
| In the app | `JSON.parse(raw)`, then validate fields yourself |
| It is not | Provider-native JSON mode, and not full schema validation |

`schema` is a plain JSON Schema object (`type` plus `properties` / `items`). Keep the prompt short.

```ts
const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    bullets: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "bullets"],
}

const raw = await ctx.llm("One headline and exactly 3 bullets, in the user's language.", {
  schema: SCHEMA,
})
const digest = JSON.parse(raw)
```

The host strips fences and retries a parse failure on `ctx.llm` (`retryTimes`, default from host policy). `ctx.agent` defaults to one attempt — a turn may have posted a comment. Pass `retryTimes` only when steps are idempotent.

Empty completion: `empty-completion`. Exhausted retries: `retry-exhausted`. Cancel: `cancelled`. Match `code`.

Full RSS + schema: `templates/radar/`.
