# FruitJuice

A Minecraft Bukkit plugin that lets you build in Minecraft from Python or Scratch.

FruitJuice is a successor to RaspberryJuice. It implements the Minecraft Pi Python/Scratch API against a normal Bukkit/Paper server, so you do not need the Raspberry Pi edition of the game, and it works for both Java and Bedrock players.

See [README_server_setup.md](https://github.com/jdeast/FruitJuice/blob/master/README_server_setup.md) for step-by-step instructions to set up your own server.

## Quick start

You need a Bukkit/Paper server running this plugin. Then:

**Python.** Install the companion [pyncraft](https://github.com/jdeast/pyncraft) library and point it at the server:

```
pip install pyncraft
```

```python
from pyncraft.minecraft import Minecraft
mc = Minecraft.create("your.server.address", 4711)
mc.postToChat("hello world!")
```

**Scratch.** Open this URL, then use the "connect" block to reach your server:

https://jdeast.github.io/FruitJuice/?load_plugin=scratch.js

Scratch talks to the server through a websocket relay rather than directly, so the server also needs websockify. That is covered in the setup guide.

There is one URL whether or not the server has an SSL certificate. The extension tries a secure connection first and falls back to an insecure one, so a properly set up server is never downgraded. If your server has no certificate, the browser will also need to be told to allow insecure content for the page -- the error message says so when it happens.

## Commands

These are the commands the plugin itself understands, sent over TCP on port 4711 as `namespace.command(arg,arg,...)` followed by a newline. pyncraft wraps them in Python methods, and the Scratch extension wraps them in blocks; you only need this section if you are writing your own client or debugging one.

Anything that returns a value replies with a single line. Anything that fails replies with a line starting `Fail,`.

### world

 - `world.getBlock(x, y, z)` -> material name, e.g. `OAK_STAIRS`
 - `world.getBlockData(x, y, z)` -> the block's full state, e.g. `minecraft:oak_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]`. Note this value contains commas inside its brackets, so read the whole line rather than splitting it on commas.
 - `world.getBlocks(x1, y1, z1, x2, y2, z2)` -> comma-separated material names for the whole cuboid
 - `world.getBlockTypes()` -> comma-separated list of every material this server can actually place. Correct for the server's Minecraft version, and excludes items that are not blocks. Prefer this to a hardcoded list.
 - `world.setBlock(x, y, z, block)` -> none. Takes two further optional arguments: a facing (`NORTH`, `SOUTH`, `EAST`, `WEST`, `UP`, `DOWN`) and an attached face (`WALL`, `FLOOR`, `CEILING`). Omit them to let Minecraft choose. Beds, doors and tall plants automatically fill both of the blocks they occupy.
 - `world.setBlocks(x1, y1, z1, x2, y2, z2, block)` -> none. Fills a cuboid. Does not take a facing.
 - `world.getHeight(x, z)` -> y of the highest block at that column
 - `world.getPlayerIds()` -> entity ids of everyone online, separated by `|`
 - `world.getPlayerId(name)` -> that player's entity id
 - `world.getEntityTypes()` -> spawnable entity types as `id,NAME` pairs separated by `|`
 - `world.spawnEntity(x, y, z, entityType)` -> the new entity's id. Takes a name
   (`PIG`, `WARDEN`) or an old numeric id. Names are the only way to reach anything
   added since Minecraft 1.13, which has no numeric id.
 - `world.createExplosion(x, y, z, power)` -> none
 - `world.setSign(x, y, z, signType, facing, line1, line2, line3, line4)` -> none. `signType` is a material such as `OAK_SIGN`; `facing` is a direction name, not a number.
 - `world.setWallSign(x, y, z, signType, facing, line1, line2, line3, line4)` -> none
 - `world.getWorlds()` -> the names of every world on the server, separated by `|`, e.g. `world|world_nether|world_the_end`
 - `world.getCurrentWorld()` -> the name of the world this session is building in
 - `world.setWorld(name)` -> the name it switched to. Points this session at another world; every later coordinate is read in that world. Replies `Fail,` if there is no world by that name.

Every session starts in the server's first world. `world.setWorld` moves only the
session, not any player, so a script can build in a flat creative world while
people carry on playing somewhere else. Where in the new world the origin lands
follows the `location` config setting, the same as it does at startup.

### player

Every command below takes an **optional** entity id as its first argument, naming which player to act on. Send it and the command applies to that player; leave it out and it applies to the player the session is attached to. pyncraft sends it when you pass a `playerName` to `Minecraft.create()`; Scratch never sends it.

So `player.getPos()` and `player.getPos(42)` are both valid, as are `player.setPos(10,64,20)` and `player.setPos(42,10,64,20)`.

 - `player.getPos()` / `player.setPos(x, y, z)` -> float position
 - `player.getTile()` / `player.setTile(x, y, z)` -> integer block position
 - `player.getAbsPos()` / `player.setAbsPos(x, y, z)` -> position ignoring the `location` config setting
 - `player.getDirection()` / `player.setDirection(x, y, z)` -> the direction the player faces, as a vector
 - `player.getRotation()` / `player.setRotation(yaw)` -> yaw in degrees
 - `player.getPitch()` / `player.setPitch(pitch)` -> pitch in degrees
 - `player.getFoodLevel()` / `player.setFoodLevel(level)`
 - `player.getHealth()` / `player.setHealth(health)`
 - `player.addForce(x, y, z)` -> none. Adds to the player's velocity, which launches
   them. Values are small: 1 is roughly 20 blocks per second, so 0.5 is a decent jump.
 - `player.getWorld()` -> the name of the world the player is actually in, which is not necessarily the one this session is building in
 - `player.sendTitle(title, subtitle, fadeIn, stay, fadeOut)` -> none
 - `player.setPlayer(name)` -> none. Attaches this session to a named player.

### entity

The same positional commands, but the entity id is required rather than optional.

 - `entity.getPos(id)` / `entity.setPos(id, x, y, z)`
 - `entity.getTile(id)` / `entity.setTile(id, x, y, z)`
 - `entity.getDirection(id)` / `entity.setDirection(id, x, y, z)`
 - `entity.getRotation(id)` / `entity.setRotation(id, yaw)`
 - `entity.getPitch(id)` / `entity.setPitch(id, pitch)`
 - `entity.addForce(id, x, y, z)` -> none. Adds to the entity's velocity.
 - `entity.getName(id)` -> the entity's name

### events

 - `events.block.hits()` -> blocks hit since the last poll, one per line entry
 - `events.chat.posts()` -> chat messages since the last poll
 - `events.arrow.hits()` -> arrow hits since the last poll
 - `events.clear()` -> discard anything queued

Which mouse button counts as a "hit" is set by `hitclick` in the config.

**A hit only registers while the player is holding a sword.** Any sword will do, but
with anything else in hand -- or an empty hand -- `events.block.hits()` stays empty and
gives no clue why. This is inherited from RaspberryJuice and exists so that ordinary
building does not flood the event queue.

### chat

 - `chat.post(message)` -> broadcasts the message to everyone on the server. Commas in
   the message are preserved.

### Not implemented

pyncraft still has methods for these, and they will come back `Fail,... is not supported`:

 - `camera.*` -- camera angles cannot be controlled through the Bukkit API
 - `world.checkpoint.save` and `world.checkpoint.restore`
 - `world.setting`
 - `world.getBlockWithData` -- superseded by `world.getBlockData`

## Config

Edit `config.yml` in the plugin's folder:

 - `port: 4711` -- the TCP port the plugin listens on
 - `hostname:` -- which address to accept connections from. Blank means any (`0.0.0.0`); `localhost` would refuse remote clients.
 - `location: ABSOLUTE` -- whether coordinates are ABSOLUTE or RELATIVE to the world spawn point
 - `hitclick: LEFT` -- whether hit events come from LEFT clicks, RIGHT clicks or BOTH

Note that port 4711 has **no authentication of any kind**. Anyone who can reach it can edit your world and move players. Think carefully before forwarding it through your router.

## Install

Download the latest jar from the [releases page](https://github.com/jdeast/FruitJuice/releases/latest) and copy it into your server's `plugins` directory, then restart the server.

## Build from source

[Install Maven](https://maven.apache.org/install.html), then:

```
git clone https://github.com/jdeast/FruitJuice
cd FruitJuice
mvn package
```

The jar lands in `target/`.

## Version history

 - 0.1.0 - Initial release
 - 0.2.0 - Updates from integer block IDs to string block IDs broke the way directional blocks work. Partial fix.
 - 0.3.0 - [minecraftdawn]'s refactoring of cmdPlayer broke player selection implemented in mcpi_e. Fixed.
 - 0.4.0 - Player selection by entity id, which had been driving the wrong player and corrupting coordinates. Beds, doors and tall plants now place as the two blocks they really are. Blocks take an optional facing and no longer all default to WEST. New `world.getBlockData` and `world.getBlockTypes`, so the Scratch block list comes from the server rather than a hardcoded list that went stale each release. `plugin.yml` had reported version 0.1.0 since 0.1.0; it now matches.

## Contributors

 - [jdeast](https://github.com/jdeast)
 - [stoneskin](https://github.com/stoneskin) (pyncraft/mcpi_e)
 - [arpruss](https://github.com/arpruss) (scratch)
 - [minecraftdawn](https://github.com/minecraftdawn)
 - [d4g33z](https://github.com/d4g33z) (player id handling)
 - [mwrowe](https://github.com/mwrowe) (block data, docker setup)
 - [zhuowei](https://github.com/zhuowei)
 - [martinohanlon](https://github.com/martinohanlon)
 - [jclaggett](https://github.com/jclaggett)
 - [opticyclic](https://github.com/opticyclic)
 - [timcu](https://www.triptera.com.au/wordpress/)
 - [pxai](https://github.com/pxai)
