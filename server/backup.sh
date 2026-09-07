#!/bin/bash
#
# Take one snapshot of the world, then prune to the newest KEEP_BACKUPS.
#
# Safe to run on a schedule, from a watcher, or by hand. It declines rather than
# risks anything: no snapshot while players are online, none within
# MIN_BACKUP_INTERVAL of the last, and the live world is never touched.
#
# WHAT THIS REPLACES, AND WHY
#
# The previous pair of scripts had two problems worth spelling out, because both
# are easy to write again.
#
#   backup_survival.sh started with
#       cd $HOME/survival_25565_19142_4721      # wrong path, the real one
#   which failed, and the script carried on in $HOME creating an empty backup
#   directory there. It had done that 306 times. The survival world had never
#   once been backed up, and nothing ever said so.
#
#   backup_reset_flat.sh did
#       cp -r world* $DIRNAME/
#       rm -r world*
#   with no `set -e` and no check between the two. If the copy failed -- a full
#   disk being the obvious way -- the delete still ran and the world was gone
#   with no backup.
#
# Hence: `set -euo pipefail`, every `cd` guarded, the copy verified before
# anything is removed, and pruning that only ever deletes completed snapshots.
#
# Snapshots hardlink unchanged files against the previous one (rsync
# --link-dest), so fifty of them cost little more than one full copy. On a 390MB
# world that is the difference between about 400MB and about 20GB.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/config.sh" ]; then
    . "$HERE/config.sh"
else
    . "$HERE/config.example.sh"
fi

SERVER_DIR="$MC_HOME/$SERVER_NAME"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

say() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { say "ERROR: $*" >&2; exit 1; }

[ -d "$SERVER_DIR" ] || die "no server directory at $SERVER_DIR (check SERVER_NAME in config.sh)"
[ -d "$SERVER_DIR/world" ] || die "no world at $SERVER_DIR/world"

# ---------------------------------------------------------------- guards -----

# Copying a world while it is being written gives a torn snapshot. Asking the
# plugin who is online is cheaper and more truthful than parsing the log, and it
# fails safe: if the server is not answering, assume it is busy and skip.
players_online() {
    python3 - "$MC_PORT" <<'PY' 2>/dev/null || return 2
import socket, sys
try:
    s = socket.create_connection(("localhost", int(sys.argv[1])), 5)
    s.settimeout(5)
    s.sendall(b"world.getPlayerIds()\n")
    reply = s.recv(4096).decode().strip()
    s.close()
except Exception:
    sys.exit(2)                      # could not ask
sys.exit(0 if reply.startswith("Fail") else 1)   # 0 = empty, 1 = somebody on
PY
}

if [ "$FORCE" -eq 0 ]; then
    set +e
    players_online
    case $? in
        0) : ;;   # nobody online, go ahead
        1) say "players are online; skipping"; exit 0 ;;
        *) say "could not reach the server on port $MC_PORT; skipping"; exit 0 ;;
    esac
    set -e
fi

mkdir -p "$BACKUP_DIR"

LATEST_LINK="$BACKUP_DIR/latest"
if [ "$FORCE" -eq 0 ] && [ -e "$LATEST_LINK" ]; then
    last_epoch=$(stat -c %Y "$LATEST_LINK" 2>/dev/null || echo 0)
    age=$(( $(date +%s) - last_epoch ))
    if [ "$age" -lt "$MIN_BACKUP_INTERVAL" ]; then
        say "last snapshot was ${age}s ago (minimum ${MIN_BACKUP_INTERVAL}s); skipping"
        exit 0
    fi
fi

# ---------------------------------------------------------------- snapshot ---

STAMP="$(date '+%Y%m%d_%H%M%S')"
TARGET="$BACKUP_DIR/$STAMP"
STAGING="$BACKUP_DIR/.incomplete_$STAMP"

# Built under a dot-name and renamed at the end, so a snapshot interrupted
# halfway is never mistaken for a good one by the pruning below.
rm -rf "$STAGING"
mkdir -p "$STAGING"

# --link-dest is compared against the DESTINATION directory, which is
# $STAGING/world/ -- so it has to point at the previous snapshot's world/ too,
# not at the snapshot root. Getting that wrong costs nothing visible except a
# full copy every time: rsync simply finds no matches and hardlinks nothing.
LINK_ARGS=()
if [ -d "$LATEST_LINK/world" ]; then
    LINK_ARGS=(--link-dest="$(readlink -f "$LATEST_LINK")/world")
fi

say "snapshotting $SERVER_DIR/world -> $TARGET"
# session.lock is the running server's lock file and is meaningless in a copy;
# excluding it also stops a restored backup from looking locked.
rsync -a --delete "${LINK_ARGS[@]}" \
      --exclude 'session.lock' \
      "$SERVER_DIR/world/" "$STAGING/world/"

# Verify before anything is removed. rsync exiting 0 is good evidence, but a
# world with no level.dat is not a world, and that is cheap to check.
[ -f "$STAGING/world/level.dat" ] || die "snapshot has no level.dat; leaving $STAGING in place"

# mv into an existing directory puts the source INSIDE it rather than
# replacing it, which would nest .incomplete_<stamp>/world under a finished
# snapshot. The stamp is second-resolution, so two runs in the same second
# collide -- only reachable with --force in practice, but silent when it
# happens.
if [ -e "$TARGET" ]; then
    rm -rf "$STAGING"
    say "a snapshot for $STAMP already exists; nothing to do"
    exit 0
fi
mv "$STAGING" "$TARGET"
ln -sfn "$TARGET" "$LATEST_LINK"
# Measured across the whole backup directory, because du counts a hardlinked
# file once per invocation -- a snapshot measured alone always looks full size
# even when almost all of it is shared.
say "snapshot complete: $(du -sh --apparent-size "$TARGET" | cut -f1) of world data, $(du -sh "$BACKUP_DIR" | cut -f1) on disk for all snapshots"

# ---------------------------------------------------------------- prune ------

# Only completed snapshots: the glob deliberately does not match .incomplete_*,
# and `latest` is a symlink rather than a directory.
mapfile -t snapshots < <(find "$BACKUP_DIR" -maxdepth 1 -type d -name '2*' -printf '%f\n' | sort)
count=${#snapshots[@]}
if [ "$count" -gt "$KEEP_BACKUPS" ]; then
    drop=$(( count - KEEP_BACKUPS ))
    say "keeping newest $KEEP_BACKUPS of $count; removing $drop oldest"
    for ((i = 0; i < drop; i++)); do
        victim="$BACKUP_DIR/${snapshots[$i]}"
        # Never delete what `latest` points at, however the counting went.
        if [ "$(readlink -f "$LATEST_LINK")" = "$(readlink -f "$victim")" ]; then
            say "  refusing to remove the newest snapshot ($victim)"
            continue
        fi
        rm -rf "$victim"
        say "  removed ${snapshots[$i]}"
    done
fi

say "done: $(find "$BACKUP_DIR" -maxdepth 1 -type d -name '2*' | wc -l) snapshots, $(du -sh "$BACKUP_DIR" | cut -f1) total"
