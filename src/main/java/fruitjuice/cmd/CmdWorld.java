package fruitjuice.cmd;

import fruitjuice.FruitJuicePlugin;
import fruitjuice.RemoteSession;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.BlockState;
import org.bukkit.block.data.BlockData;
import org.bukkit.block.data.Bisected;
import org.bukkit.block.data.Directional;
import org.bukkit.block.data.FaceAttachable;

import org.bukkit.block.Sign;
import org.bukkit.block.data.type.Bed;
import org.bukkit.block.data.type.Stairs;
import org.bukkit.block.data.type.TrapDoor;
import org.bukkit.block.data.type.WallSign;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Player;

import java.util.Collection;

public class CmdWorld {
	private final String preFix = "world.";
	private RemoteSession session;
	private FruitJuicePlugin plugin;

	public CmdWorld(RemoteSession session) {
		this.session = session;
		this.plugin = session.plugin;
	}

	public void execute(World world, String command, String[] args) {

		// world.getBlock
		if (command.equals("getBlock")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);

			session.send(world.getBlockAt(loc).getType().name());

			// world.getBlocks
		} else if (command.equals("getBlocks")) {
			Location loc1 = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Location loc2 = session.parseRelativeBlockLocation(args[3], args[4], args[5]);

			session.send(getBlocks(loc1, loc2));

			// world.getBlockData
		} else if (command.equals("getBlockData")) {
			// The whole block state rather than just the material, e.g.
			// minecraft:oak_stairs[facing=east,half=bottom,shape=straight].
			// getBlock reports the material alone, so this is the only way to read
			// back a block's facing.
			//
			// getAsString() is the documented accessor; BlockData.toString() is not
			// part of the interface contract even though CraftBukkit happens to
			// delegate to it today.
			//
			// The value carries commas inside its brackets, so a client must take
			// the whole line as one string rather than splitting on commas the way
			// it does for getBlocks.
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			session.send(world.getBlockAt(loc).getBlockData().getAsString());

			// world.getWorlds
		} else if (command.equals("getWorlds")) {
			// Everything used to run against getWorlds().get(0), so the nether,
			// the end and any second world were unreachable -- even though the
			// setup guide recommends a separate flat creative world for scratch
			// and python.
			StringBuilder names = new StringBuilder();
			for (World w : Bukkit.getWorlds()) {
				if (names.length() > 0) names.append("|");
				names.append(w.getName());
			}
			session.send(names.toString());

			// world.getCurrentWorld
		} else if (command.equals("getCurrentWorld")) {
			session.send(world.getName());

			// world.setWorld
		} else if (command.equals("setWorld")) {
			World target = Bukkit.getWorld(args[0].trim());
			if (target == null) {
				session.send("Fail,No world called " + args[0] +
						". Use world.getWorlds() to see the names.");
				return;
			}
			session.useWorld(target);
			session.send(target.getName());

			// world.getBlockTypes
		} else if (command.equals("getBlockTypes")) {
			// The authoritative list of placeable materials for THIS server version.
			// Clients hardcode a block list that goes stale every release and offers
			// items you cannot place; this lets them ask instead of guessing.
			StringBuilder types = new StringBuilder();
			for (Material m : Material.values()) {
				if (m.isBlock() && !m.isLegacy()) {
					if (types.length() > 0) types.append(",");
					types.append(m.name());
				}
			}
			session.send(types.toString());

			// world.setBlock
		} else if (command.equals("setBlock")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Block thisBlock = world.getBlockAt(loc);
			Material material = Material.valueOf(args[3]);

			// Build the data up front so a two-block shape can be checked for room
			// before anything is written to the world.
			BlockData blockData = material.createBlockData();

			// Only override the facing when the caller actually asked for one.
			// Defaulting to WEST here made every directional block placed from
			// scratch -- which sends no direction at all -- come out facing west.
			if (blockData instanceof Directional && args.length >= 5) {
				((Directional) blockData).setFacing(BlockFace.valueOf(args[4]));
			}
			if (blockData instanceof FaceAttachable && args.length >= 6) {
				((FaceAttachable) blockData).setAttachedFace(FaceAttachable.AttachedFace.valueOf(args[5]));
			}

			// Every write below skips physics. Half a bed, or half a door, is not
			// a legal structure on its own, so with physics on the game removes the
			// first half before the second one has been placed.
			if (blockData instanceof Bed) {
				// A bed is two blocks: the foot goes where it was asked for, and the
				// head one step along the direction the bed faces.
				Bed foot = (Bed) blockData;
				foot.setPart(Bed.Part.FOOT);

				Bed head = (Bed) foot.clone();
				head.setPart(Bed.Part.HEAD);

				thisBlock.setBlockData(foot, false);
				thisBlock.getRelative(foot.getFacing()).setBlockData(head, false);

			} else if (blockData instanceof Bisected
					&& !(blockData instanceof Stairs)
					&& !(blockData instanceof TrapDoor)) {
				// Doors, tall flowers and the like fill the block above as well.
				// Stairs and trapdoors are Bisected too, but they are single blocks:
				// their half only records which way up they sit.
				Block topBlock = thisBlock.getRelative(BlockFace.UP);
				if (topBlock.getY() >= world.getMaxHeight()) {
					session.send("Fail,No room above " + loc.getBlockX() + "," + loc.getBlockY()
							+ "," + loc.getBlockZ() + " for the top half of " + material.name());
					return;
				}

				Bisected bottom = (Bisected) blockData;
				bottom.setHalf(Bisected.Half.BOTTOM);

				Bisected top = (Bisected) bottom.clone();
				top.setHalf(Bisected.Half.TOP);

				thisBlock.setBlockData(bottom, false);
				topBlock.setBlockData(top, false);

			} else {
				thisBlock.setBlockData(blockData, false);
			}

			// world.setBlocks
		} else if (command.equals("setBlocks")) {
			Location loc1 = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Location loc2 = session.parseRelativeBlockLocation(args[3], args[4], args[5]);
			String blockType = args[6];

			setCuboid(loc1, loc2, blockType);

			// world.getPlayerIds
		} else if (command.equals("getPlayerIds")) {
			StringBuilder bdr = new StringBuilder();
			Collection<? extends Player> players = Bukkit.getOnlinePlayers();
			if (players.size() > 0) {
				for (Player p : players) {
					bdr.append(p.getEntityId());
					bdr.append("|");
				}
				bdr.deleteCharAt(bdr.length() - 1);
				session.send(bdr.toString());
			} else {
				session.send("Fail," + "There are no players in the server.");
			}

			// world.getPlayerId
		} else if (command.equals("getPlayerId")) {
			Player p = plugin.getNamedPlayer(args[0]);
			if (p != null) {
				session.send(p.getEntityId());
			} else {
				plugin.getLogger().info("Player [" + args[0] + "] not found.");
				session.send("Fail,That player is not on the server.");
			}

			// world.getHeight
		} else if (command.equals("getHeight")) {
			session.send(world.getHighestBlockYAt(session.parseRelativeBlockLocation(args[0], "0", args[1])));

		}
		// world.setSign
		else if (command.equals("setSign")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Block thisBlock = world.getBlockAt(loc);

			thisBlock.setType(Material.valueOf(args[3]));

			org.bukkit.block.data.type.Sign s = (org.bukkit.block.data.type.Sign) thisBlock.getBlockData();
			s.setRotation(BlockFace.valueOf(args[4]));
			thisBlock.setBlockData(s);

			BlockState signState = thisBlock.getState();

			if (signState instanceof Sign) {
				Sign sign = (Sign) signState;

				// write the text to the sign
				for (int i = 5; i - 5 < 4 && i < args.length; i++) {
					sign.setLine(i - 5, args[i]);
				}
				sign.update();
			}


		} else if (command.equals("setWallSign")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Block thisBlock = world.getBlockAt(loc);
			thisBlock.setType(Material.valueOf(args[3]));

			WallSign s = (WallSign) thisBlock.getBlockData();
			s.setFacing(BlockFace.valueOf(args[4]));
			thisBlock.setBlockData(s);

			BlockState signState = thisBlock.getState();

			if (signState instanceof Sign) {
				Sign sign = (Sign) signState;

				for (int i = 5; i - 5 < 4 && i < args.length; i++) {
					sign.setLine(i - 5, args[i]);
				}
				sign.update();
			}

			// world.spawnEntity
		} else if (command.equals("spawnEntity")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			EntityType type = parseEntityType(args[3]);
			if (type == null) {
				session.send("Fail,No entity type called " + args[3]);
				return;
			}
			// Hold the chunk loaded BEFORE spawning. An entity spawned into a
			// chunk nothing is keeping loaded does not survive -- with nobody
			// logged in it is gone before the next command arrives. Released
			// when this session closes.
			session.plugin.pinnedChunks().pin(session, world.getChunkAt(loc));

			Entity entity = world.spawnEntity(loc, type);
			// So entity.* can reach it afterwards without scanning every entity
			// in every world; see FruitJuicePlugin.rememberSpawnedEntity.
			session.plugin.rememberSpawnedEntity(entity);
			session.send(entity.getEntityId());

			// world.explode
		} else if (command.equals("createExplosion")) {
			Location loc = session.parseRelativeBlockLocation(args[0], args[1], args[2]);
			Float power = Float.parseFloat(args[3]);

			world.createExplosion(loc, power);

			// world.getEntityTypes
		} else if (command.equals("getEntityTypes")) {
			// Report every spawnable type, not just the ones with a pre-1.13 numeric
			// id. Modern entities (warden, allay, camel, sniffer) have no legacy id, so
			// filtering on getTypeId() >= 0 hid everything added since 2018. Those are
			// listed under their name, which spawnEntity now also accepts.
			StringBuilder bdr = new StringBuilder();
			for (EntityType entityType : EntityType.values()) {
				if (entityType.isSpawnable()) {
					bdr.append(entityType.getTypeId() >= 0
							? String.valueOf(entityType.getTypeId())
							: entityType.name());
					bdr.append(",");
					bdr.append(entityType.toString());
					bdr.append("|");
				}
			}
			session.send(bdr.toString());

		} else {
			session.plugin.getLogger().warning(preFix + command + " is not supported.");
			session.send("Fail," + preFix + command + " is not supported.");
		}
	}

	// create a cuboid of lots of blocks
	private void setCuboid(Location pos1, Location pos2, String blockType) {
		int minX, maxX, minY, maxY, minZ, maxZ;
		World world = pos1.getWorld();
		minX = pos1.getBlockX() < pos2.getBlockX() ? pos1.getBlockX() : pos2.getBlockX();
		maxX = pos1.getBlockX() >= pos2.getBlockX() ? pos1.getBlockX() : pos2.getBlockX();
		minY = pos1.getBlockY() < pos2.getBlockY() ? pos1.getBlockY() : pos2.getBlockY();
		maxY = pos1.getBlockY() >= pos2.getBlockY() ? pos1.getBlockY() : pos2.getBlockY();
		minZ = pos1.getBlockZ() < pos2.getBlockZ() ? pos1.getBlockZ() : pos2.getBlockZ();
		maxZ = pos1.getBlockZ() >= pos2.getBlockZ() ? pos1.getBlockZ() : pos2.getBlockZ();

		for (int x = minX; x <= maxX; ++x) {
			for (int z = minZ; z <= maxZ; ++z) {
				for (int y = minY; y <= maxY; ++y) {
					updateBlock(world, x, y, z, blockType);
				}
			}
		}
	}

	// Accepts an entity name ("PIG", "warden") or a pre-1.13 numeric id, so older
	// clients keep working while modern entities become reachable at all.
	private EntityType parseEntityType(String s) {
		String name = s.trim();
		try {
			return EntityType.valueOf(name.toUpperCase());
		} catch (IllegalArgumentException notAName) {
			// fall through to the legacy numeric form
		}
		try {
			return EntityType.fromId(Integer.parseInt(name));
		} catch (Exception notAnId) {
			return null;
		}
	}

	// get a cuboid of lots of blocks
	private String getBlocks(Location pos1, Location pos2) {
		StringBuilder blockData = new StringBuilder();

		int minX, maxX, minY, maxY, minZ, maxZ;
		World world = pos1.getWorld();
		minX = pos1.getBlockX() < pos2.getBlockX() ? pos1.getBlockX() : pos2.getBlockX();
		maxX = pos1.getBlockX() >= pos2.getBlockX() ? pos1.getBlockX() : pos2.getBlockX();
		minY = pos1.getBlockY() < pos2.getBlockY() ? pos1.getBlockY() : pos2.getBlockY();
		maxY = pos1.getBlockY() >= pos2.getBlockY() ? pos1.getBlockY() : pos2.getBlockY();
		minZ = pos1.getBlockZ() < pos2.getBlockZ() ? pos1.getBlockZ() : pos2.getBlockZ();
		maxZ = pos1.getBlockZ() >= pos2.getBlockZ() ? pos1.getBlockZ() : pos2.getBlockZ();

		for (int y = minY; y <= maxY; ++y) {
			for (int x = minX; x <= maxX; ++x) {
				for (int z = minZ; z <= maxZ; ++z) {
					blockData.append(world.getBlockAt(x, y, z).getType().name() + ",");
				}
			}
		}

		return blockData.substring(0, blockData.length() > 0 ? blockData.length() - 1 : 0);    // We don't want last comma
	}

	// updates a block
	private void updateBlock(World world, Location loc, String blockType) {
		Block thisBlock = world.getBlockAt(loc);
		updateBlock(thisBlock, blockType);
	}

	private void updateBlock(World world, int x, int y, int z, String blockType) {
		Block thisBlock = world.getBlockAt(x, y, z);
		updateBlock(thisBlock, blockType);
	}

	private void updateBlock(Block thisBlock, String blockType) {
		// check to see if the block is different - otherwise leave it
		blockType = blockType.toUpperCase();
		if ((thisBlock.getType() != Material.valueOf(blockType))) {
			thisBlock.setType(Material.valueOf(blockType.toUpperCase()));
		}
	}
}
