// Every .sb3 in scratch/examples, checked against the extension it needs.
//
// WHAT THIS CAN AND CANNOT PROVE
//
// It opens each project, reads the block graph, and checks that everything it
// asks for exists: every FruitJuice block is one that is actually in the
// palette, every dropdown holds a value that dropdown offers, every extension
// it uses is declared, and every id it points at is there. It cannot prove
// that a project does anything sensible when it runs.
//
// It is worth having because a project is an opaque zip. If a block is removed
// or commented out in scratch.js, or a menu is renamed, nothing tells you that
// eight examples now silently fail to load -- the child just gets an editor
// full of grey blocks. That is the failure this catches.
//
// Run with: node test/scratch/examples.test.js
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..", "..");
const SCRATCH_JS = path.join(ROOT, "docs", "scratch.js");
const EXAMPLES = path.join(ROOT, "scratch", "examples");

let failures = 0;
function ok(name, cond, detail) {
    if (cond) {
        console.log("  ok   " + name);
    } else {
        failures++;
        console.log("  FAIL " + name + (detail ? "  -- " + detail : ""));
    }
}

// ── just enough zip to read one file out of an .sb3 ────────────────────────
//
// Node ships zlib but no zip reader, and an .sb3 is a zip. Only project.json
// is wanted, so this walks the central directory, finds it, and inflates it.

function readFromZip(file, wanted) {
    const buf = fs.readFileSync(file);
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0; i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("not a zip: " + file);
    const count = buf.readUInt16LE(eocd + 10);
    let p = buf.readUInt32LE(eocd + 16);

    for (let i = 0; i < count; i++) {
        if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad directory");
        const method = buf.readUInt16LE(p + 10);
        const nameLen = buf.readUInt16LE(p + 28);
        const extraLen = buf.readUInt16LE(p + 30);
        const commentLen = buf.readUInt16LE(p + 32);
        const offset = buf.readUInt32LE(p + 42);
        const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
        if (name === wanted) {
            const nl = buf.readUInt16LE(offset + 26);
            const el = buf.readUInt16LE(offset + 28);
            const start = offset + 30 + nl + el;
            const compressed = buf.readUInt32LE(p + 20);
            const raw = buf.slice(start, start + compressed);
            return method === 0 ? raw : zlib.inflateRawSync(raw);
        }
        p += 46 + nameLen + extraLen + commentLen;
    }
    throw new Error(wanted + " not in " + file);
}

// ── what the extension currently offers ────────────────────────────────────

const src = fs.readFileSync(SCRATCH_JS, "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

function all(re, s) {
    const out = [];
    let m;
    const r = new RegExp(re.source, "g");
    while ((m = r.exec(s)) !== null) out.push(m[1]);
    return out;
}

const palette = new Set(all(/"opcode":\s*"(\w+)"/, code));

// Static menus, so a dropdown value can be checked. Dynamic ones (blockMenu is
// filled from the server at connect time) are skipped rather than guessed at.
const staticMenus = {};
const menuRe = /(\w+Menu)\s*:\s*(\{[^[]*)?\[([\s\S]*?)\]/g;
let mm;
while ((mm = menuRe.exec(code)) !== null) {
    const values = all(/value:\s*"?([^",}]+)"?/, mm[3]);
    const bare = all(/"([^"]+)"/, mm[3]);
    staticMenus[mm[1]] = new Set(values.concat(bare));
}
const DYNAMIC = new Set(["blockMenu"]);

ok("the palette was read", palette.size >= 35, String(palette.size));
ok("some menus were read", Object.keys(staticMenus).length >= 5,
   Object.keys(staticMenus).join(" "));

// ── every project ──────────────────────────────────────────────────────────

const files = fs.readdirSync(EXAMPLES).filter(function (f) {
    return f.endsWith(".sb3");
});
ok("there are example projects", files.length > 0, String(files.length));

// An opcode prefix means the project must declare that extension.
const NEEDS = { videoSensing_: "videoSensing", music_: "music", pen_: "pen",
                text2speech_: "text2speech", translate_: "translate" };

files.forEach(function (f) {
    const file = path.join(EXAMPLES, f);
    let project;
    try {
        project = JSON.parse(readFromZip(file, "project.json").toString("utf8"));
    } catch (e) {
        ok(f + ": opens", false, e.message);
        return;
    }

    const blocks = {};
    const declaredVars = new Set();
    const declaredLists = new Set();
    (project.targets || []).forEach(function (t) {
        Object.keys(t.blocks || {}).forEach(function (id) {
            if (t.blocks[id] && t.blocks[id].opcode) blocks[id] = t.blocks[id];
        });
        Object.keys(t.variables || {}).forEach(function (v) { declaredVars.add(v); });
        Object.keys(t.lists || {}).forEach(function (v) { declaredLists.add(v); });
    });

    const problems = [];
    const extensions = new Set(project.extensions || []);
    let usesFruitJuice = false;

    Object.keys(blocks).forEach(function (id) {
        const b = blocks[id];
        const op = b.opcode;

        if (op.indexOf("FruitJuice_") === 0) {
            usesFruitJuice = true;
            const name = op.slice("FruitJuice_".length);
            if (name.indexOf("menu_") === 0) {
                const menuName = name.slice("menu_".length);
                const value = b.fields && b.fields[menuName] && b.fields[menuName][0];
                if (!DYNAMIC.has(menuName) && staticMenus[menuName] &&
                    value !== undefined && !staticMenus[menuName].has(String(value))) {
                    problems.push("menu " + menuName + " has no option " + value);
                }
            } else if (!palette.has(name)) {
                problems.push("block " + name + " is not in the palette");
            }
        }

        Object.keys(NEEDS).forEach(function (prefix) {
            if (op.indexOf(prefix) === 0 && !extensions.has(NEEDS[prefix])) {
                problems.push("uses " + op + " but does not declare " + NEEDS[prefix]);
            }
        });

        // The graph has to hang together.
        if (b.parent && !blocks[b.parent]) problems.push(id + ": parent missing");
        if (b.next && !blocks[b.next]) problems.push(id + ": next missing");
        Object.keys(b.inputs || {}).forEach(function (name) {
            (b.inputs[name] || []).slice(1).forEach(function (part) {
                if (typeof part === "string" && !blocks[part]) {
                    problems.push(id + "." + name + ": input block missing");
                }
                if (Array.isArray(part) && part[0] === 12 && !declaredVars.has(part[2])) {
                    problems.push(id + "." + name + ": undeclared variable " + part[1]);
                }
            });
        });
        if (b.fields && b.fields.VARIABLE && !declaredVars.has(b.fields.VARIABLE[1])) {
            problems.push(id + ": undeclared variable " + b.fields.VARIABLE[0]);
        }
        if (b.fields && b.fields.LIST && !declaredLists.has(b.fields.LIST[1])) {
            problems.push(id + ": undeclared list " + b.fields.LIST[0]);
        }
    });

    if (usesFruitJuice && !extensions.has("FruitJuice")) {
        problems.push("uses FruitJuice blocks but does not declare the extension");
    }

    ok(f, problems.length === 0, problems.slice(0, 3).join("; "));
});

// No example may carry a real server address.
//
// Two reasons, and the second is the serious one. Whoever writes an example is
// not whoever runs it, so a typed-in address means everybody who downloads it
// edits a block before anything happens. And the address would be somebody's
// actual home server, published in a public repository.
//
// localhost is fine. "connect to my Minecraft" is better, because it uses
// whatever that browser last connected to.
const ALLOWED_HOSTS = ["localhost", "127.0.0.1"];
files.forEach(function (f) {
    const raw = readFromZip(path.join(EXAMPLES, f), "project.json").toString("utf8");
    const project = JSON.parse(raw);
    const typed = [];
    (project.targets || []).forEach(function (t) {
        Object.keys(t.blocks || {}).forEach(function (id) {
            const b = t.blocks[id];
            if (!b || b.opcode !== "FruitJuice_connect_p") return;
            const ip = (b.inputs || {}).ip;
            if (ip && Array.isArray(ip[1]) && ALLOWED_HOSTS.indexOf(String(ip[1][1])) < 0) {
                typed.push(String(ip[1][1]));
            }
        });
    });
    // Anything host-shaped anywhere in the project, ignoring asset filenames.
    const looksLikeHost = (raw.match(/"([a-z0-9][a-z0-9.-]*\.[a-z]{2,})"/g) || [])
        .map(function (m) { return m.slice(1, -1); })
        .filter(function (h) { return !/\.(wav|svg|png|json)$/.test(h); })
        .filter(function (h) { return ALLOWED_HOSTS.indexOf(h) < 0; });
    ok(f + ": no real server address", typed.length === 0 && looksLikeHost.length === 0,
       typed.concat(looksLikeHost).join(" "));
});

console.log("");
if (failures) {
    console.log(failures + " failed");
    process.exit(1);
}
console.log("all passed");
