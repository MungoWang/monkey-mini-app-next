# Agent Note: Expected build failures stay off stderr

Status: implemented

## Problem

`loadBackend` and `bundleUi` call esbuild. A rejected import is thrown as `import-forbidden`, `import-escape`, `ui-invalid`, or `backend-invalid`. esbuild also writes the same failure to stderr from its service process. The negative tests already expect the thrown code, so the `✘ [ERROR]` lines in a green run look like a failure.

## Decision

Both functions take an optional `logLevel`. The only accepted value is `'silent'`. Tests that already expect the build to fail pass it. Every other caller omits it, and esbuild prints unexpected failures as before. The thrown error is unchanged.

## Alternatives considered

- Set `logLevel: 'silent'` on every build. Lost because an unexpected syntax error or missing entry would also stop printing.
- Run the negative cases in a child process and read stderr. Lost because the assertion would depend on esbuild's format, or the captured text would be discarded.
- Pass a logger into esbuild. Lost because the JavaScript API has no logger. The service inherits stderr.

## Consequences

A new negative build test passes `'silent'` or it prints. Product calls do not pass it. Silencing does not replace the thrown code.
