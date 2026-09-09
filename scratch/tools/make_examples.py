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
