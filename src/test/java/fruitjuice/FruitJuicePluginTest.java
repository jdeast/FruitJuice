package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import java.net.InetSocketAddress;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

class FruitJuicePluginTest {

    /**
     * Which interface the plugin listens on.
     *
     * config.yml has documented a `hostname` setting since the beginning --
     * "localhost would prevent remote clients from connecting" -- and nothing
     * ever read it. It bound every interface no matter what was configured, so
     * anyone who set it had a security control that did nothing at all, and no
     * way to tell.
     */
    @Nested
    class BindAddress {

        @Test
        @DisplayName("blank means every interface, which is the documented default")
        void blankBindsEverything() {
            for (String blank : new String[] {null, "", "   "}) {
                InetSocketAddress address = FruitJuicePlugin.bindAddressFor(blank, 4711);
                assertEquals(4711, address.getPort());
                assertTrue(address.getAddress().isAnyLocalAddress(),
                        "expected 0.0.0.0 for " + (blank == null ? "null" : "'" + blank + "'")
                                + " but got " + address);
            }
        }

        @Test
        @DisplayName("localhost really does refuse remote clients now")
        void localhostBindsTheLoopbackOnly() {
            InetSocketAddress address = FruitJuicePlugin.bindAddressFor("localhost", 4711);
            assertTrue(address.getAddress().isLoopbackAddress(), address.toString());
            assertEquals(4711, address.getPort());
        }

        @Test
        @DisplayName("surrounding whitespace does not turn into a different host")
        void hostnameIsTrimmed() {
            // A trailing space in a YAML value is invisible in an editor. Without
            // trimming this becomes a lookup for "localhost " and fails to
            // resolve, which binds nothing rather than the loopback.
            InetSocketAddress address = FruitJuicePlugin.bindAddressFor("  localhost  ", 4711);
            assertTrue(address.getAddress().isLoopbackAddress(), address.toString());
        }

        @Test
        @DisplayName("the port is carried through unchanged")
        void portIsPreserved() {
            assertEquals(4712, FruitJuicePlugin.bindAddressFor(null, 4712).getPort());
            assertEquals(4712, FruitJuicePlugin.bindAddressFor("localhost", 4712).getPort());
        }
    }

    /**
     * Finding a player by name.
     *
     * This used to compare against the tab-list name only. That name is not the
     * player's name: plugins decorate it freely, and on a server running
     * Geyser/floodgate every Bedrock player's list entry carries a prefix. So
     * Minecraft.create(..., playerName="steve") failed to find steve, fell back
     * to the host player, and silently drove somebody else.
     */
    @Nested
    class NamedPlayerLookup {

        private FruitJuicePlugin pluginWithoutConstructing() {
            // The real method only consults Bukkit's static player list, so it
            // can run on an instance that was never constructed -- which matters
            // because a JavaPlugin cannot be built outside a running server.
            return mock(FruitJuicePlugin.class, withSettings()
                    .defaultAnswer(CALLS_REAL_METHODS));
        }

        private Player player(String name, String listName) {
            Player p = mock(Player.class);
            when(p.getName()).thenReturn(name);
            when(p.getPlayerListName()).thenReturn(listName);
            return p;
        }

        @Test
        @DisplayName("a player is found by their real name even when the list name differs")
        void realNameWins() {
            Player steve = player("steve", "[Admin] steve");
            Player bob = player("bob", "bob");
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Arrays.asList(steve, bob);
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertSame(steve, pluginWithoutConstructing().getNamedPlayer("steve"));
            }
        }

        @Test
        @DisplayName("a bedrock player whose list name carries a prefix is still found")
        void prefixedListNameDoesNotHide() {
            // Exactly the shape floodgate produces: the account is "Nella3454"
            // and the list entry is ".Nella3454".
            Player nella = player("Nella3454", ".Nella3454");
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Collections.singletonList(nella);
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertSame(nella, pluginWithoutConstructing().getNamedPlayer("Nella3454"));
            }
        }

        @Test
        @DisplayName("the list name still works, so anything relying on it keeps working")
        void listNameIsStillAFallback() {
            Player steve = player("steve", "[Admin] steve");
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Collections.singletonList(steve);
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertSame(steve, pluginWithoutConstructing().getNamedPlayer("[Admin] steve"));
            }
        }

        @Test
        @DisplayName("the real name is preferred when two players collide on it")
        void realNameBeatsAnotherPlayersListName() {
            // Someone whose list name happens to equal another player's real
            // name must not shadow them. Both loops run in order for exactly
            // this reason.
            Player realSteve = player("steve", "steve the builder");
            Player impostor = player("mallory", "steve");
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Arrays.asList(impostor, realSteve);
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertSame(realSteve, pluginWithoutConstructing().getNamedPlayer("steve"),
                        "the player actually called steve should win");
            }
        }

        @Test
        @DisplayName("an unknown name is null rather than the first player who happens to be on")
        void unknownNameIsNull() {
            Player bob = player("bob", "bob");
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Collections.singletonList(bob);
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertNull(pluginWithoutConstructing().getNamedPlayer("nobody"));
            }
        }

        @Test
        @DisplayName("a null name does not throw")
        void nullNameIsNull() {
            try (MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class)) {
                List<Player> online = Collections.emptyList();
                bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);

                assertNull(pluginWithoutConstructing().getNamedPlayer(null));
            }
        }
    }
}
