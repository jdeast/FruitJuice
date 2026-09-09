#!/usr/bin/env python3
"""Write the three sensor examples into scratch/examples.

    python scratch/tools/make_examples.py

These are the ones the todo argues for: things that happen in the room turning
into things that happen in the world, and in the piano's case the other way
round. None of them is turtle geometry, because Python does turtle geometry
just as well and Scratch has a microphone and Python does not.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sb3 import (Project, fj, menu, block, when_flag, forever, repeat, if_then,
                 if_else, wait, set_var, change_var, add, sub, mul, div, gt, lt,
                 equals, mathop, join, loudness, video_on, video_toggle,
                 play_note, set_instrument, item_of)


# getPlayerX/Y/Z take their mode from a dropdown, not as a plain number: 0 is
# the block you are standing in, 1 the exact position. A literal there renders
# as an empty menu and reports nothing at all.
def player_x():
    return fj("getPlayerX", mode=menu("modeMenu", 0))


def player_y():
    return fj("getPlayerY", mode=menu("modeMenu", 0))


def player_z():
    return fj("getPlayerZ", mode=menu("modeMenu", 0))

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "examples")

# NO ADDRESS IN AN EXAMPLE, EVER.
#
# Two reasons. Whoever writes an example is not whoever runs it, so a typed-in
# address means everyone who downloads it edits a block before anything
# happens. And the address would be somebody's actual home server, published
# in a public repository, which is nobody's idea of a good time.
#
# "connect to my Minecraft" uses whatever that browser last connected to, or
# localhost if it has never connected to anything. Set it once -- with the
# ordinary connect block, or with "remember ... as my Minecraft" -- and every
# example works from then on.
HOW_TO_SET_THE_SERVER = (
    "\n\nTHE SERVER: this connects to whatever this browser last connected to,"
    " or to localhost. To point it elsewhere, run the `remember ... as my"
    " Minecraft` block once, or connect once with the ordinary connect"
    " block -- a connection that works is remembered.")


FIRST_TIME = (
    "FIRST TIME ON THIS BROWSER, READ ME." + chr(10) + chr(10) +
    "This connects to localhost, because nothing has been remembered here"
    " yet." + chr(10) +
    "If your Minecraft is somewhere else, swap this block for" + chr(10) +
    "    connect to Minecraft on [address] port [port]" + chr(10) +
    "and run it once. A connection that works is remembered, so from then"
    " on" + chr(10) +
    "this block finds it and you never type the address again." + chr(10) +
    chr(10) +
    "The `my Minecraft address` block reports what is currently saved.")


def connect(message):
    return [fj("connectSaved").says(FIRST_TIME), fj("chat", msg=message)]


# ── 1. shout at it ─────────────────────────────────────────────────────────

def microphone_tower():
    """Loudness as a bar you can walk up to, with the peak left behind.

    The bar is redrawn every twentieth of a second, which is 25 blocks of
    column. As one setBlock each that is 500 messages a second and hopeless;
    as two `fill` blocks it is two. This example only works at all because
    the fill block exists.
    """
    p = Project(sprite_name="Shout")
    x0, y0, z0 = p.var("x0"), p.var("y0"), p.var("z0")
    h, peak = p.var("height"), p.var("peak")

    p.note("SHOUT AT IT.\n\n"
           "Loudness is a number from 0 to 100 and Scratch just knows it: no\n"
           "setup, no library. Here it is the height of a bar of blocks, "
           "redrawn\ntwenty times a second, with a red marker left behind at "
           "the loudest\nmoment so far.\n\n"
           "The bar is 25 blocks tall. Drawing it one block at a time would be "
           "500\nmessages a second; the `fill` block does the whole column in "
           "one, which\nis the only reason this keeps up.\n\n"
           "Try: change the 4 in `loudness / 4` to make it more or less "
           "sensitive.")

    p.script(
        when_flag(),
        *connect("Shout at it!"),
        # Stand the bar three blocks in front of wherever you are.
        set_var(x0, add(player_x(), 3)),
        set_var(y0, player_y()),
        set_var(z0, player_z()),
        set_var(peak, 0),
        forever(
            # Loudness is 0..100; a quarter of it is a bar 0..25 tall.
            set_var(h, mathop("floor", div(loudness(), 4))),
            fj("fill", x1=x0, y1=y0, z1=z0,
               x2=x0, y2=add(y0, 26), z2=z0, b=menu("blockMenu", "AIR")),
            if_then(gt(h, 0),
                    fj("fill", x1=x0, y1=y0, z1=z0,
                       x2=x0, y2=add(y0, h), z2=z0,
                       b=menu("blockMenu", "LIME_CONCRETE"))),
            if_then(gt(h, peak), set_var(peak, h)),
            # blockMenu, not commonMenu: the short menu is the handful a
            # beginner reaches for and has no coloured concrete on it.
            fj("setBlock", x=x0, y=add(y0, peak), z=z0,
               b=menu("blockMenu", "RED_CONCRETE")),
            wait(0.05),
        ),
    )
    return p, "microphone tower.sb3"


# ── 2. be the controller ───────────────────────────────────────────────────

def be_the_controller():
    """Wave, and the player walks that way -- relative to where they are looking.

    WAVING UP MEANS FORWARD, NOT NORTH

    The first version moved in world directions: up the screen was north, and
    it stayed north however the player was turned. So the same gesture walked
    you forwards or backwards depending on which way you happened to be facing,
    which is not a thing anybody can learn. Measured over 75 seconds of real
    use it travelled 40 blocks and ended up 6.6 blocks from where it started --
    effort went in and very little of it accumulated into going anywhere.

    Every game solves this the same way, and so does this now: the wave is read
    in SCREEN space -- how much toward the top, how much toward the right --
    and those are turned into world directions using the player's own facing.
    Up is forward. Right is right. Turn around and up is still forward.

    Bukkit's yaw is 0 south, 90 west, 180 north, 270 east, so the direction the
    player is looking is (-sin yaw, cos yaw) and their right hand points along
    (-cos yaw, -sin yaw). The two components are scaled by those and added.

    WHY THE RAW SENSOR NEEDS SMOOTHING AT ALL

    Scratch's video direction is one optical-flow vector for the whole camera
    frame, recomputed every frame with no smoothing. In video-motion.js:

        this.motionAmount = Math.round(100 * Math.hypot(uu, vv));
        if (this.motionAmount > 10) {
            this.motionDirection = scratchAtan2(vv, uu);
        }

    Below the threshold the direction is LATCHED, not zeroed: it keeps whatever
    it last was, so a reading taken in a quiet moment is a leftover.

    So each reading is split into components and those are smoothed. Averaging
    the ANGLE would not work: halfway between 350 and 10 degrees is 0, but the
    mean of those numbers is 180, the exact opposite way. Angles wrap; their
    components do not. Two opposite readings then cancel, which is what jitter
    should do, while a sustained wave adds up.

    The video never leaves the machine. Scratch compares one frame with the
    next in the browser and hands out two numbers.
    """
    p = Project(sprite_name="Controller").uses("videoSensing")
    p.stage["videoState"] = "on"
    p.stage["videoTransparency"] = 40
    m, d = p.var("motion"), p.var("direction")
    af, ar = p.var("wave forward"), p.var("wave right")
    sf, sr = p.var("smooth forward"), p.var("smooth right")
    speed, yaw = p.var("speed"), p.var("facing")

    # Ticked on from the start. The question a reader has here is "is the
    # sensor noisy or is my arithmetic wrong", and these answer it.
    p.watch(m, 5, 5)
    p.watch(d, 5, 32)
    p.watch(speed, 5, 59)
    p.watch(yaw, 5, 86)

    p.note("BE THE CONTROLLER." + chr(10) + chr(10) +
           "Wave at the camera and you walk. Up the screen is FORWARD, right "
           "is RIGHT --" + chr(10) +
           "relative to where you are looking, so turning turns your controls "
           "with you." + chr(10) + chr(10) +
           "IT SENSES MOTION, NOT YOU. There is no skeleton and no pose -- it "
           "knows" + chr(10) +
           "something moved and roughly which way. Waving works; holding a "
           "shape does" + chr(10) + "nothing." + chr(10) + chr(10) +
           "HOW TO READ THE FOUR NUMBERS" + chr(10) +
           "  motion    how much moved this frame, 0-100. Under 20 is ignored "
           "as noise." + chr(10) +
           "  direction which way it moved, -180 to 180, 0 up and 90 right. "
           "Hold still" + chr(10) +
           "            and watch it FREEZE rather than fall to zero: Scratch "
           "keeps the" + chr(10) +
           "            last direction it was sure about, so a reading taken "
           "during a" + chr(10) +
           "            quiet moment is left over from earlier." + chr(10) +
           "  speed     what is left after smoothing. This is the one that "
           "decides" + chr(10) +
           "            whether you move: under 0.55 nothing happens at all." +
           chr(10) +
           "  facing    which way you are looking, 0-360. 0 south, 90 west, "
           "180 north," + chr(10) +
           "            270 east. Turn on the spot and only this should "
           "change." + chr(10) + chr(10) +
           "So: motion and direction jump about, and that is the camera, not a "
           "bug." + chr(10) +
           "speed should rise smoothly while you wave and fall back when you "
           "stop." + chr(10) +
           "If speed never reaches 0.55, wave bigger or lower the 0.55." +
           chr(10) + chr(10) +
           "Try: 0.55 is the deadzone -- raise it if you drift, lower it if it "
           "ignores" + chr(10) +
           "you. 0.8 and 0.2 are how fast it forgets: 0.9 and 0.1 glide, 0.6 "
           "and 0.4" + chr(10) +
           "twitch." + chr(10) + chr(10) +
           "Those were measured, not guessed. Over four seconds: random "
           "directions every" + chr(10) +
           "tick drift 0.6 blocks, a real wave travels 23, and a wave from a "
           "standstill" + chr(10) +
           "gets you moving in about a third of a second." +
           HOW_TO_SET_THE_SERVER)

    p.script(
        when_flag(),
        *connect("Wave at the camera to walk. Up is forward."),
        video_toggle("on"),
        set_var(sf, 0),
        set_var(sr, 0),
        forever(
            set_var(m, video_on("motion", "Stage")),
            # Only trust the direction while something is actually moving.
            # Below Scratch's own threshold it is a stale reading, so aim at
            # nothing and let the average decay to a standstill.
            if_else(
                gt(m, 20),
                [set_var(d, video_on("direction", "Stage")),
                 # Scratch measures 0 up the screen and 90 to the right, so
                 # these are the wave split into "toward the top" and "toward
                 # the right". Still screen space: no world direction yet.
                 set_var(af, mathop("cos", d)),
                 set_var(ar, mathop("sin", d))],
                [set_var(af, 0),
                 set_var(ar, 0)]),

            # The running average. Keep 80% of what we had, take 20% of the
            # new reading. Opposite readings cancel; a steady wave accumulates.
            set_var(sf, add(mul(sf, 0.8), mul(af, 0.2))),
            set_var(sr, add(mul(sr, 0.8), mul(ar, 0.2))),
            set_var(speed, mathop("sqrt", add(mul(sf, sf), mul(sr, sr)))),

            # Below the deadzone, nothing at all. This is what stops the player
            # drifting on camera noise while the room is still.
            if_then(
                gt(speed, 0.55),
                # NOW turn it into world directions, using the player's own
                # facing. Bukkit yaw: 0 south, 90 west, 180 north, 270 east.
                # Looking along (-sin yaw, cos yaw); right hand along
                # (-cos yaw, -sin yaw). Forward and right are scaled by those
                # and added, which is the whole difference between "up means
                # north" and "up means the way I am pointed".
                set_var(yaw, fj("getRotation")),
                fj("movePlayer",
                   dx=mul(add(mul(sf, mathop("sin", yaw)),
                              mul(sr, mathop("cos", yaw))), -0.7),
                   dy=0,
                   dz=mul(sub(mul(sf, mathop("cos", yaw)),
                              mul(sr, mathop("sin", yaw))), 0.7)),
            ),
            wait(0.1),
        ),
    )
    return p, "be the controller.sb3"


# ── 3. the piano ───────────────────────────────────────────────────────────

def piano():
    """An octave, one block per key, that you can pick out a tune on.

    ONE BLOCK PER KEY. Eight of them, and that is the whole width. Two-wide
    keys let a black key sit between two whites the way a real one does, but
    sixteen blocks is too far to walk to play a tune, and being able to reach
    the next note matters more than being anatomically correct.

    So the black keys go where they can: on the BACK of the white keys they
    follow, raised a block. C and D get one, E does not, F, G and A get one, B
    and the top C do not. That two-then-three grouping is the thing a player
    actually navigates by -- it is how you find middle C without looking -- and
    it survives at one block per key even though the between-ness does not.

    It also makes the note arithmetic disappear. A black key is a semitone
    above the white one it sits on, so there is no second table: the note is
    the white note plus one if you hit the raised block.

    LOW ON THE LEFT. Pitch rises as x DECREASES, which is backwards as a
    number and right as a piano: standing where the sign is readable, the low
    notes are on your left, the way they are on every keyboard ever built.
    """
    p = Project(sprite_name="Piano").uses("music")
    x0, y0, z0 = p.var("x0"), p.var("y0"), p.var("z0")
    i, hit = p.var("i"), p.var("hit")
    off, semi = p.var("key"), p.var("semitone")

    # Semitones above the root for the eight white keys of an octave.
    whitenote = p.list("white notes", [0, 2, 4, 5, 7, 9, 11, 12])
    # Which white keys carry a black one: C, D, then F, G, A. Counting from
    # the low end at zero, so E, B and the top C are the ones left out.
    blackpos = p.list("black keys on", [0, 1, 3, 4, 5])
    names = p.list("note names",
                   ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A",
                    "A#", "B", "C"])

    p.note("A PIANO YOU STAND AT." + chr(10) + chr(10) +
           "Green flag builds an octave in front of you. Hit a key with a "
           "sword and" + chr(10) +
           "Scratch plays the note and shows its name on screen." + chr(10) +
           chr(10) +
           "ONE BLOCK PER KEY, eight of them, low on the left. The black keys "
           "sit on" + chr(10) +
           "the BACK of the keys they belong to, raised a block: two of them, "
           "a gap," + chr(10) +
           "then three, a gap. That grouping is how you find your way around "
           "a real" + chr(10) +
           "keyboard without looking, and it is the part worth keeping." +
           chr(10) + chr(10) +
           "THE SWORD MATTERS. The server only counts a hit when you are "
           "holding a" + chr(10) +
           "sword -- any sword, netherite included. Left or right click is "
           "set by" + chr(10) +
           "`hitclick` in the server's config.yml; LEFT is the default." +
           chr(10) + chr(10) +
           "This is the interesting direction: Minecraft is the INPUT and "
           "Scratch is" + chr(10) +
           "the output. `sword hit vector position` gives the block you hit "
           "as" + chr(10) +
           "\"x,y,z\". The x says which key. The y says whether you got the "
           "raised" + chr(10) +
           "black one -- and a black key is just a semitone above the white "
           "one it" + chr(10) +
           "sits on, so that is the entire difference: add 1." + chr(10) +
           chr(10) +
           "Try: change 60 to move the whole keyboard an octave. 60 is middle "
           "C. Or" + chr(10) +
           "change the instrument -- 1 is a piano, 11 a wooden flute, 13 a "
           "marimba." + HOW_TO_SET_THE_SERVER)

    # Key 0 is the LOW one and sits at the HIGH x, so that pitch runs left to
    # right for somebody standing on the near side reading the sign.
    def at(key):
        return sub(add(x0, 7), key)

    p.script(
        when_flag(),
        *connect("Hit the keys with a sword. Low note on the left."),
        set_instrument(1),
        set_var(x0, add(player_x(), 2)),
        set_var(y0, player_y()),
        set_var(z0, add(player_z(), 2)),

        # The white keys are one fill: eight wide, three deep, flat on the
        # ground. Twenty-four setBlocks would do the same thing twenty-four
        # times as slowly.
        fj("fill", x1=x0, y1=y0, z1=z0,
           x2=add(x0, 7), y2=y0, z2=add(z0, 2),
           b=menu("blockMenu", "WHITE_CONCRETE")),

        # Five black keys, standing proud on the back row.
        set_var(i, 1),
        repeat(5,
               fj("setBlock", x=at(item_of(i, blackpos)), y=add(y0, 1),
                  z=add(z0, 2), b=menu("blockMenu", "BLACK_CONCRETE")),
               change_var(i, 1)),

        fj("sign", x=at(-1), y=add(y0, 1), z=z0, dir=menu("signMenu", "NORTH"),
           l1="an octave", l2="low on the left", l3="hit with a sword", l4=""),

        forever(
            set_var(hit, fj("getHit")),
            if_then(
                block("operator_not", OPERAND=equals(hit, "")),
                # Which key, counting from the low end.
                set_var(off, sub(add(x0, 7),
                                 fj("extractFromVector", vector=hit,
                                    coordinate=menu("coordinateMenu", 0)))),
                if_then(
                    block("operator_and",
                          OPERAND1=block("operator_not", OPERAND=lt(off, 0)),
                          OPERAND2=lt(off, 8)),
                    set_var(semi, item_of(add(off, 1), whitenote)),
                    # The raised block is the black key, a semitone above the
                    # white one it stands on.
                    if_then(
                        equals(sub(fj("extractFromVector", vector=hit,
                                      coordinate=menu("coordinateMenu", 1)),
                                   y0), 1),
                        change_var(semi, 1)),
                    play_note(add(60, semi), 0.25),
                    fj("showTitle", title=item_of(add(semi, 1), names),
                       sub="", stay=20),
                ),
            ),
            wait(0.05),
        ),
    )
    return p, "piano.sb3"


def main(check_only=False):
    """Write the projects, or with --check say whether they are current.

    --check compares the project.json inside each file, not the zip bytes. Zip
    encoding varies with the platform and the zlib build and none of that says
    anything about whether the blocks changed; the block graph is the thing
    worth holding still.
    """
    import json
    import zipfile

    stale = []
    for fn in (microphone_tower, be_the_controller, piano):
        p, name = fn()
        target = os.path.join(OUT, name)
        built = p.build()
        blocks = len(built["targets"][1]["blocks"])
        if check_only:
            fresh = json.dumps(built, sort_keys=True)
            try:
                with zipfile.ZipFile(target) as z:
                    have = json.dumps(json.loads(z.read("project.json")),
                                      sort_keys=True)
            except Exception:
                have = None
            same = have == fresh
            if not same:
                stale.append(name)
            print("%-26s %3d blocks  %s"
                  % (name, blocks, "up to date" if same else "STALE"))
        else:
            path = p.save(target)
            print("wrote %-26s %3d blocks, %d bytes"
                  % (name, blocks, os.path.getsize(path)))

    if check_only and stale:
        print("")
        print("These differ from make_examples.py: " + ", ".join(stale))
        print("Run: python scratch/tools/make_examples.py")
        raise SystemExit(1)


if __name__ == "__main__":
    main(check_only="--check" in sys.argv)
