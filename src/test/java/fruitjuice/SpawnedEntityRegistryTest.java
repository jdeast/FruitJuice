package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import java.util.Collections;
import java.util.List;
import org.bukkit.Bukkit;
import org.bukkit.Server;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

/**
 * Finding an entity we spawned, on a server with nobody logged in.
 *
 * getEntity resolved an id by scanning every world's getEntities(), which only
 * reports entities in loaded chunks. Nothing keeps chunks loaded when no player
 * is online, so on an empty server that scan found nothing whatsoever --
 * measured on the live server, no id in 0..119 resolved, while spawnEntity
 * happily kept handing back new ones. A script could spawn something and be
 * unable to touch it a millisecond later, including to remove it again.
 *
 * spawnEntity already holds the Entity, so remembering it removes the need to
 * search at all.
 */
class SpawnedEntityRegistryTest {

    private static final int ID = 55;

    private FruitJuicePlugin plugin;
    private MockedStatic<Bukkit> bukkit;
    private Server server;
    private World world;

    /**
     * The real methods on an instance that was never constructed -- a
     * JavaPlugin cannot be built outside a running server.
     */
    @BeforeEach
    void setUp() {
        plugin = mock(FruitJuicePlugin.class,
                withSettings().defaultAnswer(CALLS_REAL_METHODS));

        server = mock(Server.class);
        world = mock(World.class);
        // An empty server: nobody online, and a world whose loaded chunks hold
        // nothing, which is exactly the state that broke this.
        List<Player> nobody = Collections.emptyList();
        doReturn(nobody).when(server).getOnlinePlayers();
        when(server.getWorlds()).thenReturn(Collections.singletonList(world));
        when(world.getEntities()).thenReturn(Collections.emptyList());
        when(plugin.getServer()).thenReturn(server);

        bukkit = mockStatic(Bukkit.class);
        bukkit.when(Bukkit::getOnlinePlayers).thenReturn(nobody);
    }

    @AfterEach
    void tearDown() {
        bukkit.close();
    }

    /**
     * The registry is static, so it survives between tests. Emptying it keeps
     * each test independent of the order the others ran in.
     */
    @BeforeEach
    void emptyTheRegistry() throws Exception {
        java.lang.reflect.Field f =
                FruitJuicePlugin.class.getDeclaredField("spawnedEntities");
        f.setAccessible(true);
        ((java.util.Map<?, ?>) f.get(null)).clear();
    }

    private Entity pig(boolean valid) {
        Entity e = mock(Entity.class);
        when(e.getEntityId()).thenReturn(ID);
        when(e.isValid()).thenReturn(valid);
        return e;
    }

    @Test
    @DisplayName("without the registry an empty server finds nothing -- the bug")
    void theScanAloneFindsNothing() {
        assertNull(plugin.getEntity(ID),
                "nothing is loaded, so the scan cannot find anything");
    }

    @Test
    @DisplayName("an entity we spawned is found even though no chunk is loaded")
    void rememberedEntityIsFound() {
        Entity spawned = pig(true);
        plugin.rememberSpawnedEntity(spawned);

        assertSame(spawned, plugin.getEntity(ID));
    }

    @Test
    @DisplayName("a dead entity is not handed back, and is not kept forever")
    void deadEntityIsDroppedRatherThanReturned() {
        Entity dead = pig(false);
        plugin.rememberSpawnedEntity(dead);

        assertNull(plugin.getEntity(ID), "a dead entity should not be returned");
        // Dropped on the way past, so the map does not fill with corpses and a
        // reused id is not permanently shadowed.
        assertNull(plugin.getEntity(ID));
    }

    @Test
    @DisplayName("a player still wins, so player ids never resolve to a stale entity")
    void onlinePlayersAreCheckedFirst() {
        Player player = mock(Player.class);
        when(player.getEntityId()).thenReturn(ID);
        List<Player> online = Collections.singletonList(player);
        doReturn(online).when(server).getOnlinePlayers();

        plugin.rememberSpawnedEntity(pig(true));

        assertSame(player, plugin.getEntity(ID),
                "the live player must win over anything remembered under that id");
    }

    @Test
    @DisplayName("remembering null does not throw")
    void nullIsIgnored() {
        plugin.rememberSpawnedEntity(null);
        assertNull(plugin.getEntity(ID));
    }

    @Test
    @DisplayName("the registry is bounded, so a spawning loop cannot grow it forever")
    void oldestEntriesAreEvicted() {
        // A script spawning in a loop would otherwise pin every entity it ever
        // made. Keep the most recent; the oldest is the least likely to still
        // be wanted.
        final int bound = 1000;
        for (int i = 0; i < bound + 10; i++) {
            Entity e = mock(Entity.class);
            when(e.getEntityId()).thenReturn(i);
            when(e.isValid()).thenReturn(true);
            plugin.rememberSpawnedEntity(e);
        }

        assertNull(plugin.getEntity(0), "the oldest should have been evicted");
        assertNull(plugin.getEntity(9), "the oldest should have been evicted");
        // The newest are still there.
        for (int i = bound; i < bound + 10; i++) {
            final int id = i;
            assertEquals(id, plugin.getEntity(id).getEntityId(),
                    "recent entity " + id + " should still be remembered");
        }
    }
}
