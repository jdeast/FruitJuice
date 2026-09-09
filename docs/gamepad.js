// Gamepad: read a game controller from Scratch.
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
// WHY IT IS HERE
//
// The video sensing example steers by waving at a webcam, and a webcam can
// only tell you that something moved and roughly which way. A controller has
// actual axes: it knows how far, and it knows the difference between a small
// push and a big one. It also rumbles, which closes the loop the other way --
// hit a block in Minecraft and the thing in your hands can answer.
//
// Nothing here talks to Minecraft. It is a separate extension and a project
// loads both.
//
// WHAT IS DIFFERENT FROM THE ORIGINAL
//
//   - Rumble never worked. It read `this.gamepads[i]` inside the class that
//     IS one gamepad, where there is no `gamepads` and no `i`, so it threw a
//     ReferenceError every time.
//   - "axis moved" never became false again. The line meant to remember the
//     previous axes assigned previousAxes to itself, so after the first
//     movement the comparison was against a value that never changed.
//   - Two console.log calls ran on every frame, for every pad, for ever.
//   - An axis that does not exist reported false, which arithmetic then treats
//     as 0 but which looks wrong in a reporter. It reports 0.
//   - The arrays are set up in the constructor rather than on first use.
//   - It registers the way scratch.js does, so it works both in the plain
//     editor and when loaded into a modified scratch-gui.
//
// WHAT A BROWSER WILL TELL YOU
//
// For security, a browser reports no gamepads at all until one of their
// buttons has been pressed. So the first press after loading the page wakes
// the controller up and does nothing else, every time, and there is no way
// round it from here.

class SingleGamepad {
    constructor(index) {
        this.id = null;
        this.index = index;
        this.currentMSecs = null;
        this.currentButtons = [];
        this.previousButtons = [];
        this.currentAxes = [];
        this.previousAxes = [];
    }

    matches(gamepad) {
        return gamepad && this.index != null && gamepad.id == this.id &&
            gamepad.buttons.length == this.currentButtons.length &&
            gamepad.axes.length == this.currentAxes.length;
    }

    getGamepad(i) {
        if (typeof navigator === "undefined" || !navigator.getGamepads) {
            return null;
        }
        var gamepads = navigator.getGamepads();
        if (gamepads == null || gamepads.length <= i || !gamepads[i]) {
            return null;
        }
        return gamepads[i];
    }

    update(currentMSecs) {
        if (this.currentMSecs == currentMSecs) {
            return;
        }

        var gamepad = this.getGamepad(this.index);

        if (gamepad == null) {
            this.id = null;
            this.currentButtons = [];
            this.previousButtons = [];
            this.currentAxes = [];
            this.previousAxes = [];
            return;
        }

        this.currentMSecs = currentMSecs;

        if (!this.matches(gamepad)) {
            // A different controller, or the first sight of this one: there is
            // no previous state to compare against, so start it level.
            this.id = gamepad.id;
            this.previousButtons = [];
            for (var i = 0; i < gamepad.buttons.length; i++) {
                this.previousButtons.push(false);
            }
            this.previousAxes = [];
            for (var j = 0; j < gamepad.axes.length; j++) {
                this.previousAxes.push(0);
            }
        } else {
            this.previousButtons = this.currentButtons;
            // currentAxes, not previousAxes. Assigning this to itself left the
            // comparison in changedAxis looking at a value that never moved,
            // so "axis moved" stayed true once anything had.
            this.previousAxes = this.currentAxes;
        }

        this.currentButtons = [];
        for (var k = 0; k < gamepad.buttons.length; k++) {
            this.currentButtons.push(gamepad.buttons[k].pressed);
        }

        this.currentAxes = [];
        for (var m = 0; m < gamepad.axes.length; m++) {
            this.currentAxes.push(gamepad.axes[m]);
        }
    }

    pressedReleased(currentMSecs, i, pr) {
        this.update(currentMSecs);
        if (i < this.currentButtons.length) {
            return this.currentButtons[i] != this.previousButtons[i] &&
                this.currentButtons[i] == pr;
        }
        return false;
    }

    changedAxis(currentMSecs, i) {
        this.update(currentMSecs);
        if (i < this.currentAxes.length) {
            return this.currentAxes[i] != this.previousAxes[i];
        }
        return false;
    }

    getButton(currentMSecs, i) {
        this.update(currentMSecs);
        if (i < this.currentButtons.length) {
            return this.currentButtons[i];
        }
        return false;
    }

    getAxis(currentMSecs, i) {
        this.update(currentMSecs);
        if (i < this.currentAxes.length) {
            return this.currentAxes[i];
        }
        return 0;
    }

    rumble(s, w, t) {
        // this.getGamepad(this.index). The original asked this.gamepads[i],
        // inside the class that IS a single gamepad: no such property, no
        // such variable, ReferenceError every time it was called.
        var gamepad = this.getGamepad(this.index);
        if (gamepad != null && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect("dual-rumble", {
                duration: 1000 * t,
                strongMagnitude: Math.max(0, Math.min(s, 1)),
                weakMagnitude: Math.max(0, Math.min(w, 1))
            });
        }
    }
}

class ScratchGamepad {
    constructor(runtime) {
        this.id = null;
        this.runtime = runtime;
        this.gamepads = [];
        for (var i = 0; i < 4; i++) {
            this.gamepads.push(new SingleGamepad(i));
        }
    }

    // The runtime supplies a per-frame clock so that four blocks asking about
    // the same pad in the same frame only read the hardware once. Without a
    // runtime -- in a test, say -- fall back to the wall clock.
    now() {
        return (this.runtime && this.runtime.currentMSecs) || Date.now();
    }

    getInfo() {
        return {
            "id": "Gamepad",
            "name": "Gamepad",
            "blocks": [
                {
                    "opcode": "buttonPressedReleased",
                    "blockType": "hat",
                    "text": "button [b] [pr] of pad [i]",
                    "arguments": {
                        "b": {"type": "number", "defaultValue": "1"},
                        "pr": {"type": "number", "defaultValue": "1",
                               "menu": "pressReleaseMenu"},
                        "i": {"type": "number", "defaultValue": "1",
                              "menu": "padMenu"},
                    },
                },
                {
                    "opcode": "buttonDown",
                    "blockType": "Boolean",
                    "text": "button [b] of pad [i] is down",
                    "arguments": {
                        "b": {"type": "number", "defaultValue": "1"},
                        "i": {"type": "number", "defaultValue": "1",
                              "menu": "padMenu"},
                    },
                },
                {
                    "opcode": "axisMoved",
                    "blockType": "hat",
                    "text": "axis [b] of pad [i] moved",
                    "arguments": {
                        "b": {"type": "number", "defaultValue": "1"},
                        "i": {"type": "number", "defaultValue": "1",
                              "menu": "padMenu"},
                    },
                },
                {
                    "opcode": "axisValue",
                    "blockType": "reporter",
                    "text": "axis [b] of pad [i] value",
                    "arguments": {
                        "b": {"type": "number", "defaultValue": "1"},
                        "i": {"type": "number", "defaultValue": "1",
                              "menu": "padMenu"},
                    },
                },
                {
                    "opcode": "rumble",
                    "blockType": "command",
                    "text": "rumble strong [s] and weak [w] for [t] sec. on pad [i]",
                    "arguments": {
                        "s": {"type": "number", "defaultValue": "0.25"},
                        "w": {"type": "number", "defaultValue": "0.5"},
                        "t": {"type": "number", "defaultValue": "0.25"},
                        "i": {"type": "number", "defaultValue": "1",
                              "menu": "padMenu"},
                    },
                },
            ],
            "menus": {
                "pressReleaseMenu": [{text: "press", value: 1},
                                     {text: "release", value: 0}],
                "padMenu": {
                    acceptReporters: true,
                    items: [{text: "1", value: 1}, {text: "2", value: 2},
                            {text: "3", value: 3}, {text: "4", value: 4}],
                }
            }
        };
    }

    // Pads and buttons are numbered from 1 in the blocks and from 0 in the
    // browser, which is the right way round for a child and the wrong way
    // round for an array.
    pad(i) {
        var n = Math.floor(Number(i)) - 1;
        return this.gamepads[Math.max(0, Math.min(n, this.gamepads.length - 1))];
    }

    buttonPressedReleased({b, pr, i}) {
        return this.pad(i).pressedReleased(this.now(), Number(b) - 1, Number(pr));
    }

    axisMoved({b, i}) {
        return this.pad(i).changedAxis(this.now(), Number(b) - 1);
    }

    axisValue({b, i}) {
        return this.pad(i).getAxis(this.now(), Number(b) - 1);
    }

    buttonDown({b, i}) {
        return this.pad(i).getButton(this.now(), Number(b) - 1);
    }

    rumble({s, w, t, i}) {
        this.pad(i).rumble(Number(s), Number(w), Number(t));
    }
}

(function () {
    var extensionClass = ScratchGamepad;
    if (typeof window === "undefined" || !window.vm) {
        Scratch.extensions.register(new extensionClass(null));
    } else {
        var extensionInstance =
            new extensionClass(window.vm.extensionManager.runtime);
        var serviceName =
            window.vm.extensionManager._registerInternalExtension(extensionInstance);
        window.vm.extensionManager._loadedExtensions.set(
            extensionInstance.getInfo().id, serviceName);
    }
})();
