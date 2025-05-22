# Minecraft Server Setup Using Docker
### Customized to run python using PynCraft via FruitJuice and RCON

How to set up a Python- and Scratch-enabled, Java+Bedrock server using Docker 
that allows remote connections.  You can interact with the Minecraft world
hosted on this server using the 
[PynCraft python package](https://github.com/jdeast/pyncraft/tree/main).

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

1) Install the software you need-- Minecraft, Docker, Python, VSCode, git, Scratch
2) Configure the directory you will work in.
3) Copy and customize the `docker-compose.yml` file that specifies the
   docker configuration.
4) Run `docker compose up` to start the server!

Once the minecraft server is running, multiple players can connect to it.
This guide assumes you will be setting up the server on a personal computer
that sits behind a firewall in your home or school network.  To connect to
the server from within that network, you can use `localhost` if you are
connecting from the same machine that is running docker (the host); otherwise,
you will need to know the IP address of the host.  

## The Dreaded Command Line

All of what is described here can be done without using the command line--
the terminal app.  But once you get used to it, the terminal is probably 
easier, and you should really learn to use the terminal if you want to
be a programmer.

_(work in progress)_

Windows now includes WSL, the "Windows Subsystem for Linux". This allows you to 
install a Linux distribution (like Ubuntu, Debian, Fedora or Mint) with a
shell (like, terminal app) that also runs on Mac OS with only minor differences.
This gives you super powers on all three major operating systems.

The only part of this that **has** to be run from the command line (I think)
is the `docker compose` command for starting and stoppin the docker container.
You can accomplish the same thing from within the Desktop app (I think),
but docker compose makes it super easy.

## Software Installs

### Minecraft:  

You will need a current copy of Minecraft, and a Minecraft account to use
on the server.  If you've already been playing Minecraft, you're good to go. 

Otherwise, go to https://www.minecraft.net/en-us/download and then buy
the "Minecraft: Java & Bedrock" game license.  Choose a player name.

### Docker

Docker desktop can be downloaded for free by individuals and schools
from https://docs.docker.com/get-started/get-docker/.  Choose the appropriate version for your operating system.

### Python

You don't actuall need python to run the server, but you do if you want to 
use it.  Go to:

https://www.python.org/downloads/

### Git

This is used to download open source code from the GitHub and other 
repositories.  Not strictly needed to run the server.

### Visual Studio Code (VSCode)

VSCode is a free Integrated Development Environment (IDE) application that
may be used for developing code.  It has a lot of nice features, like 
an editor that colors your python code and checks for errors, a debugger, 
an integrated terminal, a Docker plugin and tools for connecting to Docker containers so you can write code for them while they're running.  It even 
has AI built in to help you write code!  It's free-- give it a try!

## Configuration

#### NOTE: BEDROCK EDITION IS NOT YET WORKING!

You will need to set up the directory where you will run your server from.
It's easiest (in terms of less typing) if you use your home directory as
the root.  I would suggest something like this:

```
~/minecraft-server
    /bedrock
        /plugins
            FruitJuice.jar
        /data
        docker-compose.yml
    /je
        /plugins
            FruitJuice.jar
        /data
        docker-compose.yml
    /code
        venv
        (the python files you write)
```

Here `~` is your home directory.  The `bedrock` and `je` subdirectories will 
host bedrock and java-edition versions of your server.  If you're only
running one or the other, that's fine-- just pick that one.  But naming them
this way gives you the option to run both.  **NOTE: you can run a bedrock
_server_ from a MacOS or Linux host, but you can't _play_ from them-- the 
bedrock client only runs under Windows.**

In the `bedrock` and/or `je` subdirectories, create additional subdirectories
`plugins` and `data`.  The contents of these will be shared with the
docker container.  `plugins` will hold the `FruitJuice.jar` file that 
adds FruitJuice to the server.  `data` will be mapped to the directory
on the server that contains all the data for the minecraft world that
you are hosting.  

Download the FruitJuice plugin from here: 

https://github.com/jdeast/FruitJuice/tree/master/target

Click on the `FruitJuice-0.x.0.jar` file that is the latest version,
choose "download raw", then copy it to the `plugins` directory(s) shown above.

Get the `docker-compose.yml` file(s) from here:

https://github.com/jdeast/FruitJuice/tree/master/server_setup

Download the file and add it to the appropriate server version(s).

## Configuring the Server

The `docker-compose.yml` file specifies tells docker what "image" to
use and what resources and parameters to give it.  The image contains
the specification for the container, the operating system and all the 
software it needs to host minecraft.  We will use an image that is 
maintained by the **itzg group**.  This Java Edition image has been 
downloaded more than 100 million times!  The present document is only
meant to get you started.  For more details on how you can customize 
your server, refer to their [documentation](https://hub.docker.com/r/itzg/minecraft-server).

**You need to customize the `docker-compose.yml` before you use it.**
Comments start with a `#`; the file is annotated to let you know what each 
line means.  You should change:

- `OPS`: replace `AdminPlayerName` with your player name. This will give
  you admin privileges, which are needed for many commands.
- `RCON_PASSWORD`: The [RCON package](https://github.com/conqp/rcon) provides
  another way to send commands to minecraft independent of FruitJuice.  
  Setting a custom password helps secure your server, though it is not a
  big deal if you are running the server behind a firewall.

  You may also want to change some of the other settings that control
  game play. 
  
  The `volumes` section tells what local directory on your computer will
  hold the data for your world.  If you wanted to have a second world,
  you could do something like this:
  ```
   volumes:
      # attach the subdirectory 'data' to the container's /data path
      - ./data_world2:/data
  ```
Note that each container can only host one world at a time (I think).
But you can run multiple containers-- just add another service.  Most of 
the settings would be the same, but you would have to change the port 
mapping.  For both ports and volumes, the settings are formatted like
`host:server`.  The server value should stay the same, but you would change
the host value so each server is connected to different ports and volumes
on the host.

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

 


