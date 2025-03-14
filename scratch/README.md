This plugin allows users to use the scratch programming language to build on a minescraft server.

This source can be (modified and) hosted locally, or you can visit this webpage to access the minecraft+scratch interface: 

https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js

A websocket to TCP socket relay must be running on the bukkit server. See ../README_server_setup.md for detailed setup instructions.

Once a server is set up, a vanilla player can connect via scratch or through Minecraft via WAN or LAN connection to the server/port.

Secure websockets are currently not supported. As a result, all users must "allow insecure content" from this page. By default, most browsers (chrome, safari) will silently block insecure content. 