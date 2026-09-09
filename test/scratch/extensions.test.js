// The two extensions ported from arpruss/rjmscratch, and the bugs they had.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// It loads each extension without its registration line and calls the methods
// directly, so it exercises the logic. It cannot press a button on a
// controller, and it deliberately does not reach the network, so `fetch data
// from` is untested here beyond its shape.
//
// It is worth having mostly for the four fixes below. Each was a real bug in
// working code that nobody noticed, because each fails quietly: a boolean that
// is always true, a rumble that throws where nothing catches, an axis that
// never settles, and a console filling at thirty frames a second.
//
// Run with: node test/scratch/extensions.test.js
"use strict";

const fs = require("fs");
const path = require("path");

const DOCS = path.join(__dirname, "..", "..", "docs");

let failures = 0;
function ok(name, cond, detail) {
    if (cond) {
        console.log("  ok   " + name);
    } else {
        failures++;
        console.log("  FAIL " + name + (detail ? "  -- " + detail : ""));
    }
}

// Load the classes without the trailing IIFE, which wants a Scratch runtime.
function load(file, className) {
    const src = fs.readFileSync(path.join(DOCS, file), "utf8");
    const cut = src.lastIndexOf("(function ()");
    if (cut < 0) throw new Error("no registration block in " + file);
    return eval(src.slice(0, cut) + "\n" + className);
}

// ── licence, because it came from somewhere ────────────────────────────────

["fetch.js", "gamepad.js"].forEach(function (f) {
    const src = fs.readFileSync(path.join(DOCS, f), "utf8");
    ok(f + " keeps the MIT notice and the attribution",
       /MIT License/.test(src) && /arpruss/.test(src) &&
       /Permission is hereby granted/.test(src));
});

// ── Fetch ──────────────────────────────────────────────────────────────────

const ScratchFetch = load("fetch.js", "ScratchFetch");
const f = new ScratchFetch();
const fetchInfo = f.getInfo();

ok("Fetch declares its two blocks",
   fetchInfo.blocks.map(function (b) { return b.opcode; }).join(" ") ===
   "fetchURL jsonExtract");
ok("Fetch has an id the projects can name", fetchInfo.id === "Fetch");

// The bug: the test read `typeof out`, which is the STRING "boolean" and
// therefore always truthy, so false reported 1 exactly like true.
ok("extracting false gives 0, not 1",
   f.jsonExtract({name: "a", data: '{"a":false}'}) === 0,
   String(f.jsonExtract({name: "a", data: '{"a":false}'})));
ok("extracting true gives 1", f.jsonExtract({name: "a", data: '{"a":true}'}) === 1);

ok("numbers come back as numbers",
   f.jsonExtract({name: "a", data: '{"a":12.3}'}) === 12.3);
ok("strings come back as strings",
   f.jsonExtract({name: "a", data: '{"a":"hi"}'}) === "hi");

// Nesting is the whole technique: an object comes back as JSON so the next
// extract block can go one level deeper.
ok("an object comes back as JSON to dig into",
   f.jsonExtract({name: "p", data: '{"p":{"t":5}}'}) === '{"t":5}');
ok("and that result can be extracted from",
   f.jsonExtract({name: "t", data: f.jsonExtract({name: "p", data: '{"p":{"t":5}}'})}) === 5);

// The bug: JSON.parse threw straight out of the block.
ok("bad JSON reports nothing rather than throwing",
   f.jsonExtract({name: "a", data: "not json at all"}) === "");
ok("a missing key reports nothing",
   f.jsonExtract({name: "z", data: '{"a":1}'}) === "");
ok("a JSON scalar is not treated as an object",
   f.jsonExtract({name: "a", data: "42"}) === "");

// ── Gamepad ────────────────────────────────────────────────────────────────

const ScratchGamepad = load("gamepad.js", "ScratchGamepad");
const g = new ScratchGamepad(null);
const padInfo = g.getInfo();

ok("Gamepad declares its five blocks",
   padInfo.blocks.map(function (b) { return b.opcode; }).join(" ") ===
   "buttonPressedReleased buttonDown axisMoved axisValue rumble");
ok("Gamepad has an id the projects can name", padInfo.id === "Gamepad");
ok("every gamepad block names a menu that exists", padInfo.blocks.every(
    function (b) {
        return Object.keys(b.arguments || {}).every(function (a) {
            const m = b.arguments[a].menu;
            return !m || Object.prototype.hasOwnProperty.call(padInfo.menus, m);
        });
    }));

// The bug: rumble read this.gamepads[i] inside the class that IS one gamepad,
// where neither exists. It threw a ReferenceError on every call.
let threw = null;
try {
    g.rumble({s: 1, w: 1, t: 0.1, i: 1});
} catch (e) {
    threw = e;
}
ok("rumble does not throw when there is no controller", threw === null,
   threw && threw.message);

// Reporters must report numbers, not false.
ok("an axis with no controller reports 0", g.axisValue({b: 1, i: 1}) === 0);
ok("a button with no controller is not down", g.buttonDown({b: 1, i: 1}) === false);
ok("a hat with no controller does not fire",
   g.buttonPressedReleased({b: 1, pr: 1, i: 1}) === false);
ok("axisMoved with no controller does not fire", g.axisMoved({b: 1, i: 1}) === false);

// Pads and buttons count from 1 in the blocks and from 0 in the browser.
ok("pad 1 is the browser's pad 0", g.pad(1).index === 0);
ok("pad 4 is the browser's pad 3", g.pad(4).index === 3);
ok("a silly pad number is clamped rather than crashing",
   g.pad(99).index === 3 && g.pad(0).index === 0 && g.pad(-5).index === 0);

// The bug: previousAxes was assigned to itself, so once an axis had moved the
// comparison never saw it settle and "axis moved" stayed true.
const src = fs.readFileSync(path.join(DOCS, "gamepad.js"), "utf8");
ok("previousAxes remembers the current axes, not itself",
   /this\.previousAxes\s*=\s*this\.currentAxes/.test(src) &&
   !/this\.previousAxes\s*=\s*this\.previousAxes/.test(src));

// The bug: two console.log calls, per pad, per frame, for ever. Comments are
// stripped first, or the note explaining the fix trips the check on the fix.
const padCode = src.replace(/^\s*\/\/.*$/gm, "");
ok("nothing logs to the console every frame", !/console\.log/.test(padCode));

console.log("");
if (failures) {
    console.log(failures + " failed");
    process.exit(1);
}
console.log("all passed");
