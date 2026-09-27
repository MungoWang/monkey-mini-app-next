# Agent Note: macOS and Windows

Status: implemented

## Problem

Implementations were written against the machine that happened to be open. That machine is macOS. The product also runs on Windows. A later pass then finds POSIX signals, permission bits, and a bash-only shell.

## Decision

Every implementation targets macOS and Windows in the same change. A feature that cannot names the limit on its page. Shell command strings are not translated between bash and PowerShell. POSIX permission bits are not treated as a Windows access lock.

## Alternatives considered

- macOS first, Windows later. Lost because the missing path is invisible until a Windows run, and the constitution would not force the second path.
- One shell command translated across platforms. Lost because bash and PowerShell are different languages. Each call keeps its own executable.

## Consequences

`ctx.bash` and `ctx.pwsh` stay separate. Windows process-tree stop uses `taskkill /T`. A Win32 Job object is not required by this rule. Storage owner-only mode is POSIX; Windows keeps the user-profile ACL.
