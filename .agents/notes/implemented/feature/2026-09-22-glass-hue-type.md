# Agent Note: Glass hue type and geometric stack

Status: implemented

## Problem

A dense glass gallery used one hero type recipe on every card: 24px bold titles, grey gradient marks, and `space-between` air in the middle. A few cards looked like a magazine. Many cards looked like a wall of posters.

## Decision

Glass keeps `extra.featured` (span 2, larger mark). Regular and featured cards use two type recipes. Marks take a hue gradient from `--h`. The face is a geometric system stack: Avenir Next and PingFang SC on Mac, Bahnschrift and DengXian on Windows, then Segoe UI and Microsoft YaHei UI. The library chrome uses that stack only while `data-card="glass"`. Other card styles stay on the panel sans.

## Alternatives considered

- One quiet type scale for every glass card. Featured would only be wider. Rejected; featured should still read as a poster.
- Drop weight only, keep 24px titles. Still too loud in a dense grid. Rejected.
- System UI, Optima/Candara, or New York/Georgia for the Latin. User picked the geometric stack after prototypes.

## Consequences

PingFang tops out at Semibold, so Chinese titles at 700 map there. DengXian is present on Windows with a Chinese language pack; YaHei is the fallback. Mixed titles use two faces in one line (`Fuze` Latin, `密钥管理` CJK). Featured span 2 and row stretch are unchanged.
