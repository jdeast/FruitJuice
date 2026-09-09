#!/bin/bash
#
# Fetch the newest released FruitJuice jar and point a server at it.
#
#   update-fruitjuice.sh              # fetch and install, do not restart
#   update-fruitjuice.sh --restart    # ... and restart the server
#   update-fruitjuice.sh --check      # say what would happen, change nothing
#
# WHERE THE JAR COMES FROM, AND WHY NOT THE OTHER TWO PLACES
#
# The GitHub release. release.yml builds the jar, runs the full suite, attaches
# it to the release, and only then hands that same asset to Hangar -- so the
# release is upstream of Hangar and cannot be behind it, and it needs no API
# token to read.
#
# Not Hangar, which is a copy one step further away.
#
# Not a git checkout built here. That needs a JDK and maven on a Pi, takes
# minutes, and produces an artifact nothing has tested. The whole point of the
# release is that CI already built and tested exactly these bytes.
#
# WHAT THIS DOES NOT DO
#
# It installs whatever the newest RELEASE is. A jar built by hand from master
# and copied over is newer than any release, and this will happily replace it
# with an older one -- so if you are running an unreleased build, tag and push
# first. It says so rather than guessing, but it cannot know what you intended.
set -euo pipefail

REPO="${REPO:-jdeast/FruitJuice}"
LIB="${LIB:-/home/jdeast/minecraft/plugins}"
SERVER_DIR="${SERVER_DIR:-/home/jdeast/minecraft/roberts_25565_19132_4711}"
HEAP="${HEAP:-2048M}"

LINK="$SERVER_DIR/plugins/fruitjuice.jar"
JAR="$SERVER_DIR/paper.jar"
LOG="$SERVER_DIR/logs/latest.log"

restart=no
check=no
for a in "$@"; do
    case "$a" in
        --restart) restart=yes ;;
        --check)   check=yes ;;
        *) echo "unknown option: $a" >&2; exit 2 ;;
    esac
done

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { say "ERROR: $*"; exit 1; }

[ -d "$SERVER_DIR" ] || die "no such server directory: $SERVER_DIR"
[ -d "$LIB" ] || die "no such jar library: $LIB"

# ------------------------------------------------------------------ look ------

api="https://api.github.com/repos/$REPO/releases/latest"
json=$(curl -fsSL --retry 3 "$api") || die "could not reach $api"

tag=$(printf '%s' "$json" | jq -r '.tag_name // empty')
name=$(printf '%s' "$json" | jq -r '[.assets[] | select(.name | endswith(".jar")) | .name] | first // empty')
url=$(printf '%s' "$json" | jq -r '[.assets[] | select(.name | endswith(".jar")) | .browser_download_url] | first // empty')

[ -n "$tag" ]  || die "the release has no tag name"
# The asset is named for its version (FruitJuice-0.5.1.jar), so the tidy
# /releases/latest/download/NAME shortcut cannot be used: the name moves with
# every release. Hence asking the API which asset it actually is.
[ -n "$name" ] || die "release $tag has no .jar attached"

current=""
[ -L "$LINK" ] && current=$(basename "$(readlink -f "$LINK")")
say "latest release: $tag ($name)"
say "installed now : ${current:-nothing}"

if [ "$current" = "$name" ] && [ -f "$LIB/$name" ]; then
    say "already up to date"
    exit 0
fi

# Running something newer than the newest release means a hand-built jar, and
# quietly rolling that back would undo work with no warning at all.
if [ -n "$current" ]; then
    have=$(printf '%s' "$current" | sed 's/^FruitJuice-//; s/\.jar$//')
    want=${tag#v}
    newest=$(printf '%s\n%s\n' "$have" "$want" | sort -V | tail -1)
    if [ "$newest" = "$have" ] && [ "$have" != "$want" ]; then
        die "installed $have is NEWER than release $want. That is a hand-built
       jar; tag and push it instead of rolling back, or remove the symlink
       to override."
    fi
fi

if [ "$check" = yes ]; then
    say "would install $name from $tag"
    exit 0
fi

# ----------------------------------------------------------------- fetch ------

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

say "downloading $name"
curl -fsSL --retry 3 -o "$tmp/$name" "$url" || die "download failed"

# A truncated or rate-limited download is still a file, and a corrupt jar fails
# at plugin load -- long after this script has reported success.
unzip -tqq "$tmp/$name" >/dev/null 2>&1 || die "$name is not a readable zip"
built=$(unzip -p "$tmp/$name" plugin.yml 2>/dev/null |
        sed -n "s/^version: *'\?\([^']*\)'\?/\1/p" | head -1)
[ -n "$built" ] || die "no version in the jar's plugin.yml"
if [ "$built" != "${tag#v}" ]; then
    die "release $tag contains a jar that reports $built"
fi
say "verified: plugin.yml says $built"

install -m 644 "$tmp/$name" "$LIB/$name"
# The previous jar stays in the library, so rolling back is one ln away.
ln -sfn "../../plugins/$name" "$LINK"
say "installed $name  (was ${current:-nothing})"

if [ "$restart" != yes ]; then
    say "not restarting; the server keeps running the old jar until you do"
    exit 0
fi

# --------------------------------------------------------------- restart ------
#
# pgrep -x java matches the java binary only, so this can never match the shell
# running it -- unlike `pgrep -f paper.jar`, which matches any command line
# mentioning the jar, including this one. That mistake kills the wrapper,
# reports success, and starts a second server on top of a live one.
server_pids() {
    local p
    for p in $(pgrep -x java 2>/dev/null); do
        if tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | grep -qF "$JAR"; then
            echo "$p"
        fi
    done
}

pids=$(server_pids)
if [ -n "$pids" ]; then
    say "stopping minecraft (pid $pids)"
    # SIGTERM is the only graceful stop: java runs orphaned with stdin on
    # /dev/null, so there is no console to type `stop` into.
    for p in $pids; do kill "$p"; done
    waited=0
    while [ -n "$(server_pids)" ] && [ "$waited" -lt 120 ]; do
        sleep 2; waited=$((waited + 2))
    done
    [ -n "$(server_pids)" ] && die "still running after ${waited}s"
    say "stopped after ${waited}s"
else
    say "minecraft was not running"
fi

# Only match readiness in what THIS run writes. Without it the check matches the
# previous run's line and reports success instantly.
inode_before=$(stat -c %i "$LOG" 2>/dev/null || echo none)
size_before=$(stat -c %s "$LOG" 2>/dev/null || echo 0)

say "starting minecraft"
( cd "$SERVER_DIR" && setsid nohup java -Xmx"$HEAP" -Xms"$HEAP" -jar "$JAR" \
    </dev/null >>"$SERVER_DIR/nohup.out" 2>&1 & )

new_out() {
    local now
    now=$(stat -c %i "$LOG" 2>/dev/null || echo none)
    if [ "$now" != "$inode_before" ]; then
        cat "$LOG" 2>/dev/null
    else
        tail -c "+$((size_before + 1))" "$LOG" 2>/dev/null
    fi
}

waited=0
while [ "$waited" -lt 240 ]; do
    if new_out | grep -qa 'For help, type'; then
        say "minecraft is up after ${waited}s"
        # The filename is only what the jar was named. This line is the server
        # saying which version it actually loaded.
        new_out | grep -a 'Enabling FruitJuice' | tail -1
        exit 0
    fi
    sleep 3; waited=$((waited + 3))
done
die "no readiness line after ${waited}s; check $LOG"
