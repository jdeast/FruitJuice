package fruitjuice.cmd;

import fruitjuice.RemoteSession;
import fruitjuice.FruitJuicePlugin;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class CmdPlayer {
    private final String preFix = "player.";
    private RemoteSession session;
   	private Player attachedPlayer = null;
 	private FruitJuicePlugin plugin;

    public CmdPlayer(RemoteSession session, FruitJuicePlugin plugin) {
        this.session = session;
        this.plugin = plugin;
    }

	private boolean serverHasPlayer() {
		return !Bukkit.getOnlinePlayers().isEmpty();
	}

	private Player getCurrentPlayer() {
		// if no players, return null
		if (!serverHasPlayer()) {
			session.send("Fail,There are no players in the server.");
			return null;
		} 

		// if the player hasnt already been retreived for this session, go and get it.
		Player player = attachedPlayer;
		if (player == null) {
			player = plugin.getHostPlayer();
			attachedPlayer = player;
			return player;
		}

		// otherwise, return the player
		return player;
	}

	private Player getCurrentPlayer(String name) {

		// if no players, return null
		if (!serverHasPlayer()) {
			session.send("Fail,There are no players in the server.");
			return null;
		} 

		// if a named player is returned use that
		Player player = plugin.getNamedPlayer(name);
		if (player == null) {
			player = attachedPlayer;
			// otherwise go and get the host player and make that the attached player
			if (player == null) {
				player = plugin.getHostPlayer();
			}
		}
		attachedPlayer = player;
		return player;
	}

	/**
	 * Finds a player on the server by their entity ID.
	 *
	 * @param id The entity ID of the player.
	 * @return The Player object if found, otherwise null.
	 */
	private Player getPlayerById(int id) {
		for (Player player : Bukkit.getOnlinePlayers()) {
			if (player.getEntityId() == id) {
				return player;
			}
		}
		return null; // Return null if no player with the given ID is found.
	}

	// How many arguments each player.* command takes *without* the optional
	// leading entity ID. pyncraft prepends that ID to every positional command
	// when Minecraft.create() was given a playerName; scratch and the default
	// pyncraft path (playerId = [], which flattens away) send no ID at all.
	// Commands absent from this table never get ID treatment -- setPlayer takes
	// a player name, not an ID.
	static final Map<String, Integer> ARG_COUNTS = new HashMap<>();
	static {
		ARG_COUNTS.put("getTile", 0);
		ARG_COUNTS.put("setTile", 3);
		ARG_COUNTS.put("getAbsPos", 0);
		ARG_COUNTS.put("setAbsPos", 3);
		ARG_COUNTS.put("getPos", 0);
		ARG_COUNTS.put("setPos", 3);
		ARG_COUNTS.put("getDirection", 0);
		ARG_COUNTS.put("setDirection", 3);
		ARG_COUNTS.put("getRotation", 0);
		ARG_COUNTS.put("setRotation", 1);
		ARG_COUNTS.put("getPitch", 0);
		ARG_COUNTS.put("setPitch", 1);
		ARG_COUNTS.put("getFoodLevel", 0);
		ARG_COUNTS.put("setFoodLevel", 1);
		ARG_COUNTS.put("getHealth", 0);
		ARG_COUNTS.put("setHealth", 1);
		ARG_COUNTS.put("sendTitle", 5);
		ARG_COUNTS.put("addForce", 3);
		ARG_COUNTS.put("getWorld", 0);
	}
	/**
	 * A no-argument call parses to a single empty string, not an empty array.
	 * Scratch and older pyncraft both send that shape and must keep working.
	 */
	public static String[] normaliseArgs(String[] args) {
		return (args.length == 1 && args[0].isEmpty()) ? new String[0] : args;
	}

	/**
	 * The entity id a player command was addressed to, or null when none was sent.
	 *
	 * args[0] counts as an id only when the command received exactly one more
	 * argument than it takes and that argument parses as an integer. pyncraft
	 * prepends the id when Minecraft.create() was given a playerName; scratch and
	 * the default pyncraft path send none, and both have to keep working.
	 */
	public static Integer leadingPlayerId(String command, String[] args) {
		Integer expected = ARG_COUNTS.get(command);
		if (expected == null || args.length != expected + 1) return null;
		try {
			return Integer.valueOf(args[0].trim());
		} catch (NumberFormatException notAnId) {
			return null;
		}
	}

    public void execute(String command, String[] args) {

		args = normaliseArgs(args);

		Player currentPlayer = null;
		Integer playerId = leadingPlayerId(command, args);
		if (playerId != null) {
			currentPlayer = getPlayerById(playerId);
			if (currentPlayer == null) {
				session.send("Fail,No player found with ID: " + args[0]);
				return;
			}
			attachedPlayer = currentPlayer;
			args = Arrays.copyOfRange(args, 1, args.length);
		}

		if (currentPlayer == null) {
			currentPlayer = getCurrentPlayer();
		}
		if (currentPlayer == null) {
			session.send("Fail,There are no players in the server.");
			return;
		}

		// player.getTile
		if (command.equals("getTile")) {

			session.send(session.blockLocationToRelative(currentPlayer.getLocation()));

			// player.setTile
		} else if (command.equals("setTile")) {
			String x = args[0], y = args[1], z = args[2];

			//get players current location, so when they are moved we will use the same pitch and yaw (rotation)
			Location loc = currentPlayer.getLocation();
			currentPlayer.teleport(session.parseRelativeBlockLocation(x, y, z, loc.getPitch(), loc.getYaw()));

			// player.getAbsPos
		} else if (command.equals("getAbsPos")) {

			session.send(currentPlayer.getLocation());

			// player.setAbsPos
		} else if (command.equals("setAbsPos")) {
			String x = args[0], y = args[1], z = args[2];

			//get players current location, so when they are moved we will use the same pitch and yaw (rotation)
			Location loc = currentPlayer.getLocation();
			loc.setX(Double.parseDouble(x));
			loc.setY(Double.parseDouble(y));
			loc.setZ(Double.parseDouble(z));
			currentPlayer.teleport(loc);

			// player.getPos
		} else if (command.equals("getPos")) {

			session.send(session.locationToRelative(currentPlayer.getLocation()));

			// player.setPos
		} else if (command.equals("setPos")) {
			String x = args[0], y = args[1], z = args[2];

			//get players current location, so when they are moved we will use the same pitch and yaw (rotation)
			Location loc = currentPlayer.getLocation();
			currentPlayer.teleport(session.parseRelativeLocation(x, y, z, loc.getPitch(), loc.getYaw()));

			// player.setPlayer
		} else if (command.equals("setPlayer")) {
			String playerName = args[0];
			getCurrentPlayer(playerName);

			// player.getWorld
		} else if (command.equals("getWorld")) {
			// Where the player actually is, which is not necessarily where this
			// session is building -- world.setWorld moves the session, not the
			// player.
			session.send(currentPlayer.getWorld().getName());

			// player.addForce
		} else if (command.equals("addForce")) {
			// Doubles, not ints. Velocity is a float vector and 1 is already about 20
			// blocks a second, so integers only give you "still" or "launched".
			double fx = Double.parseDouble(args[0]);
			double fy = Double.parseDouble(args[1]);
			double fz = Double.parseDouble(args[2]);
			currentPlayer.setVelocity(currentPlayer.getVelocity().add(new Vector(fx, fy, fz)));

			// player.setDirection
		} else if (command.equals("setDirection")) {
			Double x = Double.parseDouble(args[0]);
			Double y = Double.parseDouble(args[1]);
			Double z = Double.parseDouble(args[2]);

			Location loc = currentPlayer.getLocation();
			loc.setDirection(new Vector(x, y, z));
			currentPlayer.teleport(loc);

			// player.getDirection
		} else if (command.equals("getDirection")) {

			session.send(currentPlayer.getLocation().getDirection().toString());

			// player.setRotation
		} else if (command.equals("setRotation")) {
			Float yaw = Float.parseFloat(args[0]);

			Location loc = currentPlayer.getLocation();
			loc.setYaw(yaw);
			currentPlayer.teleport(loc);

			// player.getRotation
		} else if (command.equals("getRotation")) {

			float yaw = currentPlayer.getLocation().getYaw();
			// turn bukkit's 0 - -360 to positive numbers
			if (yaw < 0) yaw = yaw * -1;
			session.send(yaw);

			// player.setPitch
		} else if (command.equals("setPitch")) {
			Float pitch = Float.parseFloat(args[0]);

			Location loc = currentPlayer.getLocation();
			loc.setPitch(pitch);
			currentPlayer.teleport(loc);

			// player.getPitch
		} else if (command.equals("getPitch")) {

			session.send(currentPlayer.getLocation().getPitch());

            // player.getFoodLevel
        } else if (command.equals("getFoodLevel")) {

            session.send(currentPlayer.getFoodLevel());

            // player.setFoodLevel
        } else if (command.equals("setFoodLevel")) {
			Integer foodLevel = Integer.parseInt(args[0]);

			currentPlayer.setFoodLevel(foodLevel);

			// player.getHealth
		} else if(command.equals("getHealth")) {

			session.send(currentPlayer.getHealth());

			// player.setHealth
		} else if(command.equals("setHealth")){
			Double health = Double.parseDouble(args[0]);

			currentPlayer.setHealth(health);

            // player.sendTitle
        } else if (command.equals("sendTitle")) {

			String title = args[0];
			String subTitle = args[1];
			Integer fadeIn = Integer.parseInt(args[2]);
			Integer stay = Integer.parseInt(args[3]);
			Integer fadeOut = Integer.parseInt(args[4]);
			currentPlayer.sendTitle(title, subTitle, fadeIn, stay, fadeOut);

		} else {
			session.plugin.getLogger().warning(preFix + command + " is not supported.");
			session.send("Fail," + preFix + command + " is not supported.");
		}
	}

}
