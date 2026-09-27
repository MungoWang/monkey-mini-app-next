# Agent Note: Author file bytes

Status: implemented

## Problem

Authoring tools carry source bytes inside one `tools/call` argument. MCP delivers that argument only after the whole JSON object is assembled. A large `ui.tsx` fails before Host writes a byte. `direct-write` then restores any file the agent wrote itself, so the tool argument is the only path.

## Decision

Host tells the agent where the app directory is. The agent owns create, read, update, and delete of source files. Host does not transport those bytes on MCP.

1. `mini_app_register` takes manifest fields only. The result includes the absolute app directory and the absolute paths of the files the app still needs.
2. The agent writes those paths with its own file tools.
3. The agent calls `mini_app_reload`. Success commits the dirty tree. Failure does not commit.
4. The agent exercises the loaded app with host tools.

`mini_app_write`, `mini_app_edit`, and `mini_app_delete` stay on `GET /api/tools` and `POST /api/tools/invoke`. MCP `tools/list` and `tools/call` omit them. `mini_app_install` remains the only writer of `package.json`.

## Alternatives considered

- Append or chunk flags on `mini_app_write`. The model still places source bytes in a tool argument. Rejected.
- A host-only streaming schema, with no client that pipes tokens into the stream. The argument is still one JSON value. Rejected.
- Keep `direct-write` and only document the directory path. The guard restores the file, so the path is not writable. Rejected.
- Remove write, edit, and delete from Host. HTTP invoke still needs them. Rejected.

## Consequences

An agent that writes the app directory with its own tools keeps those bytes on the next host tool call. MCP no longer lists a path that ships source in the argument. HTTP invoke still does.
