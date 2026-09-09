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

	/**
	 * The player this session acts on, or null if there is nobody to act on.
	 *
	 * Reports nothing to the client. It used to send the "no players" failure
	 * itself AND return null, and its one caller sent the same failure again on
	 * seeing the null -- so every player command produced two replies whenever
	 * the server was empty. The protocol is strictly one reply per command, so
	 * the extra one was read as the answer to the NEXT command, and every reply
	 * after it was off by one for the life of the session.
	 *
	 * Answering is the caller's job precisely so it happens exactly once.
	 */
	private Player getCurrentPlayer() {
		// if no players, return null
		if (!serverHasPlayer()) {
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

	/**
	 * As above, by name. Also silent, and for a second reason: its caller is
	 * setPlayer, which answers nothing at all when it succeeds. A failure sent
	 * from in here would be a reply to a command the client is not waiting on,
	 * which desynchronises the session just as surely as sending two.
	 */
	private Player getCurrentPlayer(String name) {

		// if no players, return null
		if (!serverHasPlayer()) {
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
	 * A yaw as a compass bearing in [0, 360).
	 *
	 * Bukkit's yaw is unbounded: negative over half the compass, and it keeps
	 * accumulating past 360 as a player spins on the spot. Callers want a
	 * bearing, so it has to be wrapped.
	 *
	 * Wrapped, NOT negated. This used to be `if (yaw < 0) yaw = -yaw`, which is
	 * a mirror rather than a rotation: -90 is EAST and came back as 90, which
	 * is WEST. Every bearing in the eastern half of the compass was reflected
	 * onto the western half, so anything built on it was exactly backwards for
	 * half the compass and perfectly right for the other half.
	 *
	 * Bukkit's convention, for whoever needs it next: 0 is south (+Z), 90 is
	 * west (-X), 180 is north (-Z), 270 is east (+X).
	 */
	public static float normalizeYaw(float yaw) {
		if (Float.isNaN(yaw) || Float.isInfinite(yaw)) return 0f;
		float wrapped = yaw % 360f;
		return wrapped < 0f ? wrapped + 360f : wrapped;
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
			// The one place this is reported, for every player command.
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

			// Bukkit's yaw is unbounded: it is negative for half the compass
			// and keeps accumulating past 360 as a player spins. Callers want
			// a compass bearing, so wrap it into 0-360.
			//
			// This used to negate a negative yaw instead of wrapping it, which
			// is a mirror rather than a rotation: -90 is EAST and came back as
			// 90, which is WEST. Every bearing in the eastern half of the
			// compass was reflected onto the western half, so anything built
			// on it -- walking the way you are facing, say -- was exactly
			// backwards half the time and perfectly correct the other half,
			// which is the most confusing way for it to be wrong.
			session.send(normalizeYaw(currentPlayer.getLocation().getYaw()));

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
