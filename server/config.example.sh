#!/bin/bash
#
# Copy this to config.sh and edit. config.sh is gitignored, so your own paths,
# hostname and instance names stay off GitHub.
#
#     cp server/config.example.sh server/config.sh
#
# Every value uses the ${VAR:-default} form on purpose, so an environment
# variable still wins over this file. That is what lets you try something
# without editing config:
#     MIN_BACKUP_INTERVAL=0 server/backup.sh
# Plain assignments here would silently override the environment instead.
#
# Everything here has a working default for a single-instance setup, so a fresh
# server usually needs only MC_HOME and SERVER_NAME.

# Where the Minecraft instances live. The shared jar library is $MC_HOME/plugins.
MC_HOME="${MC_HOME:-$HOME/minecraft}"

# The instance this script set operates on: a directory under $MC_HOME holding
# paper.jar, plugins/ and world/.
#
# A useful convention is to name it after the ports it uses, so that a machine
# running several instances is self-documenting:
#     <purpose>_<java port>_<bedrock port>_<python port>
SERVER_NAME="${SERVER_NAME:-scratch_25565_19132_4711}"

# Every instance update.sh should keep jars in step. One per line.
ALL_SERVERS=(
    "$SERVER_NAME"
)

# Heap. Match to the machine: a 4GB Raspberry Pi is comfortable at 2048M.
HEAP="${HEAP:-2048M}"

# Ports. MC_PORT is the plain TCP port FruitJuice listens on for Python
# clients; WS_PORT is the WebSocket relay that Scratch connects to.
MC_PORT="${MC_PORT:-4711}"
WS_PORT="${WS_PORT:-14711}"

# Hostname on the certificate, for the Scratch relay. Leave empty to run the
# relay without TLS (plain ws:// only).
CERT_HOST="${CERT_HOST:-your-server.example.org}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/$CERT_HOST}"

# Backups. KEEP_BACKUPS snapshots are retained; older ones are deleted oldest
# first. Snapshots hardlink unchanged files against the previous one, so fifty
# of them cost little more than one full copy.
BACKUP_DIR="${BACKUP_DIR:-$MC_HOME/backups/$SERVER_NAME}"
KEEP_BACKUPS="${KEEP_BACKUPS:-50}"

# Don't take another snapshot within this many seconds of the last one, so a
# player logging in and out repeatedly does not churn through the retention.
MIN_BACKUP_INTERVAL="${MIN_BACKUP_INTERVAL:-1800}"

# --- deploy-plugin.sh only -------------------------------------------------

# ssh host to deploy to. An alias from ~/.ssh/config is easiest, so the port,
# user and key stay out of this file.
DEPLOY_HOST="${DEPLOY_HOST:-}"

# Where this server/ directory lives on that host.
REMOTE_SCRIPTS="${REMOTE_SCRIPTS:-$MC_HOME/server}"

# Pin the Minecraft version for update.sh. Empty means whatever Paper says is
# newest, which is convenient and occasionally a surprise -- a Paper release
# can move you to a Minecraft version the plugins do not support yet.
MINECRAFT_VERSION="${MINECRAFT_VERSION:-}"
