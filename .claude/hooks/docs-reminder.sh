#!/usr/bin/env bash
# Stop hook: nudge Claude to keep CLAUDE.md and README.md in step with the code.
#
# Fires only when the working tree has source changes and neither doc file has
# been touched. Nags at most once per distinct set of changed files, so a
# session that decides no doc update is needed can stop on its next attempt
# instead of looping.
#
# Exits 0 silently in every case where it has nothing to say.

set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

# Column 3 onward is the path; this survives filenames containing spaces.
changed=$(git status --porcelain 2>/dev/null | cut -c4-) || exit 0
[ -z "$changed" ] && exit 0

source_changed=$(printf '%s\n' "$changed" | grep -E '^(src/|worker/|index\.html|vite\.config\.js|package\.json|\.github/workflows/)' || true)
docs_changed=$(printf '%s\n' "$changed" | grep -E '^(CLAUDE\.md|README\.md)' || true)

# Nothing to say: no source edits, or the docs are already being updated.
[ -z "$source_changed" ] && exit 0
[ -n "$docs_changed" ] && exit 0

# Nag once per distinct change set.
fingerprint=$(printf '%s' "$source_changed" | shasum | cut -d' ' -f1)
marker="${TMPDIR:-/tmp}/claude-docs-reminder-$(printf '%s' "$root" | shasum | cut -c1-12)"
[ -f "$marker" ] && [ "$(cat "$marker" 2>/dev/null)" = "$fingerprint" ] && exit 0
printf '%s' "$fingerprint" > "$marker"

files=$(printf '%s\n' "$source_changed" | head -12 | sed 's/^/  - /')

reason="You changed source files without touching CLAUDE.md or README.md:

$files

Decide whether either needs updating, then finish:

  - README.md — architecture, setup, commands, deployment, key rotation, or what
    the data provider does and does not supply.
  - CLAUDE.md — a standing constraint, a decision worth not relitigating, or a
    trap that cost you time. Not a changelog: only what a fresh session could
    not work out by reading the code.

If neither applies, say so in one line and stop. This will not ask again for
this set of changes."

python3 - "$reason" <<'PY'
import json, sys
print(json.dumps({"decision": "block", "reason": sys.argv[1]}))
PY
