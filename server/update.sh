#!/bin/bash
#
# Fetch the latest Paper, Geyser and Floodgate jars into the shared jar library
# and repoint each instance's symlinks at them.
#
# It does NOT restart anything. The new jar takes effect at the next restart, so
# run start-server.sh afterwards when you are ready for it.
#
# NOTES ON WHAT CHANGED FROM THE ORIGINAL, since each of these can bite:
#
#  - Absolute paths. The original used relative `plugins/...` with no cd, so run
#    from the wrong directory it silently built a second plugins tree there.
#  - set -euo pipefail. Without it a failed curl left an empty URL, the download
#    wrote a garbage file, and the symlink was repointed at it -- so the server
#    then failed to start, for a reason several steps removed from the cause.
#  - Real exit codes. Both original failure paths ran a bare `exit`, which is
#    exit 0, so nothing calling this could tell it had failed.
#  - Downloads are verified and staged. A jar is fetched to a .part file,
#    checked, and only then moved into place, so an interrupted download cannot
#    be mistaken for a good jar.
#  - MINECRAFT_VERSION can be pinned. Taking whatever is newest means a Paper
#    release can move the server to a Minecraft version the plugins do not
#    support yet, which is how the 1.13 flattening broke FruitJuice for years
#    before anyone noticed.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/config.sh" ]; then
    . "$HERE/config.sh"
else
    . "$HERE/config.example.sh"
fi

LIB="$MC_HOME/plugins"          # the shared jar library, not a plugins dir
UA="FruitJuice-update.sh"

# Pin by setting MINECRAFT_VERSION in config.sh. Empty means "whatever Paper
# says is newest", which is convenient and occasionally a surprise.
MINECRAFT_VERSION="${MINECRAFT_VERSION:-}"

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { say "ERROR: $*" >&2; exit 1; }

command -v jq   >/dev/null || die "jq is not installed"
command -v curl >/dev/null || die "curl is not installed"
mkdir -p "$LIB"

# Download to a .part file and only rename once it is complete and looks like a
# jar. A truncated jar that is already in place is much harder to notice.
fetch() {
    local url="$1" dest="$2"
    curl --fail --location --silent --show-error \
         -H "User-Agent: $UA" -o "$dest.part" "$url" \
        || { rm -f "$dest.part"; die "download failed: $url"; }
    # Every jar is a zip, and every zip starts "PK".
    if [ "$(head -c 2 "$dest.part")" != "PK" ]; then
        rm -f "$dest.part"
        die "what came back from $url is not a jar"
    fi
    mv "$dest.part" "$dest"
}

# Point every configured instance at a jar in the library.
link_all() {
    local jar="$1" linkname="$2" server
    for server in "${ALL_SERVERS[@]}"; do
        local dir="$MC_HOME/$server"
        [ -d "$dir" ] || { say "  no such instance: $dir (skipping)"; continue; }
        if [ "$linkname" = "paper.jar" ]; then
            ln -fns "$LIB/$jar" "$dir/paper.jar"
        else
            mkdir -p "$dir/plugins"
            ln -fns "$LIB/$jar" "$dir/plugins/$linkname"
        fi
        say "  $server/$linkname -> $jar"
    done
}

# ------------------------------------------------------------------ paper ----
say "checking Paper"
PAPER_API="https://fill.papermc.io/v3/projects/paper"

if [ -z "$MINECRAFT_VERSION" ]; then
    MINECRAFT_VERSION=$(curl -fsS -H "User-Agent: $UA" "$PAPER_API" \
        | jq -r '.versions | to_entries[0].value[0]')
    say "  latest Minecraft version: $MINECRAFT_VERSION"
else
    say "  pinned to Minecraft $MINECRAFT_VERSION"
fi
[ -n "$MINECRAFT_VERSION" ] && [ "$MINECRAFT_VERSION" != "null" ] \
    || die "could not determine the Minecraft version"

BUILDS=$(curl -fsSL -H "User-Agent: $UA" "$PAPER_API/versions/$MINECRAFT_VERSION/builds")
# Prefer a stable build, then beta, then alpha, then whatever is newest.
PICK='sort_by(.id)
      | (map(select(.channel == "STABLE")) | last)
     // (map(select(.channel == "BETA"))   | last)
     // (map(select(.channel == "ALPHA"))  | last)
     // last'
PAPER_BUILD=$(printf '%s' "$BUILDS" | jq -r "$PICK | .id")
PAPER_URL=$(printf '%s' "$BUILDS" | jq -r "$PICK | .downloads[\"server:default\"].url")

[ -n "$PAPER_BUILD" ] && [ "$PAPER_BUILD" != "null" ] || die "no Paper build found for $MINECRAFT_VERSION"
[ -n "$PAPER_URL" ] && [ "$PAPER_URL" != "null" ] || die "no download URL for Paper build $PAPER_BUILD"

PAPER_JAR="paper-${MINECRAFT_VERSION}-${PAPER_BUILD}.jar"
if [ -f "$LIB/$PAPER_JAR" ]; then
    say "  $PAPER_JAR already present"
else
    say "  downloading $PAPER_JAR"
    fetch "$PAPER_URL" "$LIB/$PAPER_JAR"
fi
link_all "$PAPER_JAR" "paper.jar"

# -------------------------------------------------- geyser and floodgate -----
# Both come from the same API and are fetched the same way.
geysermc() {
    local project="$1" jar_prefix="$2" linkname="$3"
    say "checking $project"

    local version build jar
    version=$(curl -fsS "https://download.geysermc.org/v2/projects/$project" \
              | jq -r '.versions[-1]')
    [ -n "$version" ] && [ "$version" != "null" ] || die "no $project version found"

    build=$(curl -fsS "https://download.geysermc.org/v2/projects/$project/versions/$version" \
            | jq -r '.builds[-1]')
    [ -n "$build" ] && [ "$build" != "null" ] || die "no $project build found for $version"

    jar="${jar_prefix}-${build}.jar"
    if [ -f "$LIB/$jar" ]; then
        say "  $jar already present"
    else
        say "  downloading $jar"
        fetch "https://download.geysermc.org/v2/projects/$project/versions/latest/builds/latest/downloads/spigot" \
              "$LIB/$jar"
    fi
    link_all "$jar" "$linkname"
}

geysermc geyser    "Geyser-Spigot"    "geyser.jar"
geysermc floodgate "floodgate-spigot" "floodgate.jar"

# ------------------------------------------------------------- fruitjuice ----
# From the GitHub release, not Hangar. release.yml builds the jar, runs the
# full suite, attaches it to the release, and only then hands that same asset
# to Hangar -- so the release is upstream of Hangar and cannot be behind it,
# and reading it needs no API token. Building from a checkout here would want a
# JDK and maven on a Pi and would produce an artifact nothing had tested.
say "checking FruitJuice"
FRUITJUICE_REPO="${FRUITJUICE_REPO:-jdeast/FruitJuice}"

FJ_JSON=$(curl -fsSL -H "User-Agent: $UA" \
    "https://api.github.com/repos/$FRUITJUICE_REPO/releases/latest") \
    || die "could not reach the GitHub release API for $FRUITJUICE_REPO"

FJ_TAG=$(printf %s "$FJ_JSON" | jq -r '.tag_name // empty')
# The asset carries its version in its name (FruitJuice-0.5.1.jar), so the tidy
# /releases/latest/download/NAME shortcut does not work -- the name moves with
# every release -- and the API has to be asked which asset it actually is.
FJ_ASSET='[.assets[] | select(.name | endswith(".jar"))]'
FJ_JAR=$(printf %s "$FJ_JSON" | jq -r "$FJ_ASSET | first | .name // empty")
FJ_URL=$(printf %s "$FJ_JSON" | jq -r "$FJ_ASSET | first | .browser_download_url // empty")

[ -n "$FJ_TAG" ] || die "the latest FruitJuice release has no tag"
[ -n "$FJ_JAR" ] || die "FruitJuice release $FJ_TAG has no jar attached"

FJ_WANT="${FJ_TAG#v}"
FJ_HAVE=$(ls "$LIB"/FruitJuice-*.jar 2>/dev/null \
          | sed "s|.*/FruitJuice-||; s|\.jar$||" | sort -V | tail -1 || true)
FJ_NEWEST=$(printf "%s\n%s\n" "$FJ_HAVE" "$FJ_WANT" | sort -V | tail -1)

# Never roll back over a hand-built jar. One built from master and put here by
# deploy-plugin.sh is newer than any release, and quietly replacing it would
# undo work that simply has not been tagged yet -- and the server would go on
# reporting a version that no longer matches what it is running.
if [ -n "$FJ_HAVE" ] && [ "$FJ_HAVE" != "$FJ_WANT" ] && [ "$FJ_NEWEST" = "$FJ_HAVE" ]; then
    say "  $FJ_HAVE is here and NEWER than release $FJ_WANT -- leaving it alone"
    say "  (a hand-built jar: tag and push it rather than rolling back)"
else
    if [ -f "$LIB/$FJ_JAR" ]; then
        say "  $FJ_JAR already present"
    else
        say "  downloading $FJ_JAR"
        fetch "$FJ_URL" "$LIB/$FJ_JAR"

        # plugin.yml is the number the server prints when it enables the
        # plugin, so a release whose jar disagrees with its own tag is worth
        # catching now rather than weeks later when somebody asks which
        # version is actually running. unzip is optional: everything else here
        # works without it, so a missing unzip loses the check, not the update.
        if command -v unzip >/dev/null; then
            FJ_BUILT=$(unzip -p "$LIB/$FJ_JAR" plugin.yml 2>/dev/null \
                       | sed -n "s/^version: *'\?\([^']*\)'\?/\1/p" | head -1)
            if [ "$FJ_BUILT" != "$FJ_WANT" ]; then
                rm -f "$LIB/$FJ_JAR"
                die "release $FJ_TAG holds a jar reporting ${FJ_BUILT:-no version}"
            fi
            say "  verified: plugin.yml says $FJ_BUILT"
        else
            say "  unzip not installed; skipping the version check inside the jar"
        fi
    fi
    link_all "$FJ_JAR" "fruitjuice.jar"
fi

say "done. Nothing was restarted -- run start-server.sh restart when ready."
