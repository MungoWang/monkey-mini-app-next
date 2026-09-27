---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Install dependencies

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host.
- Input: `mini_app_install({ appId, packages?: [{ name, version? }], remove?: string[], commit? })`. An empty request reads current dependencies.
- Output: `{ ok, packages, lockfile }` or `{ ok: false, error }`. The tool writes `package.json` (`private: true`, dependencies only) and a lockfile, then installs with scripts ignored and dev dependencies omitted. The resolved version is recorded so the next reload does not float. `node_modules` is rebuilt and is not history. The lockfile is history.
- The denylist rejects `react`, `react-dom`, `lodash`, `lodash-es`, `axios`, `typescript`, `motion`, `framer-motion`, and any platform-scoped package. Package names are plain npm names: no paths, no URLs. A version is a plain range with no spaces or shell metacharacters.
- Backend load resolves an extra specifier only from that app's `node_modules`. Host modules do not leak in. Deep specifiers are allowed when they resolve there. UI compile still rejects those specifiers.
- Failure: denylist, bad name, missing `npm`, installer timeout, or network failure returns `ok: false` and leaves the last successful lockfile in force. The timeout duration is host policy and is not locked. A backend import of an uninstalled name fails load and names this tool. A UI import of an installed name fails compile.
- Non-goals: making every app an npm project; a host catalog of domain libraries; running package scripts; a first-run approval modal; installing UI libraries into the iframe.

## Implementation


Role: provider. `installApp` is the only writer of `package.json`. File tools refuse that file and `package-lock.json`. `npm install --ignore-scripts --omit=dev` runs with names in the manifest, not on the command line. Windows uses `npm.cmd`. A failed install restores the previous manifest and lockfile. The timeout is host policy. Plan: [implementation.md](../implementation.md).
