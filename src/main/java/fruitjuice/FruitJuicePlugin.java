package fruitjuice;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.entity.ProjectileHitEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;

import java.net.InetSocketAddress;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class FruitJuicePlugin extends JavaPlugin implements Listener {

	/**
	 * Whether an item counts as a sword, and so triggers a hit event.
	 *
	 * This used to be a hardcoded list of five swords, written in the initial
	 * commit in December 2012 and never touched since. Minecraft added
	 * netherite in 1.16, six years ago, so a netherite sword -- the best one in
	 * the game, and therefore the one anybody who has played for a while is
	 * holding -- silently did nothing. No error, no log line: hits simply never
	 * arrived, which is a hard thing to debug from inside Scratch.
	 *
	 * Matching on the name cannot go stale the same way, and needs no constant
	 * that a given API version might not have: compiled against 1.13 or 1.21,
	 * NETHERITE_SWORD is caught either way without ever being named.
	 */
	public static boolean isHitTool(Material material) {
		return material != null && material.name().endsWith("_SWORD");
	}

	public ServerListenerThread serverThread;

	public List<RemoteSession> sessions;


	private LocationType locationType;

	private HitClickType hitClickType;

	public LocationType getLocationType() {
		return locationType;
	}

	public HitClickType getHitClickType() {
		return hitClickType;
	}

	public void onEnable() {
		//save a copy of the default config.yml if one is not there
		this.saveDefaultConfig();
		//get port from config.yml
		int port = this.getConfig().getInt("port");
		getLogger().info("Using port " + Integer.toString(port));

		//get location type (ABSOLUTE or RELATIVE) from config.yml
		String location = this.getConfig().getString("location").toUpperCase();
		try {
			locationType = LocationType.valueOf(location);
		} catch (IllegalArgumentException e) {
			getLogger().warning("warning - location value in config.yml should be ABSOLUTE or RELATIVE - '" + location + "' found");
			locationType = LocationType.valueOf("RELATIVE");
		}
		getLogger().info("Using " + locationType.name() + " locations");

		//get hit click type (LEFT, RIGHT or BOTH) from config.yml
		String hitClick = this.getConfig().getString("hitclick").toUpperCase();
		try {
			hitClickType = HitClickType.valueOf(hitClick);
		} catch (IllegalArgumentException e) {
			getLogger().warning("warning - hitclick value in config.yml should be LEFT, RIGHT or BOTH - '" + hitClick + "' found");
			hitClickType = HitClickType.valueOf("RIGHT");
		}
		getLogger().info("Using " + hitClickType.name() + " clicks for hits");

		//setup session array
		// Copy-on-write: onChatPosted iterates this from an async event thread while
		// handleConnection adds to it and the tick handler removes from it.
		sessions = new CopyOnWriteArrayList<RemoteSession>();

		//create new tcp listener thread
		// config.yml has always documented a hostname setting -- "localhost would
		// prevent remote clients from connecting" -- but nothing ever read it, so it
		// bound every interface regardless and the setting was a lie. Blank still
		// means all interfaces, which is the documented default.
		// /py, which is inert unless python.enabled is set.
		if (getCommand("py") != null) {
			fruitjuice.cmd.PyCommand py = new fruitjuice.cmd.PyCommand(this);
			getCommand("py").setExecutor(py);
			getCommand("py").setTabCompleter(py);
			if (getConfig().getBoolean("python.enabled", false)) {
				getLogger().info("/py is enabled; scripts run from " + getScriptsDirectory());
			}
		}

		String hostname = this.getConfig().getString("hostname");
		InetSocketAddress bindAddress = bindAddressFor(hostname, port);
		getLogger().info("Listening on " + bindAddress);

		try {
			serverThread = new ServerListenerThread(this, bindAddress);
			new Thread(serverThread).start();
			getLogger().info("ThreadListener Started");
		} catch (Exception e) {
			e.printStackTrace();
			getLogger().warning("Failed to start ThreadListener");
			return;
		}
		//register the events
		getServer().getPluginManager().registerEvents(this, this);
		//setup the schedule to called the tick handler
		getServer().getScheduler().scheduleSyncRepeatingTask(this, new TickHandler(), 1, 1);
	}

	@EventHandler(ignoreCancelled = true)
	public void onPlayerInteract(PlayerInteractEvent event) {
		// only react to events which are of the correct type
		switch (hitClickType) {
			case BOTH:
				if ((event.getAction() != Action.RIGHT_CLICK_BLOCK) && (event.getAction() != Action.LEFT_CLICK_BLOCK))
					return;
				break;
			case LEFT:
				if (event.getAction() != Action.LEFT_CLICK_BLOCK) return;
				break;
			case RIGHT:
				if (event.getAction() != Action.RIGHT_CLICK_BLOCK) return;
				break;
		}
		ItemStack currentTool = event.getItem();
		if (currentTool == null || !isHitTool(currentTool.getType())) {
			return;
		}
		for (RemoteSession session : sessions) {
			session.queuePlayerInteractEvent(event);
		}
	}

	@EventHandler(ignoreCancelled = true)
	public void onChatPosted(AsyncPlayerChatEvent event) {
		//debug
		//getLogger().info("Chat event fired");
		for (RemoteSession session : sessions) {
			session.queueChatPostedEvent(event);
		}
	}

	@EventHandler(ignoreCancelled = true)
	public void onArrowHit(ProjectileHitEvent event){
		for (RemoteSession session : sessions) {
			session.queueArrowHitEvent(event);
		}
	}

	/**
	 * called when a new session is established.
	 */
	public void handleConnection(RemoteSession newSession) {
		if (checkBanned(newSession)) {
			getLogger().warning("Kicking " + newSession.getSocket().getRemoteSocketAddress() + " because the IP address has been banned.");
			newSession.kick("You've been banned from this server!");
			return;
		}
		sessions.add(newSession);
	}

	// Matches on getName(), the account name. getPlayerListName() is the tab-list
	// entry, which other plugins routinely decorate with colours, prefixes or
	// ranks; matching on that made world.getPlayerId(name) fail as soon as any of
	// them was installed. The list name is still accepted as a fallback so
	// existing scripts that pass it keep working.
	/**
	 * The directory /py runs scripts from, created if it is not there yet.
	 *
	 * Under the plugin's own folder rather than anywhere on disk, so what can be
	 * run is bounded by where the server administrator put it.
	 */
	public java.nio.file.Path getScriptsDirectory() {
		String configured = this.getConfig().getString("python.scripts", "scripts");
		java.nio.file.Path dir = getDataFolder().toPath().resolve(configured);
		try {
			java.nio.file.Files.createDirectories(dir);
		} catch (java.io.IOException e) {
			getLogger().warning("Could not create the scripts directory " + dir + ": " + e);
		}
		return dir;
	}

	/**
	 * Where to listen, from the configured hostname.
	 *
	 * Blank or absent means every interface, which is what the shipped
	 * config.yml documents as the default. A value narrows it, so
	 * "localhost" really does refuse remote clients now -- for years the
	 * setting was documented but never read, so it bound everything
	 * regardless and anyone relying on it had a security control that did
	 * nothing.
	 */
	static InetSocketAddress bindAddressFor(String hostname, int port) {
		return (hostname == null || hostname.trim().isEmpty())
				? new InetSocketAddress(port)
				: new InetSocketAddress(hostname.trim(), port);
	}

	public Player getNamedPlayer(String name) {
		if (name == null) return null;
		for (Player player : Bukkit.getOnlinePlayers()) {
			if (name.equals(player.getName())) {
				return player;
			}
		}
		for (Player player : Bukkit.getOnlinePlayers()) {
			if (name.equals(player.getPlayerListName())) {
				return player;
			}
		}
		return null;
	}

	public Player getHostPlayer() {
		for (Player player : Bukkit.getOnlinePlayers()) {
			return player;
		}
		return null;
	}

	//get entity by id - DONE to be compatible with the pi it should be changed to return an entity not a player...
	/**
	 * Entities this plugin spawned, newest last, most recent 1000 kept.
	 *
	 * getEntity resolves an id by scanning every world's getEntities(), which
	 * only reports entities in loaded chunks. With nobody logged in nothing
	 * keeps chunks loaded, so on an empty server that scan finds nothing at all
	 * -- a script could spawn something and then be unable to address it a
	 * millisecond later, including to remove it again.
	 *
	 * spawnEntity already has the Entity in its hand, so remembering it costs
	 * one map write and removes the need to search for it at all. Bounded,
	 * because a script spawning in a loop would otherwise pin every entity it
	 * ever made; 1000 is far more than any session addresses by id, and the
	 * oldest entry is the least likely to still be wanted.
	 */
	private static final int MAX_REMEMBERED_ENTITIES = 1000;

	// Static so it exists without the constructor having run, which is what
	// lets the lookup be tested at all -- a JavaPlugin cannot be constructed
	// outside a running server. There is one plugin instance per server, so
	// this is not shared between anything; onDisable clears it so a reload
	// does not carry entity references from the previous life of the plugin.
	private static final Map<Integer, Entity> spawnedEntities = Collections.synchronizedMap(
			new LinkedHashMap<Integer, Entity>(16, 0.75f, false) {
				@Override
				protected boolean removeEldestEntry(Map.Entry<Integer, Entity> eldest) {
					return size() > MAX_REMEMBERED_ENTITIES;
				}
			});

	/**
	 * Chunks held loaded so that spawned entities survive. Created lazily
	 * because a JavaPlugin's fields cannot be initialised before it exists, and
	 * looked up through here so nothing else needs to know it is shared.
	 */
	private PinnedChunks pinnedChunks;

	public synchronized PinnedChunks pinnedChunks() {
		if (pinnedChunks == null) {
			pinnedChunks = new PinnedChunks(this);
		}
		return pinnedChunks;
	}

	/** Called by world.spawnEntity, so the new entity can be found again. */
	public void rememberSpawnedEntity(Entity entity) {
		if (entity != null) {
			spawnedEntities.put(entity.getEntityId(), entity);
		}
	}

	public Entity getEntity(int id) {
		for (Player p : getServer().getOnlinePlayers()) {
			if (p.getEntityId() == id) {
				return p;
			}
		}

		// Anything we spawned ourselves, whether or not its chunk is loaded.
		Entity remembered = spawnedEntities.get(id);
		if (remembered != null) {
			if (remembered.isValid()) {
				return remembered;
			}
			// Dead or despawned. Drop it so the map does not accumulate
			// corpses, and fall through in case the id has been reused.
			spawnedEntities.remove(id);
		}
		// Search every loaded world rather than the host player's, which used to
		// NPE whenever nobody was online.
		for (World w : getServer().getWorlds()) {
			for (Entity e : w.getEntities()) {
				if (e.getEntityId() == id) {
					return e;
				}
			}
		}
		return null;
	}

	public boolean checkBanned(RemoteSession session) {
		Set<String> ipBans = getServer().getIPBans();
		String sessionIp = session.getSocket().getInetAddress().getHostAddress();
		return ipBans.contains(sessionIp);
	}


	public void onDisable() {
		// The registry outlives the instance because it is static, so let go of
		// the entities rather than carrying them into a reload.
		spawnedEntities.clear();
		// Chunks we were holding open must not stay loaded after we stop.
		pinnedChunks().releaseEverything();
		getServer().getScheduler().cancelTasks(this);
		for (RemoteSession session : sessions) {
			try {
				session.close();
			} catch (Exception e) {
				getLogger().warning("Failed to close RemoteSession");
				e.printStackTrace();
			}
		}
		serverThread.running = false;
		try {
			serverThread.serverSocket.close();
		} catch (Exception e) {
			e.printStackTrace();
		}

		// clear rather than null: other threads may still be shutting down and a
		// null here turns an orderly stop into a pile of NPEs.
		sessions.clear();
		getLogger().info("Fruit Juice Stopped");
	}

	private class TickHandler implements Runnable {
		public void run() {
			// A CopyOnWriteArrayList iterator does not support remove(), but its
			// iteration is over a snapshot, so removing from the list here is safe.
			for (RemoteSession s : sessions) {
				if (s.pendingRemoval) {
					s.close();
					sessions.remove(s);
				} else {
					s.tick();
				}
			}
		}
	}
}

