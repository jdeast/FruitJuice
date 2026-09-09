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


def connect(message):
    return [fj("connectSaved"), fj("chat", msg=message)]


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
    """Wave, and the player walks that way.

    Video sensing gives two numbers: how much motion, and which way it went.
    Direction is Scratch's convention -- 0 is up the screen, 90 is right -- so
    up becomes north, which is -Z in Minecraft, and right becomes east, +X.

    It senses MOTION, not where your hands are. There is no skeleton here and
    no pose: it knows something moved and roughly which way. Waving works;
    holding still in a shape does nothing at all.

    The video never leaves the machine. Scratch compares one frame with the
    next inside the browser and hands out a number.
    """
    p = Project(sprite_name="Controller").uses("videoSensing")
    p.stage["videoState"] = "on"
    p.stage["videoTransparency"] = 40
    m, d = p.var("motion"), p.var("direction")
    dx, dz = p.var("dx"), p.var("dz")

    p.note("BE THE CONTROLLER.\n\n"
           "Wave at the camera and you walk that way. Up the screen is north,\n"
           "right is east.\n\n"
           "Two numbers do all of it: how much motion there was, and which way\n"
           "it went. Scratch measures direction as 0 up, 90 right, so turning "
           "it\ninto Minecraft's axes is one sine and one cosine.\n\n"
           "IT SENSES MOTION, NOT YOU. There is no skeleton and no pose -- it "
           "knows\nsomething moved and roughly which way. Waving works; holding "
           "a shape\ndoes nothing.\n\n"
           "The video stays on this machine. Scratch compares one frame with "
           "the\nnext in the browser and hands out a number; nothing is sent "
           "anywhere.\n\n"
           "Try: raise the 25 if it twitches, lower it if it ignores you." + HOW_TO_SET_THE_SERVER)

    p.script(
        when_flag(),
        *connect("Wave at the camera to walk."),
        video_toggle("on"),
        forever(
            set_var(m, video_on("motion", "Stage")),
            if_then(
                gt(m, 25),
                set_var(d, video_on("direction", "Stage")),
                # Scratch: 0 up, 90 right. Minecraft: +X east, +Z south.
                # So east is sin(d) and north -- which is -Z -- is cos(d).
                set_var(dx, mathop("sin", d)),
                set_var(dz, mul(mathop("cos", d), -1)),
                fj("movePlayer", dx=dx, dy=0, dz=dz),
            ),
            wait(0.1),
        ),
    )
    return p, "be the controller.sb3"


# ── 3. the piano ───────────────────────────────────────────────────────────

def piano():
    """Eight blocks in a row. Hit one and Scratch plays the note.

    This is the relationship the other way round: Minecraft is the input and
    Scratch is the output. `sword hit vector position` reports the block the
    player last right-clicked with a sword, as "x,y,z", and the x tells you
    which key it was.

    Nothing here needs the server to do anything it could not already do in
    2013 -- the hit queue is inherited from RaspberryJuice. The block was in
    scratch.js all along, commented out, because it threw an error every time
    a hit arrived.
    """
    p = Project(sprite_name="Piano").uses("music")
    x0, y0, z0 = p.var("x0"), p.var("y0"), p.var("z0")
    i, hit, key = p.var("i"), p.var("hit"), p.var("key")
    # A major scale in semitones above the root. Not a string of digits: 11
    # and 12 are two characters each, so "letter 7 of ..." cannot say them.
    scale = p.list("scale", [0, 2, 4, 5, 7, 9, 11, 12])

    p.note("A PIANO YOU STAND ON.\n\n"
           "Green flag builds eight keys in front of you. Hit one with a "
           "sword\n(right click) and Scratch plays the note.\n\n"
           "This is the interesting direction: Minecraft is the INPUT and "
           "Scratch\nis the output. `sword hit vector position` gives the "
           "block you hit as\n\"x,y,z\", and the x says which key it was.\n\n"
           "Try: change 60 to move the whole keyboard up or down an octave. "
           "60 is\nmiddle C. Or change the instrument -- 1 is a piano, 11 is "
           "a wooden\nflute, 13 is a marimba.\n\n"
           "The `scale` list holds 0 2 4 5 7 9 11 12 -- the gaps between the "
           "white\nkeys of a real octave in semitones. That is why this "
           "sounds like a\nscale and not like eight steps up a chromatic "
           "ladder. Change the list\nto 0 2 3 5 7 8 10 12 for a minor one.")

    p.script(
        when_flag(),
        *connect("Hit the blocks with a sword."),
        set_instrument(1),
        set_var(x0, add(player_x(), 2)),
        set_var(y0, player_y()),
        set_var(z0, add(player_z(), 2)),
        # Lay out eight keys running east.
        set_var(i, 0),
        repeat(8,
               fj("setBlock", x=add(x0, i), y=y0, z=z0,
                  b=menu("blockMenu", "WHITE_CONCRETE")),
               change_var(i, 1)),
        fj("sign", x=sub(x0, 1), y=add(y0, 1), z=z0, dir="NORTH",
           l1="hit these", l2="with a sword", l3="", l4=""),
        forever(
            set_var(hit, fj("getHit")),
            if_then(
                block("operator_not", OPERAND=equals(hit, "")),
                # x of the block hit, minus where the keyboard starts.
                set_var(key, sub(fj("extractFromVector", vector=hit,
                                    coordinate=menu("coordinateMenu", 0)), x0)),
                if_then(
                    block("operator_and",
                          OPERAND1=block("operator_not", OPERAND=lt(key, 0)),
                          OPERAND2=lt(key, 8)),
                    # A major scale: the white notes, not eight semitones.
                    play_note(add(60, item_of(add(key, 1), scale)), 0.25),
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
