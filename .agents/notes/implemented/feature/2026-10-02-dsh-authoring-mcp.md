# Agent Note: the authoring MCP installs into DSH

Status: implemented

## Problem

DSH reads MCP servers as YAML plugin entries in the active profile's patch layer, not as the `mcpServers` JSON the other assistant rows write. `~/.dsh/profiles/<profile>/cordis.patch.yml` is reapplied after every profile rebuild, so it is the one file a product may own there. Without a row, an author had to paste the connection by hand.

## Decision

The authoring-MCP table carries DSH: `file` is `<DSH_PROFILE_DIR>/cordis.patch.yml`, falling back to `~/.dsh/profiles/<DSH_PROFILE|web>` when this host does not run under DSH; `detectDir` is that profile directory; `format` is `dsh`. The format is merged as **text**, never re-serialised, which is why it departs from the JSON formats: the block sits between `# >>> mohou:mini-app` and `# <<< mohou:mini-app`, so hand-written YAML (`!!js` tags included) survives byte for byte, a reinstall replaces the block instead of duplicating it, and status is a substring check. The entry sets `serverName: mini-app` — DSH registers its tools as `mcp__mini-app__<tool>` — with `transport: streamable-http`, the live url and bearer token, and `failOnStartupError: false` so a stale port or token cannot stop the harness from booting.

## Alternatives considered

- Parse the patch file as YAML, merge, and serialise. Lost because the user's layer carries `!!js` tags and a round trip would rewrite what DSH, not this product, owns.
- Write a `mcpServers` file beside the profile. Lost because nothing reads it: DSH activates plugins from its own config layers.
- Point the row at `~/.dsh/cordis.patch.yml`. Lost because the patch layer is per profile.
- Insert into the profile's generated `cordis.yml`. Lost because the next profile rebuild overwrites it.

## Consequences

- DSH picks the entry up on its next start. The install writes a file; it does not reload a running harness.
- `DSH_PROFILE_DIR` is in the environment only when this product runs under DSH. A standalone host falls back to the profile name's default path, and the row shows as missing-home when that directory is absent.
- The panel reports `updateAvailable` when the token or port changed, so an older install is refreshed rather than duplicated.
