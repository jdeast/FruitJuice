// What happens when the server refuses a command.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// The socket is a mock, so this proves what the extension does with a "Fail,"
// line. It cannot prove the server sends one in any particular case.
//
// It is worth having because the failure it guards against is invisible. The
// server reports every error as a line beginning "Fail,", and the extension
// used to check for that in exactly one place. Everywhere else the error became
// the block's VALUE: a misspelled block name made a reporter display
// "Fail,world.setBlock: no block called STOEN" as its answer, and a command
// block did nothing at all. Nothing threw and nothing was logged in the
// browser, so the only real explanation lived in a server console that the
// child who caused it cannot see.
//
// Run with: node test/scratch/errors.test.js
"use strict";

const fs = require("fs");
const path = require("path");

const SCRATCH_JS = path.join(__dirname, "..", "..", "docs", "scratch.js");
const src = fs.readFileSync(SCRATCH_JS, "utf8");

const lines = src.split("\n").map(function (l) { return l.replace("\r", ""); });
const classStart = lines.findIndex(function (l) { return l.indexOf("class FruitJuice") === 0; });
const classEnd = lines.findIndex(function (l, i) { return l === "}" && i > classStart; });
if (classStart < 0 || classEnd < 0) {
    throw new Error("could not find class FruitJuice in " + SCRATCH_JS);
}
const body = lines.slice(0, classEnd + 1).join("\n");

const alerts = [];
const warnings = [];
global.window = { alert: function (m) { alerts.push(m); }, TextEncoder: function () {} };
console.warn = function () { warnings.push(Array.prototype.join.call(arguments, " ")); };
console.error = function () {};
global.Scratch = { translate: function (s) { return s; }, ArgumentType: {}, BlockType: {} };
global.WebSocket = function () {};

eval(body + "\nglobalThis.FruitJuice = FruitJuice;");

let failures = 0;
function check(name, cond, detail) {
    if (cond) {
        console.log("  ok   " + name);
    } else {
        failures++;
        console.log("  FAIL " + name + (detail ? "\n         " + detail : ""));
    }
}

function session() {
    const f = new FruitJuice();
    const sock = { readyState: 1, send: function () {}, close: function () {} };
    f.socket = sock;
    f.isConnected = function () { return true; };
    f.send = function () {};
    f.attachSocketHandlers(sock);
    return f;
}

function reply(f, text) {
    f.socket.onmessage({ data: text });
}

async function main() {
    // ── the failure this exists for ────────────────────────────────────────
    alerts.length = 0;
    let f = session();
    let got = f.sendAndReceive("world.setBlock(1,2,3,STOEN)");
    reply(f, "Fail,world.setBlock: No enum constant Material.STOEN\n");
    const value = await got;

    check("a server error reaches the person who caused it",
          alerts.length === 1, JSON.stringify(alerts));
    check("the alert names the thing that was actually wrong",
          alerts.length === 1 && alerts[0].indexOf("STOEN") >= 0,
          JSON.stringify(alerts));
    check("the alert does not send them to a console they cannot see",
          alerts.every(function (a) { return a.indexOf("server console") < 0; }),
          JSON.stringify(alerts));
    // Returned, not rejected: an existing script must carry on behaving the
    // way it always did. The point is that the failure stops being SILENT,
    // not that it starts throwing.
    check("the reply is still returned rather than thrown",
          value === "Fail,world.setBlock: No enum constant Material.STOEN");

    // ── an ordinary answer is left alone ───────────────────────────────────
    alerts.length = 0;
    f = session();
    got = f.sendAndReceive("player.getPos()");
    reply(f, "1.5,64.0,2.5\n");
    check("a normal reply raises nothing", (await got) === "1.5,64.0,2.5" && alerts.length === 0,
          JSON.stringify(alerts));

    // A block that merely CONTAINS the word is not an error. Only the leading
    // marker counts, or a sign saying "Fail," would set off an alarm.
    alerts.length = 0;
    f = session();
    got = f.sendAndReceive("world.getBlock(1,2,3)");
    reply(f, "this block is called Fail,something\n");
    check("only a leading marker counts as a failure", alerts.length === 0,
          JSON.stringify(alerts));

    // ── repeated failures must not become a wall of dialogs ────────────────
    // These run inside forever loops; one distinct problem is one alert.
    alerts.length = 0;
    f = session();
    for (let i = 0; i < 5; i++) {
        const p = f.sendAndReceive("world.setBlock(1,2,3,STOEN)");
        reply(f, "Fail,world.setBlock: No enum constant Material.STOEN\n");
        await p;
    }
    check("the same failure five times is reported once", alerts.length === 1,
          alerts.length + " alerts");

    // ── the caller that handles its own ────────────────────────────────────
    // An older server has no world.getBlockTypes and says so. That is expected,
    // handled, and none of the reader's business.
    alerts.length = 0;
    f = session();
    got = f.sendAndReceive("world.getBlockTypes()", { quiet: true });
    reply(f, "Fail,world.getBlockTypes is not supported.\n");
    check("a caller that handles its own Fail stays quiet",
          (await got).indexOf("Fail,") === 0 && alerts.length === 0,
          JSON.stringify(alerts));

    // ── a typed block name ─────────────────────────────────────────────────
    // "block named [text]" is the one block argument that is typed rather than
    // chosen, so it is also the one where a spelling mistake is likely. Both
    // halves matter: a name typed the way a person would write it has to work,
    // and one that is wrong has to say so.
    f = session();
    f.serverBlocks = ["STONE", "PINK_WOOL", "WHITE_CONCRETE"];
    check("a name typed like a person writes it resolves",
          f.blockByName({ name: "pink wool" }) === "PINK_WOOL");
    check("case does not matter", f.blockByName({ name: "Pink Wool" }) === "PINK_WOOL");
    check("an already-canonical name is unchanged",
          f.blockByName({ name: "WHITE_CONCRETE" }) === "WHITE_CONCRETE");

    // The menu-label form still works, so anything built before this block
    // took typed text keeps working.
    f = session();
    f.serverBlocks = ["STONE"];
    check("a dropdown label still resolves to its material",
          f.blockByName({ name: "Stone (0)" }) === "STONE" ||
          f.blockByName({ name: "STONE" }) === "STONE");

    alerts.length = 0;
    f = session();
    f.serverBlocks = ["STONE", "PINK_WOOL"];
    f.blockByName({ name: "pink wol" });
    check("a misspelled typed name is reported rather than passed on silently",
          alerts.length === 1 && alerts[0].indexOf("pink wol") >= 0,
          JSON.stringify(alerts));

    console.log("");
    if (failures) {
        console.log(failures + " failed");
        process.exit(1);
    }
    console.log("all passed");
}

main().catch(function (e) {
    console.log("threw: " + (e && e.stack ? e.stack : e));
    process.exit(1);
});
