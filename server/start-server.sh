#!/bin/bash
#
# Restart the Minecraft server and the websocket relay that Scratch connects to.
#
# Safe to run twice. Safe to run while the server is already up. Safe to run
# over ssh and disconnect immediately afterwards.
#
# The version this replaces did:
#
#     killall java
#     cd .../scratch_25575_19152_4711
#     java ... &
#     sleep 60
#
# which had four problems worth naming, because each one has bitten:
#
#  1. killall java signals EVERY java process on the machine, not this server.
#  2. It did not wait. Minecraft needs a few seconds to flush chunks and release
#     world/session.lock, so the new server frequently started before the old
#     one let go, hit "already locked (possibly by other Minecraft instance?)",
#     and died -- leaving the OLD build running and the restart looking done.
#  3. sleep 60 is a guess. Startup here takes about 80 seconds, so the script
#     regularly reported success while the server was still loading.
#  4. Backgrounding with a bare & leaves both processes attached to the calling
#     shell, so running this over ssh and logging out could take them down.
#
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/config.sh" ]; then
    . "$HERE/config.sh"
else
    . "$HERE/config.example.sh"
fi

SERVER_DIR="$MC_HOME/$SERVER_NAME"
JAR="$SERVER_DIR/paper.jar"
LOG="$SERVER_DIR/logs/latest.log"
WS_LOG="${WS_LOG:-$HOME/websockify.log}"

STOP_TIMEOUT=120     # seconds to wait for a graceful shutdown
START_TIMEOUT=240    # seconds to wait for "Done (...)!"

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { say "ERROR: $*"; exit 1; }

# Java processes belonging to THIS server.
#
# pgrep -x java matches the java binary only, so this can never match the
# script's own shell -- unlike `pgrep -f paper.jar`, which matches any command
# line mentioning the jar, including this one. That mistake starts a second
# server on top of a live one.
server_pids() {
    local p
    for p in $(pgrep -x java 2>/dev/null); do
        if tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | grep -qF "$JAR"; then
            echo "$p"
        fi
    done
}

# ---------------------------------------------------------------- stop --------
stop_server() {
    local pids
    pids=$(server_pids)
    if [ -z "$pids" ]; then
        say "minecraft is not running"
        return 0
    fi

    say "stopping minecraft (pid $pids)"
    # SIGTERM is the only graceful stop available: this server runs with no
    # console and no systemd unit, so there is nothing to type "stop" into.
    # Paper traps it, saves every world and exits.
    kill -TERM $pids 2>/dev/null

    local waited=0
    while [ "$waited" -lt "$STOP_TIMEOUT" ] && [ -n "$(server_pids)" ]; do
        sleep 1
        waited=$((waited + 1))
    done

    if [ -n "$(server_pids)" ]; then
        # Deliberately not escalating to SIGKILL. A server that has not
        # finished saving after two minutes is busy writing chunks, and killing
        # it there is how worlds get corrupted. Better to stop and let a person
        # look than to trade someone's build for a tidy exit code.
        die "minecraft did not stop after ${STOP_TIMEOUT}s (pid $(server_pids)). Not forcing it -- it may still be saving chunks."
    fi
    say "minecraft stopped after ${waited}s"
}

stop_websockify() {
    if pgrep -f "websockify.*$WS_PORT" >/dev/null 2>&1; then
        say "stopping websockify"
        sudo pkill -f "websockify.*$WS_PORT" 2>/dev/null
        sleep 1
    fi
}

# --------------------------------------------------------------- start --------
start_server() {
    [ -f "$JAR" ] || die "no jar at $JAR"

    # Refuse rather than start a second server on top of a live one. The lock
    # would stop it anyway, but it would stop it AFTER this script had reported
    # success, leaving the old build running and looking restarted.
    if [ -n "$(server_pids)" ]; then
        say "minecraft is already running (pid $(server_pids)) -- use restart"
        return 0
    fi

    # Which build is about to run. The jar's filename is only what it was
    # named, not what it was built from, so record something checkable.
    say "plugin: $(readlink -f "$SERVER_DIR/plugins/fruitjuice.jar" 2>/dev/null || echo none)"

    # Remember where the log is now, so the readiness check below can only
    # match lines this run writes. Without this the check matches the PREVIOUS
    # run's "For help, type" and reports success immediately.
    local log_inode_before log_size_before
    log_inode_before=$(stat -c %i "$LOG" 2>/dev/null || echo none)
    log_size_before=$(stat -c %s "$LOG" 2>/dev/null || echo 0)

    say "starting minecraft"
    # setsid detaches from this shell's session and nohup ignores SIGHUP, so the
    # server survives the ssh connection going away. stdin from /dev/null
    # because there is no console to read from.
    ( cd "$SERVER_DIR" && \
      setsid nohup java -Xmx"$HEAP" -Xms"$HEAP" -jar "$JAR" \
             </dev/null >>"$SERVER_DIR/nohup.out" 2>&1 & )

    # Wait for the server to say it is ready, rather than guessing at a sleep.
    # Only the part of the log written by THIS run. Paper may replace the file
    # (new inode, read it whole) or keep appending (same inode, skip what was
    # already there).
    new_log_output() {
        local now_inode
        now_inode=$(stat -c %i "$LOG" 2>/dev/null || echo none)
        if [ "$now_inode" != "$log_inode_before" ]; then
            cat "$LOG" 2>/dev/null
        else
            tail -c "+$((log_size_before + 1))" "$LOG" 2>/dev/null
        fi
    }

    local waited=0
    while [ "$waited" -lt "$START_TIMEOUT" ]; do
        if new_log_output | grep -qa 'For help, type'; then
            say "minecraft is up after ${waited}s"
            new_log_output | grep -a 'Enabling FruitJuice' | tail -1
            return 0
        fi
        if [ -z "$(server_pids)" ] && [ "$waited" -gt 10 ]; then
            say "--- last 20 lines of $LOG ---"
            new_log_output | tail -20
            die "minecraft exited during startup"
        fi
        sleep 2
        waited=$((waited + 2))
    done
    die "minecraft did not finish starting within ${START_TIMEOUT}s"
}

start_websockify() {
    # The relay that lets a browser reach the plugin: Scratch speaks WebSocket,
    # the plugin speaks raw TCP on $MC_PORT.
    #
    # cert obtained via: sudo certbot certonly --standalone -d "$CERT_HOST"
    # renewal (systemd certbot.timer) auto-restarts websockify via
    # /etc/letsencrypt/renewal-hooks/deploy/restart-websockify.sh
    # run as root (sudo) because the private key is mode 600 root:root
    # A first-time setup has no certificate yet, and a relay serving plain
    # ws:// is more use than one that refuses to start. scratch.js tries wss://
    # first and falls back, so both cases work from the same URL.
    local tls=()
    if [ -r "$CERT_DIR/fullchain.pem" ]; then
        tls=(--cert="$CERT_DIR/fullchain.pem" --key="$CERT_DIR/privkey.pem")
    else
        say "WARNING: no certificate at $CERT_DIR -- serving ws:// only, no wss://"
    fi

    # Same idempotency point as start_server: a second relay cannot bind the
    # port, so it dies seconds later while this script has already said "up".
    if pgrep -f "websockify.*$WS_PORT" >/dev/null 2>&1; then
        say "websockify is already running on $WS_PORT"
        return 0
    fi

    say "starting websockify on $WS_PORT"
    # No --ssl-only, deliberately: plaintext ws:// stays available so a browser
    # that cannot use the certificate can still connect. scratch.js tries wss://
    # first and only falls back, and warns in the console when it does.
    sudo setsid nohup websockify "${tls[@]}" \
        "$WS_PORT" "localhost:$MC_PORT" \
        </dev/null >>"$WS_LOG" 2>&1 &

    sleep 2
    if pgrep -f "websockify.*$WS_PORT" >/dev/null 2>&1; then
        say "websockify is up"
    else
        say "--- last 10 lines of $WS_LOG ---"
        tail -10 "$WS_LOG" 2>/dev/null
        die "websockify did not start"
    fi
}

# The watcher snapshots the world when the last player logs off. It follows the
# log, so it has to be restarted alongside the server rather than left running
# against a file that has been rotated away.
start_backup_watch() {
    if pgrep -f "backup-watch.sh" >/dev/null 2>&1; then
        say "backup watcher already running"
        return 0
    fi
    [ -x "$HERE/backup-watch.sh" ] || { say "no backup-watch.sh; skipping"; return 0; }
    say "starting backup watcher"
    # stdbuf -oL: without it the watcher's output is block-buffered into the
    # log file and nothing appears for a long time, which reads exactly like a
    # watcher that is not working.
    setsid nohup stdbuf -oL "$HERE/backup-watch.sh" </dev/null >>"$HOME/backup-watch.log" 2>&1 &
}

stop_backup_watch() {
    if pgrep -f "backup-watch.sh" >/dev/null 2>&1; then
        say "stopping backup watcher"
        pkill -f "backup-watch.sh" 2>/dev/null || true
    fi
}

# ---------------------------------------------------------------- main --------
case "${1:-restart}" in
    restart) stop_backup_watch; stop_websockify; stop_server
             start_server; start_websockify; start_backup_watch ;;
    stop)    stop_backup_watch; stop_websockify; stop_server ;;
    start)   start_server; start_websockify; start_backup_watch ;;
    status)
        pids=$(server_pids)
        [ -n "$pids" ] && say "minecraft running (pid $pids)" || say "minecraft NOT running"
        pgrep -f "websockify.*$WS_PORT" >/dev/null 2>&1 \
            && say "websockify running" || say "websockify NOT running"
        pgrep -f "backup-watch.sh" >/dev/null 2>&1 \
            && say "backup watcher running" || say "backup watcher NOT running"
        ;;
    *) echo "usage: $0 [restart|start|stop|status]" >&2; exit 2 ;;
esac

say "done"
