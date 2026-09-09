This plugin allows users to use the scratch programming language to build on a minescraft server.

This source can be (modified and) hosted locally, or you can visit this webpage to access the minecraft/scratch interface.

If the server administrator followed the secure instructions, they can connect from here:

https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js

The same URL works whether or not the server has a certificate: the extension tries a secure connection first and falls back to an insecure one. A server without a certificate additionally needs the browser to allow "insecure content" for the page.

See ../README_server_setup.md for detailed setup instructions.

Once a server is set up, a vanilla player can connect via scratch or through Minecraft via the WAN connection to the server/port.

## Other extensions here

A Scratch project can load more than one extension, and two more live beside
this one. Both come from [arpruss/rjmscratch](https://github.com/arpruss/rjmscratch)
under the MIT licence -- the same author whose RaspberryJamMod extension this
one descends from -- with their notices kept and their bugs fixed.

    ?load_plugin=gamepad.js     read a game controller: buttons, axes, rumble
    ?load_plugin=fetch.js       read a URL, and pull a field out of JSON

`gamepad.js` is the honest version of the video sensing example: a webcam can
only tell you that something moved and roughly which way, while a controller
has real axes. It also rumbles, so hitting a block in Minecraft can be felt in
your hands. A browser reports no controller at all until one of its buttons has
been pressed, so the first press after loading the page only wakes it up.

`fetch.js` runs in a browser, so the browser's rules apply. The site must send
an `Access-Control-Allow-Origin` header, and most do not; `http://` will not
load from this `https://` page whatever it sends, which is the same mixed
content rule that decides whether the Minecraft connection can fall back to
`ws://`. Checked and working: api.weather.gov, open-meteo.com,
earthquake.usgs.gov, api.sunrise-sunset.org. api.open-notify.org, the obvious
place to ask where the space station is, is http-only and so cannot be used.


## Telling it where your server is, once

The example projects contain no address. They use **connect to my Minecraft**,
which goes to whatever this browser last connected to successfully, or to
`localhost` if it never has.

To point it at your own server, do either of these once:

 - run **remember [address] port [port] as my Minecraft**, or
 - connect with the ordinary connect block; a connection that works is
   remembered.

**my Minecraft address** reports what is currently saved, which is the quick
way to find out why something is not connecting.

It is kept in the browser's localStorage, not in the project and not in a
cookie -- there is no server here to send a cookie to. That means it is per
browser and per site, so what you save on the published page is separate from
what you save on a local copy at `localhost:8000`. A private window, or a
browser set to block site data, will forget it; everything falls back to
`localhost` and nothing breaks.

No example in this folder names a server, and there is a test that keeps it
that way. An example that named one would be publishing somebody's home
machine, and would make everyone who downloaded it edit a block before
anything happened.

## Trying changes before they are published

The published page serves whatever is on the default branch, so an extension
change is not there until it is merged. To run your working copy:

    cd docs && python -m http.server 8000

then open <http://localhost:8000/?load_plugin=scratch.js>. Everything is
same-origin, so no CORS and no mixed-content rules, and from an `http://`
page the Minecraft connection can use plain `ws://` with no certificate at
all. `?load_plugin=gamepad.js` and `?load_plugin=fetch.js` work the same way.
