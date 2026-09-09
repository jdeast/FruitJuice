// The shape of the block palette: every block reaches a method, every menu it
// names exists, and every wire command it sends is one the server answers.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// Nothing here talks to a server or to Scratch. It checks that the extension is
// internally consistent and that it only asks the server for things the Java
// actually implements, by reading the command names out of the plugin source.
// It cannot prove that any block does the right thing when a child clicks it.
//
// It is still worth having, because every failure it catches is silent in the
// editor. A block whose "menu" names a menu that does not exist renders as an
// empty dropdown with no error anywhere; a block whose opcode has no method
// does nothing at all when clicked; and a command the server removed comes back
// as "Fail, not supported" in a console the child never opens. All three have
// happened here: the fill and sign blocks were first written against menus
// called "blocks" and "compass", neither of which was a thing.
//
// Run with: node test/scratch/blocks.test.js
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const SCRATCH_JS = path.join(ROOT, "docs", "scratch.js");
const CMD_DIR = path.join(ROOT, "src", "main", "java", "fruitjuice", "cmd");
const src = fs.readFileSync(SCRATCH_JS, "utf8");

let failures = 0;
function ok(name, cond, detail) {
    if (cond) {
        console.log("  ok   " + name);
    } else {
        failures++;
        console.log("  FAIL " + name + (detail ? "  -- " + detail : ""));
    }
}

function all(re, s, group) {
    const out = [];
    let m;
    const r = new RegExp(re.source, re.flags.indexOf("g") < 0 ? re.flags + "g" : re.flags);
    while ((m = r.exec(s)) !== null) out.push(m[group === undefined ? 1 : group]);
    return out;
}

// ── every block reaches a method ───────────────────────────────────────────

// Comments first. A block definition inside /* */ is not in the palette, and
// counting it means the checks below cheerfully confirm that a block nobody
// can reach has an implementation -- which is exactly what happened to getHit.
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

const opcodes = all(/"opcode":\s*"(\w+)"/, code);
const methods = all(/^ {4}(\w+)\s*\([^)]*\)\s*\{/m, src);
const methodSet = new Set(methods);
const orphans = opcodes.filter(function (o) { return !methodSet.has(o); });

ok("every block has an implementation", orphans.length === 0, orphans.join(" "));
// The palette is smaller than the file looks: six block comments hide
// eighteen definitions, including saveTurtle, restoreTurtle, suspend, resume,
// haveBlock, onBlock and movePlayerTop. Only the live ones count.
ok("there are blocks at all", opcodes.length >= 35, String(opcodes.length));

// Everything a block claims must be reachable, so no new block may be added
// inside one of those comments -- which is exactly what happened when these
// eleven were first anchored on "suspend", a block that is itself commented
// out. All eleven went into the palette's dead zone and none of them appeared.
["fill", "sign", "explode", "removeEntity", "pointPlayer", "worldList",
 "currentWorld", "switchWorld", "setHealth", "setFood", "showTitle", "getHit"
].forEach(function (o) {
    ok("the " + o + " block is live, not commented out", opcodes.indexOf(o) >= 0);
});

// ── every menu a block names is defined ────────────────────────────────────

const menusUsed = new Set(all(/"menu":\s*"(\w+)"/, src));
const menusDefined = new Set(all(/^\s*(\w+Menu)\s*:\s*[[{]/m, src));
const undefinedMenus = Array.from(menusUsed).filter(function (m) {
    return !menusDefined.has(m);
});
ok("every menu a block names exists", undefinedMenus.length === 0,
   undefinedMenus.join(" "));

// A sign can only face sideways: BlockFace.UP throws inside Bukkit's
// Rotatable.setRotation, so the sign block must not offer up or down.
const signMenu = /signMenu\s*:\s*\[([\s\S]*?)\]/.exec(src);
ok("the sign menu exists", signMenu !== null);
if (signMenu) {
    const values = all(/value:\s*"(\w+)"/, signMenu[1]);
    ok("the sign menu is horizontal only",
       values.length === 4 && values.indexOf("UP") < 0 && values.indexOf("DOWN") < 0,
       values.join(" "));
}

// ── every command it sends is one the server implements ────────────────────

const serverCommands = new Set();
["CmdWorld", "CmdPlayer", "CmdEntity", "CmdEvent"].forEach(function (f) {
    const p = path.join(CMD_DIR, f + ".java");
    if (!fs.existsSync(p)) return;
    const java = fs.readFileSync(p, "utf8");
    const prefix = /preFix\s*=\s*"(\w+\.)"/.exec(java);
    if (!prefix) return;
    // Some are dotted: events.block.hits is command.equals("block.hits").
    all(/command\.equals\("([\w.]+)"\)/, java).forEach(function (c) {
        serverCommands.add(prefix[1] + c);
    });
});

ok("the plugin sources were found", serverCommands.size > 20,
   String(serverCommands.size));

// Only look at live code: a commented out call is a decision, not a bug.
const live = src.split("\n").filter(function (l) {
    return l.trim().indexOf("//") !== 0;
}).join("\n");

const sent = new Set(all(/"((?:world|player|entity|events)\.[\w.]+)\(/, live));
const unknown = Array.from(sent).filter(function (c) {
    return !serverCommands.has(c);
});
ok("every command it sends is one the server implements", unknown.length === 0,
   unknown.join(" "));

// getBlockWithData was removed from the plugin in 2019 and the calls to it here
// were commented out rather than deleted. If one is ever uncommented, the line
// above catches it; this says why in the output.
ok("nothing live calls the removed getBlockWithData",
   live.indexOf("world.getBlockWithData") < 0);

// ── the ones that were missing, and the reason they mattered ───────────────

const wanted = {
    "world.setBlocks": "fill a cuboid in one command instead of one per block",
    "world.setSign": "label a build",
    "world.createExplosion": "explosions",
    "world.getWorlds": "list the worlds",
    "world.setWorld": "switch world",
    "world.getCurrentWorld": "report the world",
    "entity.remove": "take an entity away again",
    "player.setDirection": "aim the camera",
    "player.setHealth": "health",
    "player.setFoodLevel": "food",
    "player.sendTitle": "titles on screen",
    "events.block.hits": "find out what the player hit",
};
Object.keys(wanted).forEach(function (c) {
    ok("sends " + c + " (" + wanted[c] + ")", sent.has(c));
});

// No block definition may be commented out.
//
// Eighteen of them were, across six /* */ regions, and every one was a
// decision nobody wrote down. At least one -- getHit -- was hidden because it
// threw rather than because it was unwanted, and stayed hidden for years. A
// commented out block is worse than a missing one: the next person to read
// the file believes it exists, and eleven new blocks were once anchored on
// one of them and vanished into the same comment.
//
// If a block should not be in the palette, delete it and say why in the commit.
const commentedBlocks = [];
(src.match(/\/\*[\s\S]*?\*\//g) || []).forEach(function (c) {
    all(/"opcode":\s*"(\w+)"/, c).forEach(function (o) { commentedBlocks.push(o); });
});
ok("no block definition is commented out", commentedBlocks.length === 0,
   commentedBlocks.join(" "));

// The seven brought back, and the reason each was worth it.
const revived = {
    haveBlock: "ask what block is at a place",
    onBlock: "ask what you are standing on",
    movePlayerTop: "jump to the surface",
    saveTurtle: "remember where the turtle was",
    restoreTurtle: "put it back -- undo",
    suspend: "hold the drawing",
    resume: "and send it",
};
Object.keys(revived).forEach(function (o) {
    ok("the " + o + " block is live (" + revived[o] + ")", opcodes.indexOf(o) >= 0);
});

// getHeight is getHighestBlockYAt: the y of the highest block that is NOT air.
// Standing the player at that y is standing inside it.
ok("movePlayerTop stands on the ground, not in it",
   /movePlayerTop[\s\S]*?Number\(height\)\s*\+\s*1/.test(code));

// The server address is remembered rather than typed into every project. An
// example that names a server names somebody's home machine, in public.
["connectSaved", "rememberServer", "myServer"].forEach(function (o) {
    ok("the " + o + " block is live", opcodes.indexOf(o) >= 0);
});
ok("the address is kept in localStorage, not a cookie",
   /localStorage/.test(code) && !/document\.cookie/.test(code));
ok("reading and writing it are both wrapped",
   /function savedServer\s*\(\)\s*\{[\s\S]*?try\s*\{/.test(code) &&
   /function rememberServer\s*\([^)]*\)\s*\{[\s\S]*?try\s*\{/.test(code));
ok("it is only remembered after the connection works",
   /then\(remember\)/.test(code));

// setBlocks is the one that changes what is possible rather than what is
// available: 500 blocks in one message rather than 500 messages.
ok("the fill block exists and uses setBlocks",
   opcodes.indexOf("fill") >= 0 && /fill\s*\(\{[^}]*\}\)\s*\{[\s\S]*?world\.setBlocks/.test(code));

console.log("");
if (failures) {
    console.log(failures + " failed");
    process.exit(1);
}
console.log("all passed");
