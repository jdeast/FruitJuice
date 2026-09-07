package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.bukkit.Chunk;
import org.bukkit.World;
import org.bukkit.plugin.Plugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Holding chunks loaded without leaking them.
 *
 * A pin is what makes a spawned entity survive on a server with nobody logged
 * in. It is also a chunk kept loaded and ticking, which is a real cost on a
 * Raspberry Pi, so what matters here is that pins are bounded and that they are
 * actually given back.
 */
class PinnedChunksTest {

    private Plugin plugin;
    private PinnedChunks chunks;
    private World world;

    @BeforeEach
    void setUp() {
        plugin = mock(Plugin.class);
        world = mock(World.class);
        when(world.getName()).thenReturn("world");
        chunks = new PinnedChunks(plugin);
    }

    private Chunk chunk(int x, int z) {
        Chunk c = mock(Chunk.class);
        when(c.getWorld()).thenReturn(world);
        when(c.getX()).thenReturn(x);
        when(c.getZ()).thenReturn(z);
        return c;
    }

    @Test
    @DisplayName("pinning holds the chunk, releasing gives it back")
    void pinThenRelease() {
        Object session = new Object();
        Chunk c = chunk(0, 0);

        chunks.pin(session, c);
        verify(c).addPluginChunkTicket(plugin);
        assertEquals(1, chunks.size());

        chunks.releaseAll(session);
        verify(c).removePluginChunkTicket(plugin);
        assertEquals(0, chunks.size());
    }

    @Test
    @DisplayName("pinning the same chunk twice takes one ticket, not two")
    void pinningTwiceIsIdempotent() {
        Object session = new Object();
        Chunk c = chunk(0, 0);

        chunks.pin(session, c);
        chunks.pin(session, c);

        verify(c, times(1)).addPluginChunkTicket(plugin);
        assertEquals(1, chunks.size());
    }

    @Test
    @DisplayName("one session closing does not unload a chunk another is still using")
    void ownersAreCountedRatherThanAssumedUnique() {
        // Bukkit's ticket is per plugin, so removePluginChunkTicket releases the
        // chunk outright however many sessions still want it. Two scripts
        // building in the same place is ordinary, and one of them stopping must
        // not pull the ground out from under the other.
        Object first = new Object();
        Object second = new Object();
        Chunk shared = chunk(3, 4);

        chunks.pin(first, shared);
        chunks.pin(second, shared);
        verify(shared, times(1)).addPluginChunkTicket(plugin);

        chunks.releaseAll(first);
        verify(shared, never()).removePluginChunkTicket(plugin);
        assertEquals(1, chunks.size(), "still held by the second session");

        chunks.releaseAll(second);
        verify(shared, times(1)).removePluginChunkTicket(plugin);
        assertEquals(0, chunks.size());
    }

    @Test
    @DisplayName("a session releasing takes only its own chunks with it")
    void releasingIsScopedToOneSession() {
        Object mine = new Object();
        Object theirs = new Object();
        Chunk a = chunk(1, 1);
        Chunk b = chunk(2, 2);

        chunks.pin(mine, a);
        chunks.pin(theirs, b);

        chunks.releaseAll(mine);
        verify(a).removePluginChunkTicket(plugin);
        verify(b, never()).removePluginChunkTicket(plugin);
        assertEquals(1, chunks.size());
    }

    @Test
    @DisplayName("the oldest pin is dropped once the cap is reached")
    void theSetIsBounded() {
        // A script spawning across a landscape would otherwise pin the world.
        Object session = new Object();
        Chunk first = chunk(0, 0);
        chunks.pin(session, first);

        for (int i = 1; i <= PinnedChunks.MAX_PINNED_CHUNKS; i++) {
            chunks.pin(session, chunk(i, 0));
        }

        assertEquals(PinnedChunks.MAX_PINNED_CHUNKS, chunks.size(),
                "never more than the cap");
        verify(first).removePluginChunkTicket(plugin);
    }

    @Test
    @DisplayName("an evicted chunk is not released a second time when its session closes")
    void evictionAndReleaseDoNotDoubleUp() {
        Object session = new Object();
        Chunk first = chunk(0, 0);
        chunks.pin(session, first);
        for (int i = 1; i <= PinnedChunks.MAX_PINNED_CHUNKS; i++) {
            chunks.pin(session, chunk(i, 0));
        }
        verify(first, times(1)).removePluginChunkTicket(plugin);

        chunks.releaseAll(session);
        // Still exactly one: releasing a chunk we no longer hold would drop a
        // ticket somebody else had taken out on it in the meantime.
        verify(first, times(1)).removePluginChunkTicket(plugin);
        assertEquals(0, chunks.size());
    }

    @Test
    @DisplayName("chunks in different worlds at the same coordinates are distinct")
    void worldIsPartOfTheIdentity() {
        World nether = mock(World.class);
        when(nether.getName()).thenReturn("world_nether");
        Chunk overworld = chunk(0, 0);
        Chunk inNether = mock(Chunk.class);
        when(inNether.getWorld()).thenReturn(nether);
        when(inNether.getX()).thenReturn(0);
        when(inNether.getZ()).thenReturn(0);

        Object session = new Object();
        chunks.pin(session, overworld);
        chunks.pin(session, inNether);

        assertEquals(2, chunks.size(), "0,0 in two worlds is two chunks");
        verify(overworld).addPluginChunkTicket(plugin);
        verify(inNether).addPluginChunkTicket(plugin);
    }

    @Test
    @DisplayName("releasing everything lets go of every pin, whoever owns it")
    void releaseEverythingClearsTheLot() {
        Chunk a = chunk(1, 1);
        Chunk b = chunk(2, 2);
        chunks.pin(new Object(), a);
        chunks.pin(new Object(), b);

        chunks.releaseEverything();

        verify(a).removePluginChunkTicket(plugin);
        verify(b).removePluginChunkTicket(plugin);
        assertEquals(0, chunks.size());
    }

    @Test
    @DisplayName("nulls are ignored rather than thrown")
    void nullsAreIgnored() {
        chunks.pin(null, chunk(0, 0));
        chunks.pin(new Object(), null);
        chunks.releaseAll(null);
        assertEquals(0, chunks.size());
    }

    @Test
    @DisplayName("releasing a session that holds nothing is harmless")
    void releasingAnUnknownOwnerDoesNothing() {
        Chunk c = chunk(0, 0);
        chunks.pin(new Object(), c);

        chunks.releaseAll(new Object());

        verify(c, never()).removePluginChunkTicket(plugin);
        assertEquals(1, chunks.size());
    }
}
