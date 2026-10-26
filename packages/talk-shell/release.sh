#!/usr/bin/env bash
# Packs the shell and (re)installs it into every example. Each example gets a
# real copy in its own node_modules, not a symlink, so it resolves its own
# react/next and keeps the per-example version isolation. Restart any running
# dev server afterwards.
set -euo pipefail
cd "$(dirname "$0")"

rm -f talk-shell.tgz
mv "$(npm pack --silent)" talk-shell.tgz

for app in ../../0*/; do
  [ -f "$app/package.json" ] || continue
  echo "→ $(basename "$app")"
  (cd "$app" && npm install --no-audit --no-fund --silent ../packages/talk-shell/talk-shell.tgz)
done
