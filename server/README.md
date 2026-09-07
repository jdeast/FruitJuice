# Server scripts

Scripts for running a FruitJuice server: starting it, keeping the jars current,
backing the world up, and deploying a new build of the plugin.

Nothing here is required to *use* FruitJuice — the plugin is just a jar in
`plugins/`. These exist because running a server for a class turns out to
involve the same handful of chores, and doing them by hand is how you end up
unsure which build is running.

## Setup

```
cp config.example.sh config.sh      # config.sh is gitignored
$EDITOR config.sh
```

Most setups only need `MC_HOME` and `SERVER_NAME`. Every value uses the
`${VAR:-default}` form, so an environment variable still wins over the file:

```
MIN_BACKUP_INTERVAL=0 ./backup.sh   # take one now regardless
```

## The scripts

| | |
|---|---|
| `start-server.sh [restart\|start\|stop\|status]` | Runs the server, the WebSocket relay Scratch connects to, and the backup watcher. |
| `backup.sh [--force]` | One world snapshot, then prune to `KEEP_BACKUPS`. |
| `backup-watch.sh` | Follows the log and calls `backup.sh` when a player logs off. Started by `start-server.sh`. |
| `update.sh` | Fetches the latest Paper, Geyser and Floodgate and repoints each instance. Restarts nothing. |
| `deploy-plugin.sh <jar>` | Copies a built jar to the server, verifies the checksum, repoints the symlink, restarts, and reports the version the server actually enabled. |

## How backups work

A snapshot is taken when the **last player logs off** — the world has just
changed, nobody is writing to it, and for a class that is the natural end of a
session. `backup.sh` decides whether to go ahead: it skips if anyone is online
(it asks the plugin on `MC_PORT`, rather than guessing from the log) and skips
if the last snapshot was under `MIN_BACKUP_INTERVAL` ago, so an evening of
people coming and going does not churn through the retention.

Snapshots hardlink unchanged files against the previous one, so they are far
cheaper than they look. Measured on a 391MB world:

```
50 snapshots     397 MB on disk
                (~19.5 GB if they were full copies)
```

Restoring is a copy back — a snapshot is an ordinary directory:

```
./start-server.sh stop
cp -a backups/<instance>/20260907_162437/world <instance>/world
./start-server.sh start
```

`session.lock` is excluded from snapshots, so a restored world is not locked.

## Notes for anyone adapting these

Three mistakes are baked into the comments because each one actually happened
here, and each is easy to write again:

- **`pgrep -f paper.jar` matches the shell running that command.** It kills the
  wrapper, reports success, and starts a second server on top of a live one.
  Minecraft's `session.lock` catches that, but only *after* the script has said
  it succeeded — leaving the old build running and looking restarted. Use
  `pgrep -x java` and filter on the command line.
- **`sudo cmd >> /var/log/file` does the redirect as you, not root.** It fails
  with "Permission denied" and takes the service down with it.
- **`cp -r world* dir/ && rm -r world*` with no check between them.** If the
  copy fails — a full disk being the obvious way — the delete still runs and the
  world is gone with no backup. A predecessor of `backup.sh` did exactly this,
  and its sibling had a wrong path that made it create an empty backup directory
  in `$HOME` 306 times without ever backing anything up.

`backup.sh` verifies the copy before anything is removed, builds each snapshot
under a `.incomplete_` name so an interrupted run is never mistaken for a good
one, and never touches the live world at all.
