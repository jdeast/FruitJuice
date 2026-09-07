#!/bin/bash
#
# Put a freshly built FruitJuice jar on the server and restart into it.
#
#     server/deploy-plugin.sh target/FruitJuice-0.5.0.jar
#
# Run from a development machine; it does the copy over ssh. Set DEPLOY_HOST in
# config.sh (an ssh host alias is easiest, so the port and key live in
# ~/.ssh/config rather than here).
#
# The point of doing this in a script rather than by hand is the verification.
# A jar's filename is only what it was named, not what it was built from, so
# this compares checksums after the copy and reads the version the server
# actually enables afterwards. Deploying a jar and being unsure whether the
# running server picked it up is how you end up debugging a bug you already
# fixed.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/config.sh" ]; then
    . "$HERE/config.sh"
else
    . "$HERE/config.example.sh"
fi

DEPLOY_HOST="${DEPLOY_HOST:-}"
JAR="${1:-}"

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { say "ERROR: $*" >&2; exit 1; }

[ -n "$DEPLOY_HOST" ] || die "set DEPLOY_HOST in $HERE/config.sh (an ssh host alias)"
[ -n "$JAR" ] || die "usage: $(basename "$0") <path to FruitJuice-x.y.z.jar>"
[ -f "$JAR" ] || die "no such jar: $JAR"

NAME="$(basename "$JAR")"
REMOTE_LIB="$MC_HOME/plugins"
REMOTE_JAR="$REMOTE_LIB/$NAME"

# ------------------------------------------------------------------ copy -----
say "copying $NAME to $DEPLOY_HOST"
scp -q "$JAR" "$DEPLOY_HOST:$REMOTE_JAR"

local_sum=$(sha256sum "$JAR" | cut -d' ' -f1)
remote_sum=$(ssh "$DEPLOY_HOST" "sha256sum '$REMOTE_JAR' | cut -d' ' -f1")
[ "$local_sum" = "$remote_sum" ] || die "checksum mismatch after copy
  local:  $local_sum
  remote: $remote_sum"
say "checksum matches: ${local_sum:0:16}..."

# ---------------------------------------------------------------- symlink ----
# The instance's plugins directory holds symlinks into the shared library, so
# the previous version stays on disk as a rollback.
say "pointing $SERVER_NAME at $NAME"
ssh "$DEPLOY_HOST" "ln -sfn '../../plugins/$NAME' '$MC_HOME/$SERVER_NAME/plugins/fruitjuice.jar'"

# ---------------------------------------------------------------- restart ----
if [ "${NO_RESTART:-0}" = "1" ]; then
    say "NO_RESTART set; the new jar loads at the next restart"
    exit 0
fi

say "restarting"
ssh "$DEPLOY_HOST" "$REMOTE_SCRIPTS/start-server.sh restart"

# ----------------------------------------------------------------- verify ----
# What the server actually enabled, rather than what we hoped it would.
enabled=$(ssh "$DEPLOY_HOST" \
    "grep -a 'Enabling FruitJuice' '$MC_HOME/$SERVER_NAME/logs/latest.log' | tail -1" || true)
say "server reports: ${enabled:-<nothing found in the log>}"
