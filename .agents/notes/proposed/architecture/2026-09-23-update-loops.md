# Agent Note: Package, skill, and UI update loops

Status: proposed

Depends on [shell sidecar and launcher](./2026-09-23-shell-sidecar-and-launcher.md). Skill-in-shell and K≡S are decided here. Full Settings npm-update UI may lag; local tarball install proves the pack → install → run path.

## Problem

Without one picture of version lines, agents and pack scripts disagree on what a “release” moves: launcher binary, shell npm, skill copy on disk, and the UI kit the iframe actually runs.

## Decision

### Version lines

| Line | Meaning |
| --- | --- |
| **L** | Shell **launcher** (Tauri first). Rare. |
| **S** | `@mohou/shell` npm version. Daily hot-update unit. |
| **K** | Writing skill `SKILL.md` `version`. **Always equals S.** |
| **U** | `@mohou/ui` (and the rest of shell’s dependency tree). Moves when S’s lock says so. |
| **B** | `~/.mini-app/runtime` user data. Survives updates. |

### Skill lives in the shell package

- Source of truth in the monorepo remains `skills/mohou-mini-app/` (gen:skill, check:skill).
- Release/pack **copies** that tree into `packages/shell/skill/mohou-mini-app/` and packs it with `@mohou/shell`.
- There is **no** separate `@mohou/author-skill` npm package.
- `bootHost` resolves author skill source from the shell package (`skill/mohou-mini-app` next to package root). Monorepo dev may fall back to repo `skills/mohou-mini-app` when the copy is absent.
- **K is set from S by script** (`scripts/sync/skill-into-shell.mjs`). `check:skill` fails if `SKILL.md` version ≠ `@mohou/shell` version. Shipping shell always ships a skill whose version string matches that shell.

### Package update loop (product)

1. Publish/pack `@mohou/shell@S` (deps rewritten from `workspace:` to version range) plus the other workspace tarballs.
2. Install prefix installs those tarballs (registry or **local file tarballs**).
3. Launcher (or `run` script) starts shell **sidecar** from that prefix and opens the loopback origin.
4. Future Settings: check registry for S → package-manager update in the prefix → restart sidecar. New **L** only when launcher code changes.

### Skill copy loop (agents)

1. **K_source** = skill tree inside the installed shell package.
2. Panel “install/update writing skill” copies K_source → assistant `skills/mohou-mini-app`.
3. `updateAvailable` when K_source > K_dest (semver compare on SKILL.md). After S upgrades, user updates skill copies so agents match the new tools/kit story.

### UI kit vs skill vs vendor

- **U** changes in-repo → `pnpm gen:skill` → K content updates → S bump (K string follows S) → pack shell with new skill copy.
- Host **vendor** (`sdk.js` etc.) is built under the host package directory when missing at Host start. Replacing the whole `@mohou/host` install directory drops old vendor; the next start rebuilds against the ui then on disk. Monorepo-only ui edits without replacing host may leave a stale vendor until delete/rebuild — dev concern, not the tarball replace path.
- Agent skill text tracks U via gen:skill on the release train; runtime kit tracks U via host’s dependency + vendor build.

### Local distribution proof

`pnpm dist:local` packs workspace tarballs into `artifacts/npm/`, installs them into `artifacts/local-app/prefix` from **file:** tarballs only for `@mohou/*` (public deps still come from the registry), copies the window binary, and writes `artifacts/local-app/run`. The run script starts shell via `node --import tsx` because Node refuses `--experimental-strip-types` under `node_modules`. Proved: installed shell resolves skill from `…/shell/skill/mohou-mini-app`, Host boots, `/api/about` and `/api/author-skill` answer with skill version === shell version.

## Alternatives considered

- **Separate author-skill npm package.** Lost for product simplicity; shell is the update unit and must not drift from skill source.
- **K independent of S (e.g. 1.0.11 vs shell 1.0.0).** Lost: two knobs; “shell released ⇒ skill new” requires matching strings and one sync script.
- **Publish-time only vendor, never start build.** Optional later; not required for consistency when host directory is replaced on install.

## Consequences

- Bump `@mohou/shell` version ⇒ run skill sync before check/pack.
- `packages/shell/skill/` is generated; do not hand-edit; gitignore the copy if the repo keeps `skills/` as source.
- Local app install must not rely on monorepo `skills/` path at runtime.
