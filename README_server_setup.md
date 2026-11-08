How to set up a Python and scratch enabled, Java+Bedrock server that allows remote connections

# Compatibility

Running custom servers is fragile because nothing is officially supported. Many components (written by passionate volunteers) have bugs that impact performance or behaviors you might be used to with the offical game. When Minecraft updates, sometimes that breaks the various plugins. It's best to wait a week or two after major updates for fixes and bugs to work their way through.

These instructions were working as of 2026-11-08 with the latest versions of minecraft and all plugins on a Raspberry Pi 4 Model B with 4 GB running 64-bit Raspberry Pi OS Lite, Debian 12 (bookworm). There is nothing particularly special about the Raspberry Pi -- many inexpensive "single board computers" will work (as well as standard computers). The better the computer, the more complex worlds you can host, the more people can play, or the more simultaneous servers you can support.

If practical, you may wish to disable minecraft updates for all users after setting this up to avoid unexpected incompatibilities. Most major minecraft updates require corresponding plugin updates.

Minecraft Java 26.3
Minecraft Bedrock 26.x

Java 25 (Temurin)
Paper 26.3 #200
Geyser-Spigot 2.12.1 #1295
Floodgate-Spigot #141
FruitJuice-0.5.4

## Operating system requirements for Bedrock players

Since 2026-10-27, Bedrock Edition connects to servers with a new protocol called NetherNet, replacing the old one (RakNet). Geyser supports it, but only on an operating system with glibc 2.34 or newer and OpenSSL 3: Debian 12 (bookworm) or newer, Raspberry Pi OS based on bookworm, Ubuntu 22.04 or newer. **Debian 11 (bullseye) cannot run it**, and installing OpenSSL 3 alone does not fix that, because glibc is too old as well. On bullseye the server still starts and Java players are unaffected, but every Bedrock player gets a generic connection error ("Search help.minecraft.net for Terracotta"), and nothing shows up in the server log because they never reach it.

Check with:

```
ldd --version | head -1     # needs 2.34 or higher
cat /etc/os-release | head -1
```

If you are on bullseye, either reinstall with a current Raspberry Pi OS image (simplest), or upgrade in place as described in "Upgrading a bullseye Pi to bookworm" at the end of the server section.

# Intro

The four main sections describe steps to set up the 

1. server
2. normal multi-player
3. python
4. scratch

These could be done on 4 different computers across the world or all on the same computer. Setting up the server is by far the most complex, and need only be done by one administrator. All others can connect with minimal technical expertise (e.g., students).

# Setting up the server 

Three ways to do this. The Mac/Linux instructions install everything by hand and are the most work but the least magic. The Docker instructions further down are easier and work on any operating system, at the cost of learning a little Docker.

## Mac/Linux

Note: updates to servers/plugins may require stopping your server, repeating steps 1-4 and 10-12, and re-starting the server. Backup your worlds and your jar files before updating.


1. Make sure java is up to date

```
java -version
```

If this is not 25 or higher, you need to update java. Minecraft 26.1 and newer requires Java 25; with anything older, Paper prints "Minecraft 26.1 and newer requires running the server with Java 25 or above" and exits.

See here for more general directions: https://docs.papermc.io/misc/java-install

On the Raspberry Pi, the default repo isn’t good enough. This installs JDK 25 from Adoptium (Temurin):

```
sudo apt update
sudo apt upgrade
sudo apt install curl gnupg ca-certificates
curl -s https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo $VERSION_CODENAME) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install temurin-25-jdk
```

If more than one Java is installed (older versions of these instructions installed `zulu21-jdk`), `java` may not be the one you just installed, and a system upgrade can silently switch it. Pin it:

```
sudo update-alternatives --config java    # pick the 25 one
java -version
```

2. Download the official Minecraft server: 
https://www.minecraft.net/en-us/download/server

3. Download the paper server:
https://papermc.io/downloads

4. Make a new folder ("minecraft-server") and move jar files downloaded in steps 2-3 into that folder

```
mkdir ~/minecraft-server
cd ~/minecraft-server
mv ~/Downloads/*.jar .
```

5. Inside a terminal within your minecraft-server directory, run the paper server:

```
java -Xmx2048M -Xms2048M -jar paper-26.3-200.jar
```

You may need to adjust the name of the jar file to match the version you downloaded

6. Edit eula.txt so that you agree to the end user license agreement

```
eula=true
```

7. Edit the server.properties and other config files to your liking (you can specify world seeds, flat worlds, survival mode, no monsters, etc). If you're testing Python/Scratch code, I strongly recommend a flat creative world.

8. You can skip this step if all users are playing with "Minecraft: Java Edition" (mostly PCs). These plugins allow Bedrock players (tablets, gaming consoles) to join our Java server:

	- Download the geyser-spigot.jar plugin:
https://ci.opencollab.dev/job/GeyserMC/job/Geyser/job/master/
	- Download the floodgate-spigot.jar plugin:
https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/

After the first start (step 11), turn on NetherNet in `plugins/Geyser-Spigot/config.yml`. Geyser still defaults to the old RakNet protocol, which current Bedrock clients no longer use (see "Operating system requirements for Bedrock players" above). In the `bedrock:` section:

```
  port: 19132
  webrtc-port: 19133        # NetherNet gameplay (UDP); must differ from port when transport is "both"
  transport: both           # NetherNet for current clients, RakNet for any not yet updated
  signaling:
    mode: builtin           # players find the server over TCP on "port" above
    builtin:
      advertise-addresses: ["YOUR.EXTERNAL.IP", "192.168.1.XXX"]
```

`advertise-addresses` is the address Geyser tells each player to send game traffic to. Left empty, it hands out the server's own addresses, which behind a home router means a 192.168.x.x address that is unreachable from outside. List your external IP (`curl ipinfo.io/ip`) for WAN players and the internal IP for LAN players. If your ISP changes your external IP, this has to be updated too.

Restart and check the log. You want:

```
[Geyser-Spigot] Built-in signaling started on http://0.0.0.0:19132, with NetherNet on UDP port 19133
```

and NOT `NetherNet will not start! Could not load its WebRTC native library`, which means the operating system is too old (Debian 11 or earlier).

Bedrock players will see a "Trust on First Use?" prompt on their first join, because signaling is served over plain http. That is harmless. To get rid of it, point `signaling.builtin.https.certificate` and `private-key` at the same certificate as step 16, keeping in mind the permissions problem described in step 16(c) applies to Geyser too.

9. You can skip this step if you just want a multi-player server (no scratch or python).

Download FruitJuice plugin:
https://github.com/jdeast/FruitJuice/releases/latest

10. Move the jar files you downloaded from steps 8-9 into the plugins directory

```
mv ~/Downloads/*.jar ~/minecraft-server/plugins/
```

11. Restart the paper server

```
java -Xmx2048M -Xms2048M -jar paper-26.3-200.jar
```

12. You can kill the server, edit ~/minecraft-server/plugins/*/config.yml files, and restart again to change the settings for the plugins, if desired.

13. You can skip this step if you're only connecting locally (from computers all connected to the same router), and not with scratch.

On your router, forward these to the same ports on your server (or different port numbers if you've changed the defaults):

| Port | Protocol | For |
|---|---|---|
| 25565 | TCP | Java edition |
| 19132 | **TCP and UDP** | Bedrock: TCP for NetherNet signaling (finding the server), UDP for older RakNet clients |
| 19133 | UDP | Bedrock: NetherNet gameplay (Geyser's `webrtc-port`) |
| 14711 | TCP | scratch |
| 4711 | TCP | python (see the security note below) |

Before NetherNet, forwarding 19132 as UDP only was enough. It no longer is: without the TCP forward Bedrock players cannot find the server, and without 19133/UDP they find it but cannot play.

Ports 80 (http) and 443 (https) are only needed if you generate your SSL certificate with certbot's `--standalone` mode (step 16, Option 2b). If you use the DNS challenge instead, you never need to open them.

SECURITY NOTE: port 4711 is FruitJuice's raw command port and it has no authentication whatsoever. Anyone who can reach it can edit your world, move players, and spawn entities. Only forward it if you actually need to run python from outside your home network; scratch does not need it, because websockify reaches it over localhost.

Unfortunately, the details depend on the specifics of your router. You can google something like "{router model} + port forwarding", but generally it's something like

a. In a browser, type 192.168.1.1 in the main bar (if that doesn't work, try 192.168.1.0, 192.168.0.0, or 192.168.0.1)

b. login (google your router name for the default username/password, or it may be on a sticker on the router)

c. Click on "port forwarding"

d. Add a forward from the ports above to your minecraft server's internal IP (usually something like 192.168.1.XXX).

16. You can skip this step if you don't want to use scratch.

We need a proxy to relay scratch's websocket traffic on port 14711 to FruitJuice's TCP traffic on port 4711. We'll use websockify for this.

Option 1: Insecure websockets (local testing only)

In a terminal on your minecraft server, type:

```
sudo apt-get install websockify # only once
websockify 14711 localhost:4711 & # must be running for scratch
```

This sends every command in the clear, and modern browsers block insecure `ws://` connections from an `https://` page as "mixed content". The scratch page is served over https, so each user has to override that. They still use the same URL -- the extension tries a secure connection first and falls back to this one:

https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js

and then clicking the icon at the left of the browser's address bar and allowing "insecure content" for that site. Without that exception, scratch will silently fail. Use Option 2 for anything beyond a quick test.


Option 2: Secure websockets (recommended)

Using secure websockets is much easier for the end-users, but is harder for the server setup because it requires a domain name and an SSL certificate that must be renewed every 90 days.

Users will go here:
https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js

a) Register for a free (sub)domain name at duckdns.org and point it at your external IP. Pick whatever name you want; for this tutorial we'll call it "MY_MINECRAFT_SERVER". To find your external IP, run this on your server:

```
curl ipinfo.io/ip
```

duckdns.org can also update this for you automatically if your ISP changes your IP.

IMPORTANT: whatever name you pick here is the name users must type into the scratch connect block, character for character. The certificate is only valid for the exact name(s) it was issued for. If your certificate was issued for `MY_MINECRAFT_SERVER.duckdns.org` and a user types any other name, the browser rejects the connection and scratch fails silently, even if both names point at the same server. If you want two names to work, pass both to certbot with two `-d` flags.

b) Generate the SSL certificate. There are two ways; the DNS challenge is recommended because it does not require opening any ports.

DNS challenge (recommended):

```
sudo apt-get install certbot
sudo pip install certbot-dns-duckdns
sudo certbot certonly \
  --authenticator dns-duckdns \
  --dns-duckdns-token YOUR_DUCKDNS_TOKEN \
  -d MY_MINECRAFT_SERVER.duckdns.org
```

Your DuckDNS token is on your account page at duckdns.org.

Standalone challenge (needs ports 80 and 443 forwarded to your server):

```
sudo apt-get install certbot
sudo certbot certonly --standalone -d MY_MINECRAFT_SERVER.duckdns.org
```

If this fails, check that ports 80 and 443 are correctly forwarded and that your external IP is correctly mapped to your subdomain at duckdns.org.

c) Certbot generates the certificate readable only by root. Change the permissions so websockify can read it as a regular user:

```
sudo chmod -R 755 /etc/letsencrypt/
```

THIS IS THE MOST COMMON WAY THIS SETUP BREAKS. Every time certbot renews, it resets `/etc/letsencrypt/live` and `/etc/letsencrypt/archive` back to root-only. websockify does not treat an unreadable certificate as an error: it prints a warning, falls back to serving unencrypted `ws://`, and keeps running. Everything looks up, but every browser now refuses to connect. So a setup that worked for 90 days suddenly stops the day after a renewal. The `--ssl-only` flag in step (d), the deploy hook in step (f), and the service in step 17 all exist to prevent this.

Verify the certificate is readable *as the user that will run websockify*, without sudo:

```
ls -l /etc/letsencrypt/live/MY_MINECRAFT_SERVER.duckdns.org/fullchain.pem
```

d) Install and run websockify (changing MY_MINECRAFT_SERVER to your subdomain):

```
sudo apt-get install websockify # only once
websockify --ssl-only \
           --cert=/etc/letsencrypt/live/MY_MINECRAFT_SERVER.duckdns.org/fullchain.pem \
           --key=/etc/letsencrypt/live/MY_MINECRAFT_SERVER.duckdns.org/privkey.pem \
           14711 localhost:4711 & # must be running for scratch
```

Do not omit `--ssl-only`. It is what turns the silent fallback described in step (c) into a loud startup error, so a permissions problem stops the relay instead of quietly downgrading it to something no browser will talk to.

e) Verify it from any machine, ideally not the server itself:

```
openssl s_client -connect MY_MINECRAFT_SERVER.duckdns.org:14711 \
  -servername MY_MINECRAFT_SERVER.duckdns.org \
  -verify_hostname MY_MINECRAFT_SERVER.duckdns.org </dev/null
```

You want to see `Verify return code: 0 (ok)` and a `subject=` line naming your domain. See the scratch troubleshooting section below for what the common failures look like.

Note that `-verify_hostname` is required. Without it, openssl does not check the name against the certificate and will happily report success for a name the browser will reject.

f) Renewing. The certificate must be renewed every 90 days:

```
sudo certbot renew
```

Attach a deploy hook so the permissions from step (c) are reapplied and the relay restarted every time the certificate is replaced. Without this, renewal is what breaks your server:

```
sudo certbot renew --deploy-hook "chmod -R 755 /etc/letsencrypt/ && systemctl restart websockify"
```

(this assumes the systemd service from step 17; certbot installs its own timer to run renewals automatically)

17. The minecraft server and websockify must both be running for scratch to work. You can start websockify by hand each time you want to play, but it is worth making it a service so it survives reboots and restarts itself on failure.

Create `/etc/systemd/system/websockify.service`, changing MY_MINECRAFT_SERVER to your subdomain and `pi` to the user you run the server as:

```
[Unit]
Description=websockify relay for FruitJuice scratch
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
ExecStart=/usr/bin/websockify --ssl-only \
  --cert=/etc/letsencrypt/live/MY_MINECRAFT_SERVER.duckdns.org/fullchain.pem \
  --key=/etc/letsencrypt/live/MY_MINECRAFT_SERVER.duckdns.org/privkey.pem \
  14711 localhost:4711
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then enable it:

```
sudo systemctl daemon-reload
sudo systemctl enable --now websockify
systemctl status websockify
```

`journalctl -u websockify -n 50` shows the log, including certificate errors on startup.

Alternatively you can set up cron jobs to start and stop things at certain times of day. Read about [linux services](https://medium.com/@benmorel/creating-a-linux-service-with-systemd-611b5c8b91d6) or [crontab](https://ostechnix.com/a-beginners-guide-to-cron-jobs/)

18. Once you have it all set up, you can make other servers easily by copying the minecraft-server folder, and deleting the new "world*" directories, editing the config files, and regenerating the SSL certificates. If your server is powerful enough, you can run multiple simultaneous servers by changing the ports (and adding more port forwards), or you can manually start different worlds with different settings. I strongly recommend a separate, flat, creative world for scratch/python, as it's easy for mistakes to do a lot of damage.

## Upgrading a bullseye Pi to bookworm

Only needed if your Pi runs Debian 11 (bullseye) and you want Bedrock players (see "Operating system requirements for Bedrock players"). Raspberry Pi does not officially support upgrading in place and recommends a fresh image instead; in-place does work, but if the Pi fails to boot afterwards, fixing it needs someone physically at it. Back up your worlds, `/etc`, and your crontab to another machine first.

Stop the minecraft server, then:

```
# bullseye is past end of life, and its security archive has been removed, so
# "update bullseye fully first" now fails with 404s. Go straight across.
sudo sed -i 's/bullseye/bookworm/g' /etc/apt/sources.list /etc/apt/sources.list.d/*.list
sudo sed -i '/^deb .*debian/ s/ non-free$/ non-free non-free-firmware/' /etc/apt/sources.list
sudo apt update

# bullseye's dpkg cannot unpack Raspberry Pi's bookworm packages (they use zstd
# compression: "unknown compression for member 'control.tar.zst'"). Upgrade
# dpkg itself before anything else.
sudo apt install dpkg

sudo apt upgrade --without-new-pkgs
sudo apt full-upgrade
sudo apt autoremove
```

Run it somewhere that survives a dropped ssh connection (`screen`, `tmux`, or `nohup`), since it takes 30-60 minutes. Keep your existing config files when asked.

Before rebooting, if the Pi is on Wi-Fi only, check that networking will come back: an upgraded system keeps `dhcpcd` and `wpa_supplicant` (a fresh bookworm image uses NetworkManager instead), so `systemctl is-enabled dhcpcd wpa_supplicant` should say `enabled` twice. Then reboot, and check Java again (step 1): the upgrade can switch `java` to a different installed version, and Paper will refuse to start.

## Windows

See here:
https://help.minecraft.net/hc/en-us/articles/360058525452-How-to-Setup-a-Minecraft-Java-Edition-Server

Then continue with step 7 in linux directions. The websockify step will be different.

Try using windows powershell, which should be fairly unix-like. If you'd like to contribute more detailed directions, please email me.

## Docker (any OS)

Thanks to [mwrowe](https://github.com/mwrowe) for working this out.

Docker runs the whole server inside a "container": an isolated bundle that already has the right Java and the right Paper version inside it, using your computer's resources but unable to touch anything you have not explicitly shared with it. When you are done you shut it down and delete it, and your system is exactly as it was. That makes it a much gentler path than steps 1-12 above, and it works the same on Mac, Linux and Windows.

You still need steps 13 and 16-17 above if you want scratch, because the SSL certificate and the websocket relay live outside the container. Skip the rest.

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/ and start it.

2. Make a folder for your server with two subfolders inside it:

```
mkdir -p ~/minecraft-server/data ~/minecraft-server/plugins
```

`data` is where your worlds and configs will live; `plugins` is where the plugin jars go. Both survive the container being deleted, so this is what you back up.

3. Put the FruitJuice jar into the `plugins` folder. Download the latest one from https://github.com/jdeast/FruitJuice/releases/latest

If you want players on older or newer Minecraft versions to be able to connect, also drop ViaVersion.jar in there from https://hangar.papermc.io/ViaVersion/ViaVersion

4. Save this as `docker-compose.yml` in `~/minecraft-server`:

```yaml
services:
  fruitjuice:
    image: itzg/minecraft-server
    tty: true
    stdin_open: true

    ports:
      - "25565:25565"        # java edition gameplay
      - "19132:19132/udp"    # bedrock edition, via geyser (older RakNet clients)
      - "19132:19132/tcp"    # bedrock NetherNet signaling
      - "19133:19133/udp"    # bedrock NetherNet gameplay (geyser's webrtc-port)
      - "4711:4711"          # FruitJuice, for python and for websockify
      - "25575:25575"        # rcon, optional; must match RCON_PORT below

    environment:
      EULA: "TRUE"           # https://www.minecraft.net/en-us/eula
      TYPE: "PAPER"
      VERSION: "1.20.6"      # keep this close to what FruitJuice was built against
      MEMORY: "2G"           # raise it if your machine can spare more

      DIFFICULTY: "normal"
      MODE: "creative"
      SERVER_NAME: "FruitJuice"
      ALLOW_CHEATS: "true"
      OPS: "${OPS_PLAYERS}"  # comma separated, these players get admin powers

      # bedrock edition support, downloaded automatically
      PLUGINS: |
        https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot
        https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot

      # remote console, so you can type server commands without being in the game
      ENABLE_RCON: "true"
      RCON_PASSWORD: "${RCON_PASSWORD}"
      RCON_PORT: "25575"

    volumes:
      - ./data:/data
      - ./plugins:/plugins
```

Note there is no port 14711 here even though that is the scratch port. Websockify runs on your computer rather than inside the container, and reaches FruitJuice through the 4711 mapping above. See step 16.

5. The compose file expects two values that are deliberately not written into it. Put them in a file named `.env` in the same folder:

```
OPS_PLAYERS=your_minecraft_username
RCON_PASSWORD=pick-something-long-and-not-reused
```

Never commit that file anywhere. Anyone with the RCON password can run any command on your server.

6. Start it:

```
cd ~/minecraft-server
docker compose up
```

The first run downloads the image and builds the world, so it takes a while. Watch the output for errors. Add `-d` to run it in the background instead.

To stop it, press control-C in that terminal, which kicks off anyone playing. If you started it with `-d`, use `docker compose down` from the same folder instead.

7. Connect from Minecraft as usual. Use `localhost:25565` if you are playing on the same computer that is running Docker, or the host computer's IP address if not. Bedrock players use port 19132, but only after you turn on NetherNet: after the first start, edit `data/plugins/Geyser-Spigot/config.yml` as described in step 8 of the Mac/Linux instructions and restart. The container brings its own operating system, so the Debian version requirement does not apply here.

SECURITY NOTE: the same warning as step 13 applies, and more so. Port 4711 has no authentication of any kind, and RCON has one password between a stranger and total control of your server. Do not forward either of them from your router unless you have thought hard about it.

# Normal Multi-player

1. Install minecraft
https://www.minecraft.net/en-us/download

2. Begin minecraft 
	- Java:
		- select multiplayer 
		- Click "add server"
		- Enter whatever you like for "Server name"
		- Enter the server's IP for "Server address"
			- For WAN connections, this should be the external IP of the router
			- For LAN connections, this should be the internal IP
		- Click "Join server"
	- Bedrock
		- Select "servers" tab
		- Click "add server"
		- Enter whatever you like for "Server name"
		- Enter the server’s IP for "Server address"
			- For WAN connections, this should be the external IP
			- For LAN connections, this should be the internal IP
		- Enter 19132 for the port
		- Click "Join server"
		- The first time you join, accept the "Trust on First Use?" prompt
		- "An error has occurred ... Search help.minecraft.net for Terracotta" means the client never reached the server. Usually the server's Geyser is not set up for NetherNet, or ports 19132/TCP and 19133/UDP are not forwarded. See server steps 8 and 13.

# Python

1. Install Python 3

https://www.python.org/downloads/

During the installation, be sure to check the box to update your path to include python and pip, or you’ll get "command not found" errors in the next steps

2. Install [pyncraft](https://github.com/jdeast/pyncraft). In a terminal, type

```
pip install pyncraft
```

3. Run your python code:

```
python trex.py
```

This will render a T-rex inside minecraft at the first player's position, or at 0,50,0 if no one is logged in.

# Scratch

0. Make sure the server was set up with websockify to forward the websocket traffic to our minecraft server and has a valid SSL certificate.

1. In a JavaScript-enabled web browser (some browsers on tablets do not allow this), navigate to [this URL](https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js)

This loads a standard scratch interface, but with an additional "Minecraft" set of command blocks that allow you to connect to your server, chat, set blocks, spawn entities, etc.

2. Load FruitJuice/scratch/examples/rainbow_tower.sb3

3. Edit the connect block to match your server. The address must be the exact domain the certificate was issued for (MY_MINECRAFT_SERVER.duckdns.org). The port is already correct: the block defaults to 14711, which is the port websockify listens on in these instructions. If you connect to a port nothing is listening on, scratch fails silently with no error in the browser.

4. Click the green flag and watch it build a rainbow tower.

## Troubleshooting

Almost every failure here is silent: the connect block simply never finishes and nothing appears in minecraft. Open your browser's developer tools (F12) and look at the Console tab, then work through the layers from the bottom up. Replace MY_MINECRAFT_SERVER and 14711 with your own values.

1. Is FruitJuice listening? On the server:

```
nc -z localhost 4711 && echo "plugin OK"
```

If this fails, the minecraft server or the FruitJuice plugin is not running.

2. Is the relay reachable? From another machine:

```
nc -z MY_MINECRAFT_SERVER.duckdns.org 14711 && echo "relay reachable"
```

If this fails, websockify is not running, or the port is not forwarded, or you are testing the wrong port number.

3. Is TLS actually working?

```
openssl s_client -connect MY_MINECRAFT_SERVER.duckdns.org:14711 \
  -servername MY_MINECRAFT_SERVER.duckdns.org \
  -verify_hostname MY_MINECRAFT_SERVER.duckdns.org </dev/null
```

What the results mean:

- `Verify return code: 0 (ok)` plus a `subject=` line with your domain -- the server side is fine, and the problem is in the browser or in what was typed into the connect block.

- `no peer certificate available` -- websockify is serving unencrypted `ws://` because it could not read the certificate, usually the permissions problem described in step 16(c). The browser blocks this as mixed content. Fix the permissions and add `--ssl-only` so this fails loudly next time.

- `Verify return code: 62 (Hostname mismatch)` -- the certificate is valid but was not issued for the name you connected to. Either connect using the exact name on the certificate, or reissue it covering the name you want. In the server's websockify log this shows up as `handler exception: [SSL: SSLV3_ALERT_CERTIFICATE_UNKNOWN] sslv3 alert certificate unknown`, which is the browser rejecting your certificate.

- `certificate has expired` -- run `sudo certbot renew`, then reapply the permissions from step 16(c).

4. Browser console messages:

- "Mixed Content: ... was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint" -- the relay is not using TLS. See step 3 above. No browser setting fixes this properly; fix the server.

- "WebSocket handshake" or "ERR_CERT_*" errors -- a certificate problem. Visiting `https://MY_MINECRAFT_SERVER.duckdns.org:14711` directly in a tab will show the certificate error in full, which is much more informative than the console message.

## More info

[This website](https://www.instructables.com/Coding-in-Minecraft-With-Scratch/) describes connecting to a Forge server running RaspberryJamMod instead of a Bukkit server running FruitJuice as we are.

So ignore the installation and their scratch link, (steps 1 & 2 -- they won't work with our server), but its use is basically identical (our scratch plugin is a slightly modified version of theirs). You can follow along with the examples and explanations starting at step 3.

# Credits
A huge thank you to developers of all the plugins (Paper, RaspberryJuice, Geyser, Floodgate) used!

These directions were a combination of the directions here (java+bedrock)
https://jamesachambers.com/minecraft-java-bedrock-server-together-geyser-floodgate/

And here: (python)
https://jeremypedersen.com/posts/2022-03-28-mcpi-macos/

And here: (scratch)
https://www.instructables.com/Coding-in-Minecraft-With-Scratch/

Along with useful discussions with James A. Chambers (https://jamesachambers.com/)

