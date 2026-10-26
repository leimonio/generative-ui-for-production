#!/usr/bin/env bash
# Type-checks every snippet against the example named on its first line
# ("// Source: <example>/..."), from inside that example, so imports and the
# "@/" alias resolve exactly as the example's own code does.
# Run from anywhere: talk-snippets/check.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(dirname "$here")"
fail=0
for f in "$here"/*.ts "$here"/*.tsx; do
  [ -e "$f" ] || continue
  ex="$(head -1 "$f" | sed -n 's#^// Source: \([^/ ]*\)/.*#\1#p')"
  name="$(basename "$f")"
  if [ -z "$ex" ] || [ ! -d "$root/$ex" ]; then echo "skip  $name (no example source)"; continue; fi
  # Every example the line names must exist (d1-ds-swap names two).
  for other in $(head -1 "$f" | grep -o '[0-9][0-9]b\?-[a-z-]*/' | tr -d /); do
    [ -d "$root/$other" ] || { echo "FAIL  $name: no example $other"; fail=1; }
  done
  # Checked from inside the example so imports resolve exactly as its own code does.
  tmp="$root/$ex/.snippet-check"
  mkdir -p "$tmp" && cp "$f" "$tmp/$name"
  printf '{ "extends": "../tsconfig.json", "compilerOptions": { "noEmit": true, "incremental": false }, "include": ["%s", "../next-env.d.ts"] }\n' "$name" > "$tmp/tsconfig.json"
  if (cd "$root/$ex" && npx tsc -p .snippet-check); then echo "ok    $name ($ex)"; else echo "FAIL  $name ($ex)"; fail=1; fi
  rm -rf "$tmp"
done
exit $fail
