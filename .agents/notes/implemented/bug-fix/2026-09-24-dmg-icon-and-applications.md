# Agent Note: DMG icon and Applications alias

Status: implemented

## Problem

`pnpm dist:app` wrote a UDZO image from `Mohou.app` alone. Finder showed the generic application placeholder: `Info.plist` had no `CFBundleIconFile`, and `Contents/Resources` had no `.icns`. The volume also had no Applications drop target, so the README step "drag to Applications" had nothing to drag onto.

## Decision

The bundle copies `packages/launcher/tauri/icons/icon.icns` to `Contents/Resources/AppIcon.icns` and sets `CFBundleIconFile` to `AppIcon`. The disk image is an HFS+ read-write volume: `ditto` the `.app`, then a Finder alias to `/Applications`, then convert to UDZO. The Applications alias is created on the mounted volume, not in a `-srcfolder` tree.

## Alternatives considered

- `hdiutil create -srcfolder` of a staging directory that already contains an Applications symlink. `hdiutil` follows that symlink and copies `/Applications` into the image. Rejected.
- Depend on `create-dmg` or `appdmg`. They encode the same mount-then-alias sequence. A brew or npm tool is not required for two items and a window layout. Rejected.
- Skip the Finder window layout. The alias would still appear, but icon view size and positions would follow Finder defaults. The layout script is best-effort: a failure still ships the `.app` and the alias.

## Consequences

A later `pnpm dist:app` produces a volume that opens with `Mohou.app` and Applications. The zip path uses the same `.app`, so it also carries the icon. Unsigned Gatekeeper behavior is unchanged.
