#!/usr/bin/env python3
"""Write Scratch .sb3 projects from Python.

An .sb3 is a zip holding project.json plus the costumes and sounds it uses, and
project.json is a graph of blocks keyed by id. That is perfectly writable by a
program, and worth doing, because the alternative is dragging two hundred
blocks with a mouse and then never being able to see what changed in a diff.

    p = Project()
    n = p.var("height")
    p.script(fj("connect_p", ip="localhost", port="14711"),
             fj("chat", msg="hello"),
             forever(set_var(n, add(n, 1))))
    p.save("mine.sb3")

WHAT IT DOES NOT DO

It does not validate against Scratch. A project that loads here may still be
refused by the editor, and the only real test is opening it. What it does
guarantee is that every id referenced exists, every parent/next pair agrees
with the other direction, and every variable used is declared -- which is most
of what actually goes wrong, and all of it is checked in check() before saving.

The assets come from a template project, because a costume is a file with a
hash for a name and there is no point inventing one.
"""
import io
import json
import os
import shutil
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "examples", "Hello world.sb3")

# Scratch's input value types. The number only decides how the editor draws the
# little white box; anything numeric works where a number is expected.
NUMBER, POSITIVE_INT, STRING, VARIABLE = 4, 6, 10, 12


class Var(object):
    """A project variable. Holds its own id so blocks can point at it."""

    def __init__(self, name, value=0):
        self.name = name
        self.value = value
        self.id = "var-" + name


class Menu(object):
    """A dropdown. In sb3 these are real blocks, marked as shadows."""

    def __init__(self, opcode, field, value):
        self.opcode = opcode
        self.field = field
        self.value = value


class Lst(object):
    """A project list. Scratch stores these beside the variables."""

    def __init__(self, name, items=None):
        self.name = name
        self.items = list(items or [])
        self.id = "list-" + name


class Obscured(object):
    """A reporter dropped into an input that already had a shadow.

    Scratch keeps the shadow underneath so the value comes back when the
    reporter is pulled out again, which is why the input holds two ids. A note
    input is the case that forces this: the little piano keyboard is a shadow
    block of its own, and dropping a calculation on top has to keep it.
    """

    def __init__(self, reporter, shadow):
        self.reporter = reporter
        self.shadow = shadow


class Block(object):
    def __init__(self, opcode, inputs=None, fields=None):
        self.opcode = opcode
        self.inputs = inputs or {}
        self.fields = fields or {}


def block(opcode, **inputs):
    return Block(opcode, inputs)


def fj(opcode, **inputs):
    """A FruitJuice block. The extension prefixes every opcode with its id."""
    return Block("FruitJuice_" + opcode, inputs)


def menu(name, value):
    """A FruitJuice dropdown, e.g. menu("commonMenu", "STONE").

    The value is the one the menu carries, not the label it shows: uppercase
    Minecraft names like STONE and LIME_CONCRETE, which is what resolveBlock
    on the other side expects.
    """
    return Menu("FruitJuice_menu_" + name, name, value)


def note(value):
    """The note picker. ArgumentType.NOTE is its own shadow block."""
    return Menu("math_note", "NOTE", value)


def instrument(value):
    return Menu("music_menu_INSTRUMENT", "INSTRUMENT", value)


def item_of(index, lst):
    return Block("data_itemoflist", {"INDEX": index},
                 {"LIST": [lst.name, lst.id]})


# ── the handful of core blocks these examples need ─────────────────────────

def when_flag():
    return Block("event_whenflagclicked")


def forever(*body):
    return Block("control_forever", {"SUBSTACK": list(body)})


def repeat(times, *body):
    return Block("control_repeat", {"TIMES": times, "SUBSTACK": list(body)})


def if_then(cond, *body):
    return Block("control_if", {"CONDITION": cond, "SUBSTACK": list(body)})


def if_else(cond, then, otherwise):
    return Block("control_if_else", {"CONDITION": cond,
                                     "SUBSTACK": list(then),
                                     "SUBSTACK2": list(otherwise)})


def wait(secs):
    return Block("control_wait", {"DURATION": secs})


def set_var(var, value):
    return Block("data_setvariableto", {"VALUE": value},
                 {"VARIABLE": [var.name, var.id]})


def change_var(var, value):
    return Block("data_changevariableby", {"VALUE": value},
                 {"VARIABLE": [var.name, var.id]})


def add(a, b):
    return Block("operator_add", {"NUM1": a, "NUM2": b})


def sub(a, b):
    return Block("operator_subtract", {"NUM1": a, "NUM2": b})


def mul(a, b):
    return Block("operator_multiply", {"NUM1": a, "NUM2": b})


def div(a, b):
    return Block("operator_divide", {"NUM1": a, "NUM2": b})


def gt(a, b):
    return Block("operator_gt", {"OPERAND1": a, "OPERAND2": b})


def lt(a, b):
    return Block("operator_lt", {"OPERAND1": a, "OPERAND2": b})


def equals(a, b):
    return Block("operator_equals", {"OPERAND1": a, "OPERAND2": b})


def mathop(op, n):
    return Block("operator_mathop", {"NUM": n}, {"OPERATOR": [op, None]})


def join(a, b):
    return Block("operator_join", {"STRING1": a, "STRING2": b})


def loudness():
    return Block("sensing_loudness")


def video_on(attribute="motion", subject="Stage"):
    return Block("videoSensing_videoOn",
                 {"ATTRIBUTE": Menu("videoSensing_menu_ATTRIBUTE",
                                    "ATTRIBUTE", attribute),
                  "SUBJECT": Menu("videoSensing_menu_SUBJECT",
                                  "SUBJECT", subject)})


def video_toggle(state="on"):
    return Block("videoSensing_videoToggle",
                 {"VIDEO_STATE": Menu("videoSensing_menu_VIDEO_STATE",
                                      "VIDEO_STATE", state)})


def play_note(pitch, beats):
    """pitch may be a number or a reporter; either way the shadow stays."""
    if isinstance(pitch, (int, float)):
        return Block("music_playNoteForBeats",
                     {"NOTE": note(pitch), "BEATS": beats})
    return Block("music_playNoteForBeats",
                 {"NOTE": Obscured(pitch, note(60)), "BEATS": beats})


def set_instrument(n):
    return Block("music_setInstrument", {"INSTRUMENT": instrument(n)})


# ── the project ────────────────────────────────────────────────────────────

class Project(object):
    def __init__(self, template=TEMPLATE, sprite_name="Sprite1"):
        self.template = os.path.abspath(template)
        with zipfile.ZipFile(self.template) as z:
            self.assets = [n for n in z.namelist() if n != "project.json"]
            base = json.loads(z.read("project.json").decode("utf-8"))
        self.stage = [t for t in base["targets"] if t["isStage"]][0]
        self.sprite = [t for t in base["targets"] if not t["isStage"]][0]
        self.sprite["name"] = sprite_name
        # Start from a clean slate: the template is only here for its costumes.
        for t in (self.stage, self.sprite):
            t["blocks"] = {}
            t["variables"] = {}
            t["lists"] = {}
            t["comments"] = {}
        self.vars = []
        self.lists = []
        self.scripts = []
        self.extensions = ["FruitJuice"]
        self.notes = []

    def var(self, name, value=0):
        v = Var(name, value)
        self.vars.append(v)
        return v

    def list(self, name, items=None):
        l = Lst(name, items)
        self.lists.append(l)
        return l

    def uses(self, *extensions):
        for e in extensions:
            if e not in self.extensions:
                self.extensions.append(e)
        return self

    def note(self, text, x=-40, y=-40):
        """A comment in the project, which is where a child will read it."""
        self.notes.append((text, x, y))
        return self

    def script(self, *blocks, **kw):
        self.scripts.append((kw.get("x", 40), kw.get("y", 40), list(blocks)))
        return self

    # -- serialising ------------------------------------------------------

    def _literal(self, value):
        """A plain value, as the [type, text] pair sb3 wants."""
        if isinstance(value, bool):
            return [STRING, "1" if value else ""]
        if isinstance(value, (int, float)):
            return [NUMBER, str(value)]
        return [STRING, str(value)]

    def _emit(self, blk, parent, out, counter):
        counter[0] += 1
        bid = "b%d" % counter[0]
        entry = {"opcode": blk.opcode, "next": None, "parent": parent,
                 "inputs": {}, "fields": {}, "shadow": False, "topLevel": False}
        out[bid] = entry

        for name, value in blk.fields.items():
            entry["fields"][name] = value

        for name, value in blk.inputs.items():
            if isinstance(value, list):                      # a substack
                if not value:
                    continue
                first = self._emit_stack(value, bid, out, counter)
                entry["inputs"][name] = [2, first]
            elif isinstance(value, Menu):
                entry["inputs"][name] = [1, self._shadow(value, bid, out, counter)]
            elif isinstance(value, Obscured):
                shadow = self._shadow(value.shadow, bid, out, counter)
                top = self._emit(value.reporter, bid, out, counter)
                entry["inputs"][name] = [3, top, shadow]
            elif isinstance(value, Var):
                entry["inputs"][name] = [3, [VARIABLE, value.name, value.id],
                                         [NUMBER, ""]]
            elif isinstance(value, Block):
                sub_id = self._emit(value, bid, out, counter)
                entry["inputs"][name] = [3, sub_id, [NUMBER, ""]]
            else:
                entry["inputs"][name] = [1, self._literal(value)]
        return bid

    def _shadow(self, m, parent, out, counter):
        counter[0] += 1
        sid = "b%d" % counter[0]
        out[sid] = {"opcode": m.opcode, "next": None, "parent": parent,
                    "inputs": {}, "fields": {m.field: [m.value, None]},
                    "shadow": True, "topLevel": False}
        return sid

    def _emit_stack(self, blocks, parent, out, counter):
        first = None
        prev = None
        for blk in blocks:
            bid = self._emit(blk, prev if prev else parent, out, counter)
            if prev:
                out[prev]["next"] = bid
            else:
                first = bid
            prev = bid
        return first

    def build(self):
        out = {}
        counter = [0]
        for x, y, blocks in self.scripts:
            first = self._emit_stack(blocks, None, out, counter)
            if first:
                out[first]["topLevel"] = True
                out[first]["x"] = x
                out[first]["y"] = y
                out[first]["parent"] = None
        self.sprite["blocks"] = out
        self.sprite["variables"] = dict(
            (v.id, [v.name, v.value]) for v in self.vars)
        self.sprite["lists"] = dict(
            (l.id, [l.name, l.items]) for l in self.lists)
        self.sprite["comments"] = dict(
            ("c%d" % i, {"blockId": None, "x": x, "y": y, "width": 380,
                         "height": 190, "minimized": False, "text": text})
            for i, (text, x, y) in enumerate(self.notes))
        return {
            "targets": [self.stage, self.sprite],
            "monitors": [],
            "extensions": self.extensions,
            "meta": {"semver": "3.0.0", "vm": "0.2.0",
                     "agent": "FruitJuice scratch/tools/sb3.py"},
        }

    def check(self, project):
        """The mistakes a generator actually makes, before anyone opens it."""
        blocks = project["targets"][1]["blocks"]
        declared = set(project["targets"][1]["variables"])
        lists = set(project["targets"][1]["lists"])
        problems = []

        for bid, b in blocks.items():
            if b["parent"] and b["parent"] not in blocks:
                problems.append("%s: parent %s missing" % (bid, b["parent"]))
            if b["next"] and b["next"] not in blocks:
                problems.append("%s: next %s missing" % (bid, b["next"]))
            if b["next"] and blocks[b["next"]]["parent"] != bid:
                problems.append("%s: next disagrees about its parent" % bid)
            for name, inp in b["inputs"].items():
                for part in inp[1:]:
                    if isinstance(part, str) and part not in blocks:
                        problems.append("%s.%s: input block %s missing"
                                        % (bid, name, part))
                    if isinstance(part, list) and part[0] == VARIABLE \
                            and part[2] not in declared:
                        problems.append("%s.%s: undeclared variable %s"
                                        % (bid, name, part[1]))
            for name, f in b["fields"].items():
                if name == "VARIABLE" and f[1] not in declared:
                    problems.append("%s: undeclared variable %s" % (bid, f[0]))
                if name == "LIST" and f[1] not in lists:
                    problems.append("%s: undeclared list %s" % (bid, f[0]))

            # A menu input must point at a shadow, or the editor draws an
            # empty dropdown and says nothing about why.
            if b["opcode"].endswith("_menu_INSTRUMENT") or "_menu_" in b["opcode"]:
                if not b["shadow"]:
                    problems.append("%s: menu block is not marked as a shadow" % bid)

        tops = [b for b in blocks.values() if b["topLevel"]]
        if not tops:
            problems.append("no top level block, so nothing can ever run")
        return problems

    def save(self, path):
        project = self.build()
        problems = self.check(project)
        if problems:
            raise ValueError("project is malformed:\n  " + "\n  ".join(problems))
        path = os.path.abspath(path)
        with zipfile.ZipFile(self.template) as src:
            with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as out:
                self._write(out, "project.json",
                            json.dumps(project, sort_keys=True).encode("utf-8"))
                for name in self.assets:
                    self._write(out, name, src.read(name))
        return path

    @staticmethod
    def _write(out, name, data):
        """Write one entry with a fixed timestamp.

        zipfile stamps the current time by default, so generating the same
        project twice gives two different files and nothing downstream can tell
        a real change from having been run again. CI regenerates these and
        diffs them against what is committed, which only means anything if the
        bytes are a function of the input alone.
        """
        info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o600 << 16
        # ZipInfo takes this from the platform -- 0 on Windows, 3 elsewhere --
        # so the same project written on a laptop and in CI differs by one byte
        # per entry at identical length, which is a maddening way to find out
        # that "reproducible" meant "on this machine".
        info.create_system = 0
        out.writestr(info, data)
