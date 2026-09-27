# Agent Note: One event stream for open tabs

Status: implemented

## Problem

Each open tab held its own event stream. The browser allows about six connections to one host. At four or five tabs those sockets were full, so the next document never loaded and the tab stayed on "Opening…". Closing a tab freed a socket.

## Decision

App events travel on the host stream the panel already holds. The shell keeps a short tail and delivers it when that iframe appears. A hidden iframe does not take pointer events.

## Alternatives considered

- HTTP/2 on the loopback listener. Browsers do not speak cleartext HTTP/2, and a certificate is a new policy. Rejected.
- Open the per-tab stream only after `load`. The steady state is still one socket per tab, so the next document still stalls. Rejected.

## Consequences

`GET /api/app/:appId/events` remains for a single subscriber. The panel does not call it for an open tab.
