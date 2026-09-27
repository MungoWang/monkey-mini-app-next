# Agent Note: Toolbar refresh reaches the frame

Status: implemented

## Problem

The settings control was a circle with four ticks, not a gear. The refresh control on an app tab called reload, and Host published `app:reload`, but the panel document dropped that event. The iframe never refetched, so the click looked dead. On the gallery the same click refetched a list that had not changed, with no visible motion.

## Decision

The toolbar uses the same gear, refresh, and grid icons as the other toolbar controls. Refresh spins while the request is in flight. The panel document posts `app:reload` and `app:eval` to the iframe titled with that app id.

## Alternatives considered

- Reload the iframe from the click handler without the host event. Rejected: other reload publishers, including a tree change, would still not reach the frame.
- Leave the gallery click silent when the list is unchanged. Rejected: the control then looks broken.

## Consequences

A refresh on an app tab loads that document again. A refresh on the gallery refetches the list and the icon moves. Closing a tab still drops that frame.
