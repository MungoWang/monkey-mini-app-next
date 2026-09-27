# Agent Note: Muted status mark

Status: implemented

## Problem

The gallery status mark was one foreground dot with a glow, on every host state. The count read as a bare number.

## Decision

The mark keeps a soft same-color shadow. A ready host is a dull green, a failed list is a dull ochre, and an unreachable host is a dull mix of the destructive color. Empty and search-miss stay with the ready mark. The count reads as a full phrase, `共 {n} 个小程序` in zh-CN.

## Alternatives considered

- A bright green and a bright red. Those pull the eye off the library. Rejected.
- No shadow. The plain disc reads flatter than the earlier mark. Rejected.
- A different phrase for an empty library. The host is still up. Rejected.

## Consequences

The mark is only on the gallery tab. An app tab still has no status row.
