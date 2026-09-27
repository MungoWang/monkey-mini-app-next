---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Credentials

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Shell supplies the provider. Host binds `get` onto `ctx`. The author tool lists names.
- Input: one or more source specs, passed to `createCredentials`. The read port has no target. `builtin-json` is the built-in kind, and its target is `credentials.json` in the mini-app home. One name, one object: `{ description, secret }`. The name is the object key. An API source would be another kind with its own target. It is not a file path on the port.
- Output: `mini_app_credential_list` returns `{ credentials: [{ name, description }] }`. `ctx.credentials.get(name)` returns that secret, or `undefined` when the name is absent. A missing file is an empty list.
- Failure: an empty name emits `credential-invalid`. A present file that is not the object shape emits `credential-unreadable` and is not rewritten. The same name in two sources emits `credential-duplicate`. No source wins silently. The message does not include the secret.
- Non-goals: a panel editor; `put` or `delete` on the provider Host sees; a list on `ctx`; a platform catalog of account types; a second copy of the same account under another name. The built-in file source owns both the read and the write. Shell does not grow a second credential API.

## Implementation

Role: provider. The read port is `CredentialProvider`. `createCredentials` takes the source specs and opens them. Each kind carries its own target. `builtin-json` reads its file on each call. `emptyCredentials` is no source. Shell passes the built-in file spec from `homeCredentialsPath`. The author tool is the only list. Plan: [implementation.md](../implementation.md).
