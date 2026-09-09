// How replies are cut out of the websocket stream.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// The socket here is a mock, so this proves how the extension reassembles what
// it is handed. It cannot prove how a real websockify chops a real TCP stream.
// What it can do is pin the assumption that matters: a reply is a LINE, and a
// frame is not a reply.
//
// It is worth having because getting this wrong is invisible. The extension
// used to resolve each request with the first frame that arrived. Short replies
// -- a coordinate, a block name -- fit in one frame, so everything looked fine
// for years. world.getBlockTypes() does not: it is 20KB of material names, and
// the first frame carried 95 of 1196, ending mid-list at
// BLACK_STAINED_GLASS_PANE. That truncated list was uppercase, space-free and
// well over the length check, so it was accepted as the server's whole block
// list, and every material after B was then reported to the child as one their
// server did not have. Nothing threw. Nothing logged. A piano made of
// WHITE_CONCRETE popped up an alert saying there was no such block, while
// placing it correctly.
//
// Run with: node test/scratch/framing.test.js
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

global.window = { alert: function () {}, TextEncoder: function () {} };
console.warn = function () {};
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

// A session whose socket we drive by hand.
function session() {
    const f = new FruitJuice();
    const sock = { readyState: 1, send: function () {}, close: function () {} };
    f.socket = sock;
    f.sent = [];
    f.isConnected = function () { return true; };
    f.send = function (m) { f.sent.push(m); };
    f.attachSocketHandlers(sock);
    return f;
}

// Hand the socket one frame, as a plain string.
function frame(f, text) {
    f.socket.onmessage({ data: text });
}

// Hand it one frame as a Blob-alike, whose text() settles after `delay` ms.
// Browsers deliver Blobs, and Blob.text() is async, so two frames read at once
// can settle in either order.
function blobFrame(f, text, delay) {
    f.socket.onmessage({
        data: {
            text: function () {
                return new Promise(function (res) { setTimeout(function () { res(text); }, delay); });
            }
        }
    });
}

// Let the microtask/timer chain drain.
function settle(ms) {
    return new Promise(function (res) { setTimeout(res, ms === undefined ? 5 : ms); });
}

async function main() {
    // ── one reply, many frames ─────────────────────────────────────────────
    let f = session();
    let got = f.sendAndReceive("world.getBlockTypes()");
    frame(f, "AIR,STONE,");
    frame(f, "DIRT,");
    frame(f, "WHITE_CONCRETE\n");
    check("a reply split across three frames arrives whole",
          (await got) === "AIR,STONE,DIRT,WHITE_CONCRETE");

    // ── the real shape of the bug ──────────────────────────────────────────
    // 1196 names, ~20KB, cut at the segment sizes the live server actually
    // produced: 1350, 2700, 2700, 2700, 4050, 1350, 4050, then the rest.
    f = session();
    const names = [];
    for (let i = 0; i < 1196; i++) names.push("BLOCK_NUMBER_" + i);
    names[1166] = "WHITE_CONCRETE";
    const reply = names.join(",") + "\n";
    got = f.sendAndReceive("world.getBlockTypes()");
    let at = 0;
    [1350, 2700, 2700, 2700, 4050, 1350, 4050].forEach(function (n) {
        frame(f, reply.slice(at, at + n));
        at += n;
    });
    frame(f, reply.slice(at));
    const list = (await got).split(",");
    check("a 20KB reply in eight frames is not truncated",
          list.length === 1196, list.length + " names");
    check("the material that used to go missing is present",
          list.indexOf("WHITE_CONCRETE") === 1166,
          "index " + list.indexOf("WHITE_CONCRETE"));

    // ── many replies, one frame ────────────────────────────────────────────
    f = session();
    const a = f.sendAndReceive("player.getPos()");
    const b = f.sendAndReceive("world.getHeight(0,0)");
    frame(f, "1,2,3\n64\n");
    check("two replies sharing one frame go to two waiters, in order",
          (await a) === "1,2,3" && (await b) === "64");

    // ── a frame boundary inside a line, between two replies ────────────────
    f = session();
    const c = f.sendAndReceive("player.getPos()");
    const d = f.sendAndReceive("world.getHeight(0,0)");
    frame(f, "1,2,");
    frame(f, "3\n6");
    frame(f, "4\n");
    check("a boundary mid-line does not shift replies onto the wrong request",
          (await c) === "1,2,3" && (await d) === "64");

    // ── Blobs that settle out of order ─────────────────────────────────────
    // The slow frame is handed over FIRST. Read concurrently it would land
    // second and corrupt the stream; chained, order is preserved.
    f = session();
    const e = f.sendAndReceive("world.getBlockTypes()");
    blobFrame(f, "AIR,STONE,", 30);
    blobFrame(f, "DIRT\n", 1);
    await settle(80);
    check("frames are reassembled in arrival order, not completion order",
          (await e) === "AIR,STONE,DIRT");

    // ── a dropped connection must not leave half a line behind ─────────────
    f = session();
    const dead = f.sendAndReceive("player.getPos()");
    dead.catch(function () {});
    frame(f, "1,2,");                       // half a reply, then the socket dies
    f.socket.onclose();
    f.attachSocketHandlers(f.socket);       // reconnecting, as connect_p does
    const fresh = f.sendAndReceive("player.getPos()");
    frame(f, "9,9,9\n");
    check("a half line from a dead socket does not prefix the next reply",
          (await fresh) === "9,9,9");

    // The same, but the dead socket's frame is still being read when it dies.
    // Clearing the buffer on close cannot catch this one on its own: the append
    // happens after the clear. Only knowing which socket the frame came from does.
    f = session();
    const stale = f.sendAndReceive("player.getPos()");
    stale.catch(function () {});
    blobFrame(f, "1,2,", 30);               // slow read, still in flight
    f.socket.onclose();
    f.attachSocketHandlers(f.socket);
    const live = f.sendAndReceive("player.getPos()");
    frame(f, "9,9,9\n");
    await settle(80);
    check("a frame still being read when the socket dies is discarded",
          (await live) === "9,9,9");

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
