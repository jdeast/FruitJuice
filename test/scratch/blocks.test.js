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

const opcodes = all(/"opcode":\s*"(\w+)"/, src);
const methods = all(/^ {4}(\w+)\s*\([^)]*\)\s*\{/m, src);
const methodSet = new Set(methods);
const orphans = opcodes.filter(function (o) { return !methodSet.has(o); });

ok("every block has an implementation", orphans.length === 0, orphans.join(" "));
ok("there are blocks at all", opcodes.length > 40, String(opcodes.length));

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
    all(/command\.equals\("(\w+)"\)/, java).forEach(function (c) {
        serverCommands.add(prefix[1] + c);
    });
});

ok("the plugin sources were found", serverCommands.size > 20,
   String(serverCommands.size));

// Only look at live code: a commented out call is a decision, not a bug.
const live = src.split("\n").filter(function (l) {
    return l.trim().indexOf("//") !== 0;
}).join("\n");

const sent = new Set(all(/"((?:world|player|entity)\.\w+)\(/, live));
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
};
Object.keys(wanted).forEach(function (c) {
    ok("sends " + c + " (" + wanted[c] + ")", sent.has(c));
});

// setBlocks is the one that changes what is possible rather than what is
// available: 500 blocks in one message rather than 500 messages.
ok("the fill block exists and uses setBlocks",
   opcodes.indexOf("fill") >= 0 && /fill\s*\(\{[^}]*\}\)\s*\{[\s\S]*?world\.setBlocks/.test(src));

console.log("");
if (failures) {
    console.log(failures + " failed");
    process.exit(1);
}
console.log("all passed");
