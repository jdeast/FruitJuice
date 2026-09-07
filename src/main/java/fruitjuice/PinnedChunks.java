package fruitjuice;

import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.bukkit.Chunk;
import org.bukkit.plugin.Plugin;

/**
 * Chunks this plugin is holding loaded, and who asked for them.
 *
 * An entity spawned into a chunk that is not loaded does not survive: with
 * nobody logged in, world.spawnEntity returns an id for something that is gone
 * before the next command arrives, so a script could not address or remove what
 * it had just created. A plugin chunk ticket keeps the area loaded, which fixes
 * that -- at the price of keeping it loaded and ticking, which on a Raspberry Pi
 * is not free.
 *
 * So the pins are bounded and they are released. Two rules:
 *
 *  - Every pin belongs to a session, and closing that session releases all of
 *    them. Releasing when the entity is removed would not do: most spawned
 *    entities are never explicitly removed, so those tickets would simply leak.
 *  - The set is capped. Past the cap the oldest pin is dropped, on the reasoning
 *    that a script which has moved on to other chunks is unlikely to come back
 *    to the first one. A spawning loop therefore costs a bounded amount however
 *    long it runs.
 *
 * Bukkit's ticket is per plugin, not per session: removePluginChunkTicket
 * releases the chunk outright, whoever else may still want it. Two sessions
 * building in the same place is ordinary, so this counts owners and only
 * releases when the last one lets go.
 *
 * Every method is synchronized. Pins are added while handling a command on the
 * server thread, and released from the session teardown, which is not
 * necessarily the same thread.
 */
public class PinnedChunks {

    /**
     * How many chunks may be held at once, across all sessions.
     *
     * A loaded chunk costs memory and, more importantly on a small machine, it
     * ticks. Sixty-four is roughly a 128-block square, comfortably more than a
     * script builds in at one time, and small enough that a runaway loop cannot
     * pin the world.
     */
    static final int MAX_PINNED_CHUNKS = 64;

    private final Plugin plugin;

    /** Insertion-ordered, so the eldest entry is the oldest pin. */
    private final Map<String, Pin> pins = new LinkedHashMap<>();

    private static final class Pin {
        final Chunk chunk;
        final Set<Object> owners = new HashSet<>();

        Pin(Chunk chunk) {
            this.chunk = chunk;
        }
    }

    public PinnedChunks(Plugin plugin) {
        this.plugin = plugin;
    }

    private static String keyFor(Chunk chunk) {
        return chunk.getWorld().getName() + ":" + chunk.getX() + "," + chunk.getZ();
    }

    /**
     * Hold a chunk loaded on behalf of a session.
     *
     * Pinning the same chunk again refreshes nothing on purpose: the cap is
     * about how many are held, and re-ordering on every spawn would let a loop
     * alternating between two chunks keep a third alive indefinitely.
     */
    public synchronized void pin(Object owner, Chunk chunk) {
        if (owner == null || chunk == null) return;

        String key = keyFor(chunk);
        Pin existing = pins.get(key);
        if (existing != null) {
            existing.owners.add(owner);
            return;
        }

        Pin pin = new Pin(chunk);
        pin.owners.add(owner);
        pins.put(key, pin);
        chunk.addPluginChunkTicket(plugin);

        while (pins.size() > MAX_PINNED_CHUNKS) {
            Iterator<Map.Entry<String, Pin>> eldest = pins.entrySet().iterator();
            if (!eldest.hasNext()) break;
            Pin dropped = eldest.next().getValue();
            eldest.remove();
            dropped.chunk.removePluginChunkTicket(plugin);
        }
    }

    /** Let go of everything a session was holding. Called when it closes. */
    public synchronized void releaseAll(Object owner) {
        if (owner == null) return;

        Iterator<Map.Entry<String, Pin>> it = pins.entrySet().iterator();
        while (it.hasNext()) {
            Pin pin = it.next().getValue();
            if (pin.owners.remove(owner) && pin.owners.isEmpty()) {
                it.remove();
                pin.chunk.removePluginChunkTicket(plugin);
            }
        }
    }

    /** Release everything, whoever owns it. Used when the plugin disables. */
    public synchronized void releaseEverything() {
        for (Pin pin : pins.values()) {
            pin.chunk.removePluginChunkTicket(plugin);
        }
        pins.clear();
    }

    public synchronized int size() {
        return pins.size();
    }
}
