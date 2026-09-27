#!/bin/bash
# Local prefix entry. The Tauri binary beside this script is the parent.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
exec "$here/Mohou"
