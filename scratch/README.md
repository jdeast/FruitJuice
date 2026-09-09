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
