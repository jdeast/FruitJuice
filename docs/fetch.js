// Fetch: read a URL from Scratch, and pull a field out of JSON.
//
// MIT License. Copyright (c) 2020 arpruss (Alexander R. Pruss).
// From https://github.com/arpruss/rjmscratch, where it accompanies the
// RaspberryJamMod Scratch extension that FruitJuice's own extension descends
// from. Included here under the MIT terms; the notice above travels with it.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: the above copyright
// notice and this permission notice shall be included in all copies or
// substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND.
//
// WHAT IS DIFFERENT FROM THE ORIGINAL
//
//   - "extract" reported 1 for every boolean. The test read `typeof(out)`,
//     which is the string "boolean" and therefore always truthy, instead of
//     reading the value. false came back as 1.
//   - A URL that fails now reports why. Before, the promise rejected and the
//     block simply never finished, so the script stopped with no message.
//   - There is a timeout. A server that accepts a connection and then says
//     nothing would otherwise hang the script for ever.
//   - Bad JSON says so rather than throwing out of the block.
//   - It registers the way scratch.js does, so it works both in the plain
//     editor and when loaded into a modified scratch-gui.
//
// WHAT WILL AND WILL NOT LOAD
//
// This runs in a browser, so the browser's rules apply and they surprise
// people:
//
//   - The site must send an Access-Control-Allow-Origin header. Most do not.
//     Checked and working today: api.weather.gov, open-meteo.com,
//     earthquake.usgs.gov, api.sunrise-sunset.org.
//   - http:// will not load at all from the https:// page, whatever CORS says.
//     That is the same mixed content rule that decides whether the Minecraft
//     connection can fall back to ws://. api.open-notify.org, the obvious
//     source for where the space station is, is http-only and so is out.
//
// A site that refuses is not broken and neither is this: it has simply not
// agreed to be read by a program running on someone else's page.

const FETCH_TIMEOUT_MS = 10000;

class ScratchFetch {
    constructor() {
    }

    getInfo() {
        return {
            "id": "Fetch",
            "name": "Fetch",
            "blocks": [
                {
                    "opcode": "fetchURL",
                    "blockType": "reporter",
                    "text": "fetch data from [url]",
                    "arguments": {
                        "url": {
                            "type": "string",
                            "defaultValue": "https://api.weather.gov/stations/KNYC/observations/latest"
                        },
                    }
                },
                {
                    "opcode": "jsonExtract",
                    "blockType": "reporter",
                    "text": "extract [name] from [data]",
                    "arguments": {
                        "name": {
                            "type": "string",
                            "defaultValue": "temperature"
                        },
                        "data": {
                            "type": "string",
                            "defaultValue": '{"temperature": 12.3}'
                        },
                    }
                },
            ],
        };
    }

    fetchURL({url}) {
        var controller = null;
        var timer = null;
        var options = {};
        if (typeof AbortController !== "undefined") {
            controller = new AbortController();
            options.signal = controller.signal;
            timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
        }

        return fetch(String(url), options).then(function (response) {
            if (timer) clearTimeout(timer);
            if (!response.ok) {
                // Report it rather than rejecting: a block that never returns
                // stops the script with nothing on screen to explain it.
                return "error " + response.status + " " + response.statusText;
            }
            return response.text();
        }).catch(function (e) {
            if (timer) clearTimeout(timer);
            if (e && e.name === "AbortError") {
                return "error: no answer within " + (FETCH_TIMEOUT_MS / 1000) + "s";
            }
            // Nearly always CORS, or http from an https page. The browser
            // deliberately does not say which, so neither can this.
            return "error: could not read that URL. The site may not allow " +
                   "being read by a program, or it may be http from an https page.";
        });
    }

    jsonExtract({name, data}) {
        var parsed;
        try {
            parsed = JSON.parse(String(data));
        } catch (e) {
            return "";
        }
        if (parsed === null || typeof parsed !== "object") {
            return "";
        }
        if (!(name in parsed)) {
            return "";
        }
        var out = parsed[name];
        var t = typeof out;
        if (t === "string" || t === "number") {
            return out;
        }
        if (t === "boolean") {
            // The value, not the name of its type. `typeof out` is the string
            // "boolean", which is always truthy, so this used to answer 1 for
            // false as well as for true.
            return out ? 1 : 0;
        }
        // Anything else -- an object or an array -- comes back as JSON, so the
        // next extract block can dig one level further in. That is how you get
        // at something nested: extract "properties", then extract
        // "temperature" from what that gave you.
        return JSON.stringify(out);
    }
}

(function () {
    var extensionClass = ScratchFetch;
    if (typeof window === "undefined" || !window.vm) {
        Scratch.extensions.register(new extensionClass());
    } else {
        var extensionInstance = new extensionClass();
        var serviceName =
            window.vm.extensionManager._registerInternalExtension(extensionInstance);
        window.vm.extensionManager._loadedExtensions.set(
            extensionInstance.getInfo().id, serviceName);
    }
})();
