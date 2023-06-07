# FruitJuice

A Minecraft Bukkit plugin which enables python and/or scratch programming. 

This Bukkit plugin is a successor to RaspberryJuice that implements a Python/Scratch API to vanilla minecraft (not dependent on the raspberry pi edition).

See [README_server_setup.md](https://github.com/jdeast/FruitJuice/blob/master/README_server_setup.md) for instructions to set up your own python/scratch server that works on java or bedrock.

To use Python, you must connect it to a Bukkit server running this plugin, and use the companion pyncraft library:
pip install pyncraft

To use scratch, you must use this URL:
http://pruss.mobi/scratch/?load_plugin=http://lweb.cfa.harvard.edu/~jeastman/scratch.js
and connect it to a Bukkit server running this plugin and a websocket relay.

## Commands

### Commands supported

#### world
 - world.getBlock(x:int, y:int, z:int) -> str
   - Get the block of the input position
 
 
 - world.getBlocks(x1:int, y1:int, z1:int, x2:int, y2:int, z2:int) -> list
   - Get the blocks of the input position range
 
 
 - world.setBlock(x:int, y:int, z:int, block:str) -> None:
   - Set the block of the input position
 
 
 - world.setBlocks(x1:int, y1:int, z1:int, x2:int, y2:int, z2:int, block) -> None:
    - Set the blocks of the input position range
 

 - world.getHeight(x:int, z:int) -> int:
    - Get highest position y of the block
    
    
 - world.getPlayerEntityIds() -> list:
    - Get the list of server players'id
    
    
 - world.postToChat(*msg) -> None:
    -Print message to minecraft chat
 
 
 - world.setSign(x:int, y:int, z:int, signType:str, signDir:int, line1:str="", line2:str="", line3:str="", line4:str="") -> None:
    - Set the stand sign of the input position
 
 
 - world.setWallSign(x:int, y:int, z:int, signType:str, signDir:int, line1="",line2="",line3="",line4="") -> None:
    - Set the wall sign of the input position
    
    
 - world.spawnEntity(x:int, y:int, z:int, entityID:int) -> int:
    - Spawn a entity of the input position
 
 
 - world.createExplosion(x:int, y:int, z:int, power:int=4) -> None:
    - Create a explosion of the input position
 
 
 - world.getPlayerEntityId(name:str) -> int:
    - Get the entity ID of input name
 
 
 - world.create(address = "localhost", port = 4711):
    - Connect your python program to Raspberryjuice
    

 ---
 
#### player
 - player.getPos() -> Vec3:
    - Get player's float position
    
    
 - player.setPos(x:float, y:float, z:float) -> None:
    - Set player's position with float
 
 
 - player.getTilePos() -> Vec3:
    - Get player's integer position
 
 - player.setTilePos(x:int, y:int, z:int) -> None:
    -Set player's integer position
 
 
 - player.getDirection() -> Vec3:
    - Get player's direction
 
 
 - player.setDirection(x:float, y:float, z:float) -> None:
    - Set player's direction
    
 
 - player.getRotation() -> float:
    - Get player's rotation
    
 
 - player.setRotation(yaw:float) -> None:
    - Set player's rotation
 
 
 - player.getPitch() -> float:
    - Get player's pitch
 
 
 - player.setPitch(pitch) -> None:
     - Set player's pitch
 
 
 - player.getFoodLevel() -> int:
    - Get player's food level
    
    
- player.setFoodLevel(foodLevel:int) -> None:
    - Set player's food level
    
    
- player.getHealth() -> float:
    - Get player's health
    
    
- player.setHealth(health:float) -> None:
    - Set player's health
 
 
 - player.sendTitle(title:str, subTitle:str="", fadeIn:int=10, stay:int=70, fadeOut:int=20) -> None:
    - Send a title to player
 
 ---
 
#### entity
 - entity.getPos(ID) -> Vec3:
    - Get specific entity's float position
    
    
 - entity.setPos(ID, x:float, y:float, z:float) -> None:
    - Set specific entity's position with float
 
 
 - entity.getTilePos(ID) -> Vec3:
    - Get specific entity's integer position
 
 
 - entity.setTilePos(ID, x:int, y:int, z:int) -> None:
    - Set specific entity's position with integer
 
 
 - entity.getDirection(ID) -> Vec3:
    - Get specific entity's direction
 
 
 - entity.setDirection(ID, x:float, y:float, z:float) -> None:
    - Set specific entity's direction
 
 
 - entity.getRotation(ID) -> float:
    - Get specific entity's rotation
 
 
 - entity.setRotation(ID, yaw) -> float:
    - Set specific entity's rotation
    
 
 - entity.getPitch(ID) -> float:
    - Get specific entity's pitch
 
 
 - entity.setPitch(ID, pitch) -> None:
    - Set specific entity's pitch
 
 
 - entity.getName(ID):
    -  Get specific entity's name

### Commands that can't be supported

 - Camera angles
 
## Config

Modify config.yml:

 - port: 4711 - the default tcp port can be changed in config.yml
 - location: ABSOLUTE - determine whether locations are RELATIVE to the spawn point or ABSOLUTE
 - hitclick: RIGHT - determine whether hit events are triggered by LEFT clicks, RIGHT clicks or BOTH 

## Build

### From jar file

copy https://github.com/jdeast/FruitJuice/target/FruitJuice.jar to your plugin directory 

### From Source

To build FruitJuice, [download and install Maven](https://maven.apache.org/install.html), clone the repository, run `mvn package':

```
git clone https://github.com/jdeast/FruitJuice
cd FruitJuice
mvn package
```

## Version history

 - 0.1.0 - Initial release

## Contributors

 - [jdeast](https://github.com/jdeast)
 - [stoneskin](https://github.com/stoneskin) (pyncraft/mcpi_e)
 - [apruss](https://github.com/arpruss) (scratch)
 - [minecraftdawn](https://github.com/minecraftdawn)
 - [zhuowei](https://github.com/zhuowei)
 - [martinohanlon](https://github.com/martinohanlon)
 - [jclaggett](https://github.com/jclaggett)
 - [opticyclic](https://github.com/opticyclic)
 - [timcu](https://www.triptera.com.au/wordpress/)
 - [pxai](https://github.com/pxai)
