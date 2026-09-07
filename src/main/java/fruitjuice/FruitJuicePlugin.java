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

	public static final Set<Material> blockBreakDetectionTools = EnumSet.of(
			Material.DIAMOND_SWORD,
			Material.GOLDEN_SWORD,
			Material.IRON_SWORD,
			Material.STONE_SWORD,
			Material.WOODEN_SWORD
	);

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
		String hostname = this.getConfig().getString("hostname");
		InetSocketAddress bindAddress = (hostname == null || hostname.trim().isEmpty())
				? new InetSocketAddress(port)
				: new InetSocketAddress(hostname.trim(), port);
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
		if (currentTool == null || !blockBreakDetectionTools.contains(currentTool.getType())) {
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
	public Entity getEntity(int id) {
		for (Player p : getServer().getOnlinePlayers()) {
			if (p.getEntityId() == id) {
				return p;
			}
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

