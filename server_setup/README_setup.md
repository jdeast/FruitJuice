# Minecraft Server Setup Using Docker
### Customized to run python using PynCraft via FruitJuice and RCON

How to set up a Python- and Scratch-enabled, Java+Bedrock server using Docker 
that allows remote connections.  You can interact with the Minecraft world
hosted on this server using the 
[PynCraft python package](https://github.com/jdeast/pyncraft/tree/main).
Details on setting up python and `PynCraft` are provided at that link.

## Overview

Setting up your own server can be challenging.  Luckily, you shouldn't have 
to!  Docker is an application that lets you run a "container" from your 
computer, or from a server in the cloud.  This container acts like a separate
server even though it is using its host computer's resources.  

You configure the container to specify what resources-- like memory, 
communication ports and shared directories-- it can use.  Even though it
is running on the host, it is isolated from the host and can only access
what you specify.  Often the container will be running a different OS, and
is provisioned with exactly the software it needs to do its job.  If it 
needs to install, say, a different C or Java compiler, you don't have to 
worry about it messing with your system, because it is isolated.  When you
are done with it, you shut it down, and delete it, leaving your system 
unchanged.

The recommended procedure here is:

1) Install the software you need-- Minecraft and Docker
2) Configure the directory you will work in.
3) Copy and customize the `docker-compose.yml` file that specifies the
   docker configuration.
4) Run `docker compose up` to start the server!

Once the minecraft server is running, multiple players can connect to it.
This guide assumes you will be setting up the server on a personal computer
that sits behind a firewall in your home or school network.  To connect to
the server from that network, you can use `localhost` if you are connecting 
from the same machine that is running docker (the host); otherwise,
you will need to know the IP address of the host.  

Caveat emptor: if you expose ports in your local network to let others 
connect to your server from the internet, you expose yourself to being hacked!
It is probably best to set up a DMZ within your network to isolate the server 
from your other computers/devices, or better yet, use cloud hosting.  If you 
have no idea what I am talking about, you are probably better off keeping access
to within your VPN.

## The Dreaded Command Line

All of what is described here can be done without using the command line--
the terminal app.  But once you get used to it, the terminal is probably 
easier, and you should really learn to use the terminal if you want to
be a programmer.

Windows now includes WSL, the "Windows Subsystem for Linux". This allows you to 
install a Linux distribution (like Ubuntu, Debian, Fedora or Mint) with
`bash` or another shell (like, terminal app).  If you learn `bash`, it gives you 
super powers on all three major operating systems (Windows, Linux, MacOS)!

The only part of this that **has** to be run from the command line (I think)
is the `docker compose` command for starting and stoppin the docker container.
You can accomplish the same thing from within the Desktop app (I think),
but docker compose makes it super easy.

_(work in progress -- not sure how much detail to go into)_

## Software Installs

### Minecraft:  

You will need a current copy of Minecraft, and a Minecraft account to use
on the server.  If you've already been playing Minecraft, you're good to go. 

Otherwise, go to https://www.minecraft.net/en-us/download and then buy
the "Minecraft: Java & Bedrock" game license.  Choose a player name.

### Docker

Docker desktop can be downloaded for free by individuals and schools
from https://docs.docker.com/get-started/get-docker/.  Choose the appropriate 
version for your operating system.  Note that **you must have Docker running 
when you launch the minecraft server.**

## Server Directory Configuration

You will need to set up the directory where you will run your server from.
It's easiest (in terms of less typing) if you use your home directory as
the root.  I would suggest something like this:

```
~/minecraft
     /server
         /plugins
             FruitJuice.jar
             ViaVersion.jar
         /data
         docker-compose.yml
         .env
    /code
        venv
        (the python files you write)
```

All your server stuff will go in the the (you guessed it) server subdirectory.
It holds:

- The `/plugins` subdirectory:

  This is used to add plugins, as `*.jar` files, to the server.

  - **FruitJuice.jar** contains the compiled source code of this package,
    which enables your server to provide an API you can use with Python.

    Download the FruitJuice plugin from the FruitJuice git repo: 
    https://github.com/jdeast/FruitJuice/tree/master/target

    Click on the `FruitJuice-0.x.0.jar` file that is the latest version,
    choose "download raw", then copy it to the `plugins` directory(s) shown above.

  - The **ViaVersion.jar** plugin lets users connect to your server when 
    they are running newer versions of Minecraft, so you don't always have 
    to update your server to the latest.  This is helpful if, for instance, 
    PaperMC is lagging behind the current version.

    Download it from https://hangar.papermc.io/ViaVersion/ViaVersion.

- The `data` subdirectory:

  This will be "mapped" to the directory on the server that contains all 
  the data for the minecraft world that you are hosting.  That way you can
  get things like snapshots.  The contents will be created when you create
  the server.

  If at some point you want to delete this world (for example, if you wanted
  to change to a different seed), delete this directory and then 
  recreate it witout contents.

  You can give this a different name for each world if you want to maintain
  more than one.  If you do, you have to change the mapping in the 
  `docker-compose.yml` file (see Configuring the Server below).

- The `docker-compose.yml` file specifies your server configuration.

  Download it from here and add it to `minecraft/server/` as shown:
  https://github.com/jdeast/FruitJuice/tree/master/server_setup

- The `.env` file defines environment variables used by docker compose.

  These are variables that will be custom to your server.  Copy this file
  from the same directory that `docker-compose.yml` was in, and modify.
  See below for explanation of values.


## Configuring the Server

The `docker-compose.yml` file specifies tells docker what Docker "image" to
use and what resources and parameters to give it when you run it.  The image 
contains the specification for the container: the operating system and all the 
software it needs to host minecraft.  We will use an image that is maintained 
by the **itzg group**.  This Docker image has been downloaded more than 
100 million times!  

The present document is only meant to get you started.  For more details on 
how you can customize your server, refer to their 
[documentation](https://hub.docker.com/r/itzg/minecraft-server).

### Environment Variables

You will need to set two environment variables, `OPS_PLAYERS` and 
`RCON_PASSWORD` that are expected by docker compose.  You can set these
by modifying the `.env` file described above, or you can set them from
the command line.  The latter will override the values in the file.

From the **MacOS or Linux** command line, export them as shown below 
("> " is the prompt; don't include it):
```
# this first command gives admin powers to the players (one is fine)
> export OPS_PLAYERS="my_players_name,another_admin_player"

# change this to make your server more secure when running RCON
> export RCON_PASSWORD="a_secure_password"
```
If you don't want to do this manually every time you start your server,
you can add it to your startup script (usually `~/.bashrc` or `~/.zshrc`).

On **Windows**, right-click the Windows icon on the taskbar and select "System", 
then click "Advanced system settings". In the System Properties window, click 
the "Environment Variables" button.  Then choose "System variable" and 
enter "OPS_PLAYERS" and "RCON_PASSWORD"  along with your values.

### Mapped Volumes
  
The `volumes` section tells what local directory on your computer will
hold the data for your world.  If you wanted to have a second world,
you could do something like this:
```
  volumes:
    # attach the subdirectory 'data' to the container's /data path
    - ./data-world2:/data
```
Leave the `plugins:plugins` mapping alone-- it is how the plugins get loaded.

### Bedrock Edition Compatibility

Two additional plugins will be installed automatically when the server is
started" `geyser-spiget.jar` and `floodgate-spiget.jar`  These will let 
players connect to your server using the **bedrock** edition of Minecraft.

**Note that even though they are connecting from bedrock, the commands they
run are based on java-edition.**

Bedrock players will connect through the bedrock port.

If you don't want to enable bedrock, you can comment out these lines.

### Remote Console (RCON) Support

RCON is a protocol that lets you issue Minecraft commands to the server.
If you are using the `pyncraft` package, it exposes this functionality 
through the `Minecraft.runCommands()` method.  If you don't want to use 
this, you can comment out the lines related to RCON.

### Other Settings

You may want to customize the `docker-compose.yml` before you use it, 
especially the ones related to game play.  Comments start with a `#`; the 
file is annotated to let you know what each line means.  

### Many Worlds

Note that each container can only host one world at a time (I think).
But you can run multiple containers-- just add another service.  Most of 
the settings would be the same, but you would have to change the port 
mapping on the host side, and give your players the new port numbers.  

For both ports and volumes, the settings are formatted like
`host:server`.  The server value should stay the same, but you would change
the host value so each server is connected to different ports and volumes
on the host.

You must also use a different volume  (like `/new-world-data:data`)

## Starting the Server!

The Docker Desktop tool (or the VSCode Docker plugin) provide a graphical 
interface for interacting with Docker images, containers or volumes. 
BUT they don't support `docker compose`-- you have to use the command line
for that.  You can open a terminal from the Docker Desktop app (look 
at the bottom right edge for ">_ Terminal") or in VSCode (at the upper 
right of the menu bar, click the middle rectangle where the bottom half
is highlighted) or as a standalone app.

### From the command line:
- Navigate to the directory for your server type:
    ```
    cd ~/minecraft-server/je
    ```
- Start the container!
    ``` 
    docker compose up
    ```
    The first time you run this, Docker will download the `itzg/minecraft-server`
    image from Dockerhub.  Then it will start the container; you will see its
    progress in the terminal.  It may give you some warnings; look over this
    stuff carefully if it fails to start properly.

### Join the server:

Start Minecraft.  From the launcher, choose either Java or Bedrock Edition
to match your server.  

The first time you connect, you will then need to create an New installation.
Give it a name like "Pycraft-1.20.6" (if that is the version of Minecraft
you are using) and select the version of Minecraft you specified in
the `docker-compose.yml` file.  

Then launch minecraft with this installation.  Pick **Multiplayer** mode,
then (the first time), "Add Server".  If you are running Minecraft on the
same computer that is hosting the server, you can set the Server Address
to `localhost:25565` where the number is the gameplay port in the 
`docker-compose.yml` file.  If the server is running on a different 
computer, replace `localhost` with the host computer's IP address.

Once the server has been added, you should be able to click on it to join.
You should disconnect when you are not playing.
    
### Stopping the server

- To stop the server, hit control-C from the command line.  This will kick 
  off anyone who is playing, so maybe warn them!  Note that you have to be 
  in the same terminal session that is showing output from the server.

- If you started the server in detached (`-d`) mode, make sure you are in
  in the same directory as the docker-compose.yml file, then enter:
    ```
    docker compose down
    ```
  This will both stop the container and remove it.  You should do this if
  you update the container's configuration.

- To list what containers you have running, you can type:
    ```
    docker ps -a
    ```
- You can see what docker images you have on your computer with:
    ``` 
    docker images
    ```
- If you want to remove an image to free up space, enter:
    ```
    docker image rm <container id>
    ```
  ...where `<container id>` can be just the first 5 characters of the 
  CONTAINER ID shown by the `docker images` command.  Note that you have
  to stop all the containers that use a given image before it can be deleted.

 ## Scratch

 ### Server Configuration

 This is not set up yet.  But I think the way to do this is to create
 a `Dockerfile` that looks something like this:

```
FROM itzg/minecraft-server

RUN apt-get install certbot websockify

ENV MINECRAFT_SERVER="my-minecraft-server-name"

RUN certbot certonly --standalone -d ${MINECRAFT_SERVER}.duckdns.org \
  && chmod -R 755 /etc/letsencrypt/ \
  && certbot renew

RUN websockify \
  --cert=/etc/letsencrypt/live/${MINECRAFT_SERVER}.duckdns.org/fullchain.pem \
  --key=/etc/letsencrypt/live/${MINECRAFT_SERVER}.duckdns.org/privkey.pem \
  14711 localhost:4711 & # must be running for scratch

EXPOSE 4711

# need to set this up to run the service automatically too...
 ```

### Client Configuration

1. In a java-enabled web browser (some browsers on tablets do not allow this), 
navigate to [this URL](https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js)

  This loads a standard scratch interface, but with an additional "Minecraft" 
  set of command blocks that allow you to connect to your server, chat, set
  blocks, spawn entities, etc.

2. Load FruitJuice/scratch/examples/rainbowtower.sb

3. Edit the address in the connect block to match your server's domain 
  (MY_MINECRAFT_SERVER.duckdns.org).

4. Click the green flag and watch it build a rainbow tower.

NOTE: Debugging is hard as many failures are silent. Your browser's developer 
tools may help. 

# Credits

A huge thank you to Geoff Bourne and the other contributors to the 
`itzg/docker-minecraft-server` Docker image.  Also many thanks to the developers
of all the plugins (Paper, RaspberryJuice, Geyser, Floodgate, ViaVersion) used!

These directions were a combination of the directions here (java+bedrock)
https://jamesachambers.com/minecraft-java-bedrock-server-together-geyser-floodgate/

And here: (python)
https://jeremypedersen.com/posts/2022-03-28-mcpi-macos/

And here: (scratch)
https://www.instructables.com/Coding-in-Minecraft-With-Scratch/

Along with useful discussions with James A. Chambers (https://jamesachambers.com/)

