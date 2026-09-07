// How the Scratch extension chooses between wss:// and ws://, and what it tells
// the reader when neither works.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// The WebSocket here is a mock, so this exercises our control flow, not the
// browser's. It can prove which URLs get tried and in what order, that a
// working wss:// server is never downgraded, and that each failure produces the
// right explanation. It cannot prove that a real browser refuses a blocked
// ws:// URL in either of the shapes simulated below, nor anything about real
// TLS, real certificates, or websockify. Those need a browser against a live
// server.
//
// It is still worth having: the retry logic used to hammer one URL three times,
// and the failure message used to blame the certificate for what was actually
// the browser's mixed content policy. Both are control flow, and both were
// caught here.
//
// Run with: node test/scratch/connect.test.js
"use strict";

const fs = require("fs");
const path = require("path");

const SCRATCH_JS = path.join(__dirname, "..", "..", "docs", "scratch.js");
const src = fs.readFileSync(SCRATCH_JS, "utf8");

// Take the classes but stop before the IIFE that registers with Scratch, so
// nothing reaches for an extension runtime that is not here.
const lines = src.split("\n").map(function (l) { return l.replace("\r", ""); });
const classStart = lines.findIndex(function (l) { return l.indexOf("class FruitJuice") === 0; });
const classEnd = lines.findIndex(function (l, i) { return l === "}" && i > classStart; });
if (classStart < 0 || classEnd < 0) {
    throw new Error("could not find class FruitJuice in " + SCRATCH_JS);
}
const body = lines.slice(0, classEnd + 1).join("\n");

let pageProtocol = "https:";
const warnings = [];
const alerts = [];

global.window = {
    get location() { return { protocol: pageProtocol }; },
    alert: function (m) { alerts.push(m); },
    TextEncoder: function () {},
};
console.warn = function () { warnings.push(Array.prototype.join.call(arguments, " ")); };
console.error = function () {};
global.Scratch = { translate: function (s) { return s; }, ArgumentType: {}, BlockType: {} };

// url -> "open" | "error-fast" | "error-slow" | "throw"
let behaviour = {};

global.WebSocket = function (url) {
    const self = this;
    this.url = url;
    this.readyState = 0;
    const how = behaviour[url] || "error-slow";

    // Some browsers refuse a blocked ws:// URL by throwing from the constructor
    // rather than by firing onerror. Both shapes are exercised.
    if (how === "throw") {
        const e = new Error("insecure WebSocket from a secure page");
        e.name = "SecurityError";
        throw e;
    }

    setTimeout(function () {
        if (how === "open") {
            self.readyState = 1;
            if (self.onopen) self.onopen();
        } else if (self.onerror) {
            self.onerror(new Error("opaque event"));
        }
    // "error-slow" is the only one that should take real time: it stands for a
    // connection the network refused rather than one the browser vetoed.
    }, how === "error-slow" ? 400 : 1);

    this.close = function () { self.readyState = 3; };
    this.send = function () {};
};

// A class declared inside eval stays in that scope, so hand it out explicitly.
eval(body + "\nglobalThis.FruitJuice = FruitJuice;");

const WSS = "wss://mcscratch.example.org:14711";
const WS = "ws://mcscratch.example.org:14711";

function session() {
    const f = new FruitJuice();
    f.ip = "mcscratch.example.org";
    f.port = 14711;
    f.clear = function () {};
    f.socket = null;
    return f;
}

let failures = 0;
function check(name, cond, detail) {
    if (cond) {
        console.log("  ok   " + name);
    } else {
        failures++;
        console.log("  FAIL " + name + (detail ? "\n         " + detail : ""));
    }
}

async function main() {
    // A working secure server is never downgraded.
    behaviour = {}; behaviour[WSS] = "open"; behaviour[WS] = "open";
    warnings.length = 0;
    let f = session();
    const t0 = Date.now();
    await f.openSocket_p([WSS, WS]);
    check("a working wss server is used and ws is never tried", f.secure === true);
    check("no plaintext warning on a secure connection",
          !warnings.some(function (w) { return w.indexOf("WITHOUT") >= 0; }));
    check("connecting securely does not wait out a retry", Date.now() - t0 < 200);

    // Reader has allowed insecure content, so ws:// gets through. Say so.
    behaviour = {}; behaviour[WSS] = "error-fast"; behaviour[WS] = "open";
    warnings.length = 0;
    f = session();
    await f.openSocket_p([WSS, WS]);
    check("falls back to ws when wss fails", f.secure === false);
    check("an unencrypted connection is warned about",
          warnings.some(function (w) { return w.indexOf("WITHOUT encryption") >= 0; }),
          JSON.stringify(warnings));

    // https page, no certificate on the server: the browser vetoes ws://
    // without a round trip. Both refusal shapes must read the same.
    for (const shape of ["error-fast", "throw"]) {
        behaviour = {}; behaviour[WSS] = "error-fast"; behaviour[WS] = shape;
        alerts.length = 0;
        pageProtocol = "https:";
        f = session();
        await f.openSocket_p([WSS, WS]).then(function () {}, function () {});
        const msg = alerts.join("\n");
        check("a browser block via " + shape + " is named as such",
              msg.indexOf("blocked the unencrypted connection") >= 0, msg.slice(0, 200));
        check("a browser block via " + shape + " does not blame the certificate",
              msg.indexOf("certificate is missing") < 0, msg.slice(0, 200));
    }

    // A ws:// attempt that takes real time was not vetoed, so the secure
    // failure that preceded it is the thing worth explaining.
    behaviour = {}; behaviour[WSS] = "error-fast"; behaviour[WS] = "error-slow";
    alerts.length = 0;
    f = session();
    await f.openSocket_p([WSS, WS]).then(function () {}, function () {});
    check("a slow ws failure points at the certificate instead",
          alerts.join("\n").indexOf("certificate is missing") >= 0,
          alerts.join("\n").slice(0, 200));

    // Served over plain http, nothing is blocked and no certificate is
    // expected, so neither hint would be true.
    pageProtocol = "http:";
    behaviour = {}; behaviour[WSS] = "error-fast"; behaviour[WS] = "error-fast";
    alerts.length = 0;
    f = session();
    await f.openSocket_p([WSS, WS]).then(function () {}, function () {});
    const m = alerts.join("\n");
    check("an http page is given neither hint",
          m.indexOf("blocked the unencrypted") < 0 && m.indexOf("certificate is missing") < 0,
          m.slice(0, 200));

    console.log(failures ? "\n" + failures + " failed" : "\nall passed");
    process.exit(failures ? 1 : 0);
}

main();
