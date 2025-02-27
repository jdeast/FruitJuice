How to set up a Python and scratch enabled, Java+Bedrock server that allows remote connections

# Compatibility

Running custom servers is fragile because nothing is officially supported. Many components (written by passionate volunteers) have bugs that impact performance or behaviors you might be used to with the offical game. When Minecraft updates, sometimes that breaks the various plugins. It's best to wait a week or two after major updates for fixes and bugs to work their way through.

These instructions were working as of 2024-06-18 with the latest versions of minecraft and all plugins on a Rasbperry Pi 4 Model B with 4 GB with a Raspbian Lite 32 bit OS. There is nothing particularly special about the Raspberry Pi -- many inexpensive "single board computers" will work (as well as standard computers). The better the computer, the more complex worlds you can host, the more people can play, or the more simultaneous servers you can support.

You may wish to disable minecraft updates after setting this up to avoid unexpected incompatibilities. Most major minecraft updates require corresponding plugin updates.

Minecraft Java 1.21
Minecraft Bedrock 1.21

Paper 1.21.4
Geyser-Spigot #567
Floodgate-Spigot #109
FruitJuice-0.3.0

# Intro

The four main sections describe steps to set up the 

1. server
2. normal multi-player
3. python
4. scratch

These could be done on 4 different computers across the world or all on the same computer. Setting up the server is by far the most complex, and need only be done by one administrator. All others can connect with minimal technical expertise (e.g., students). 

# Setting up the server 

## Mac/Linux

Note: updates to servers/plugins may require stopping your server, repeating steps 1-4 and 10-12, and re-starting the server. Backup your worlds and your jar files before updating.


1. Make sure java is up to date

```
java –-version
```

If this is not 21 or higher, you need to update java. 

See here for more general directions: https://docs.papermc.io/misc/java-install

On the Raspberry Pi, the default repo isn’t good enough. This will install jdk-21 from zulu (thanks https://pimylifeup.com/raspberry-pi-java/, modified to use non-headless as recommended by paper)

```
sudo apt update
sudo apt upgrade
sudo apt install curl gnupg ca-certificates
curl -s https://repos.azul.com/azul-repo.key | sudo gpg --dearmor -o /usr/share/keyrings/azul.gpg
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/azul.gpg] https://repos.azul.com/zulu/deb stable main" | sudo tee /etc/apt/sources.list.d/zulu.list
sudo apt update
sudo apt install zulu21-jdk

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
java -Xmx2048M -Xms2048M -jar paper-1.21.4.jar
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

9. You can skip this step if you just want a multi-player server (no scratch or python).

Download FruitJuice plugin:
https://github.com/jdeast/FruitJuice/blob/master/target/

10. Move the jar files you downloaded from steps 8-9 into the plugins directory

```
mv ~/Downloads/*.jar ~/minecraft-server/plugins/
```

11. Restart the paper server

```
java -Xmx2048M -Xms2048M -jar paper-1.20-17.jar
```

12. You can kill the server, edit ~/minecraft-server/plugins/*/config.yml files, and restart again to change the settings for the plugins, if desired.

13. You can skip this step if you're only connecting locally (from computers all connected to the same router).

On your router, forward ports 19132 (bedrock), 25565 (java), 4711 (python), and 14711 (scratch), to the same ports on your server (or different port numbers if you’ve changed the defaults). 

Unfortunately, the details depend on the specifics of your router. You can google something like "{router model} + port forwarding", but generally it's something like

a. In a browser, type 192.168.1.1 in the main bar (if that doesn't work, try 192.168.1.0, 192.168.0.0, or 192.168.0.1)

b. login (google for the default username/password, or it may be on a sticker on the router

c. Click on "port forwarding"

d. Add a forward from the ports above to your minecraft server's internal IP

16. You can skip this step if you don't want to use scratch.

We need a proxy to relay scratch's websocket traffic on port 14711 to FruitJuice's TCP traffic on port 4711. On your server:

```
sudo apt-get install websockify # only once
websockify 14711 localhost:4711 # must be running for scratch
```

17. The server and websockify must be running for the server to work. You can start it manually whenever you want to play (skip this step), set it up so they run automatically on startup, or set up cron jobs to start/stop it automatically at certain times. 
Read about [linux services](https://medium.com/@benmorel/creating-a-linux-service-with-systemd-611b5c8b91d6)
or [crontab](https://ostechnix.com/a-beginners-guide-to-cron-jobs/)

18. Once you have it all set up, you can make other servers easily by copying the minecraft-server folder, and deleting the new "world*" directories, and editing the config files. If your server is powerful enough, you can run multiple simultaneous servers by changing the ports (and adding more port forwards), or you can manually start different worlds with different settings when you want to play a different way. I strongly recommend a separate, flat, creative world for scratch/python, as it's easy for mistakes to do a lot of damage.

## Windows

See here:
https://help.minecraft.net/hc/en-us/articles/360058525452-How-to-Setup-a-Minecraft-Java-Edition-Server

Then continue with step 7 in linux directions. The websockify step will be different.

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

0. Make sure the server was set up with websockify to forward the websocket traffic to our minecraft server.

1. In a java-enabled web browser (some browsers on tablets do not allow this), navigate to [this URL](http://pruss.mobi/scratch/?load_plugin=http://cfa.harvard.edu/~jeastman/scratch.js)

This loads a standard scratch interface, but with an additional "Minecraft" set of command blocks that allow you to connect to your server, chat, set blocks, spawn entities, etc.

2. Load FruitJuice/scratch/examples/rainbowtower.sb

3. Edit the address in the connect block to match your server's IP.

4. Click the green flag and watch it build a rainbow tower.

NOTE: Debugging is hard as many failures are silent. Your browser's developer tools may help. 

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

