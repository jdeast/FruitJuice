#!/bin/bash
#
# Take a snapshot whenever the last player logs off.
#
# That is a good moment for it: the world has just been changed by whoever was
# playing, and nobody is writing to it any more, so the copy is both worth
# taking and safe to take. It is also the moment a class ends.
#
# Follows the server log for "left the game" and asks backup.sh to run. backup.sh
# is the one that decides whether to go ahead -- it checks that nobody is online
# and that enough time has passed -- so this stays a dumb trigger and the
# interesting rules live in one place.
#
# Run it from startsecurescratch.sh, or by hand:
#     nohup server/backup-watch.sh >> ~/backup-watch.log 2>&1 &
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/config.sh" ]; then
    . "$HERE/config.sh"
else
    . "$HERE/config.example.sh"
fi

LOG="$MC_HOME/$SERVER_NAME/logs/latest.log"

# Wait for the world to settle before copying. A player quitting triggers chunk
# unloads and saves that take a moment, and there is no point racing them.
SETTLE_SECONDS="${SETTLE_SECONDS:-30}"

say() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

say "watching $LOG for logouts"

# -F rather than -f, so the watcher survives the log being rotated when the
# server restarts. Without that it would follow the old file forever and
# silently stop backing anything up.
tail -n 0 -F "$LOG" 2>/dev/null | while read -r line; do
    case "$line" in
        *"left the game"*) ;;
        *) continue ;;
    esac

    who="$(printf '%s' "$line" | sed -n 's/.*INFO\]: \(.*\) left the game.*/\1/p')"
    say "${who:-someone} left; waiting ${SETTLE_SECONDS}s before checking"
    sleep "$SETTLE_SECONDS"

    # backup.sh returns 0 and says why when it declines, so a busy evening of
    # people coming and going produces log lines rather than fifty snapshots.
    "$HERE/backup.sh" || say "backup.sh failed with status $?"
done
