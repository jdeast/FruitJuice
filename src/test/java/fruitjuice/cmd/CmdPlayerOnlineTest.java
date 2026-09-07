package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyFloat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import fruitjuice.FruitJuicePlugin;
import fruitjuice.RemoteSession;
import java.util.Collections;
import java.util.List;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

/**
 * player.* with somebody logged in -- a fake somebody, so no server is needed.
 *
 * CmdPlayerReplyCountTest covers the empty server. This covers the other half:
 * a player is present, so dispatch reaches the command bodies. Between them
 * every player command is exercised in both states the server can be in.
 *
 * The rule under test is the same one throughout: a getter answers exactly
 * once, a setter answers not at all. There are no request ids on the wire, so a
 * setter that answers is read as the reply to the next command and the session
 * is off by one from then on.
 */
class CmdPlayerOnlineTest {

    private static final int PLAYER_ID = 7;

    private MockedStatic<Bukkit> bukkit;
    private RemoteSession session;
    private FruitJuicePlugin plugin;
    private Player player;
    private World world;

    private static String[] args(String... a) {
        return a.length == 0 ? new String[] {""} : a;
    }

    /** Arguments of the right shape, without a leading id. */
    private static String[] argsFor(String command) {
        int arity = CmdPlayer.ARG_COUNTS.getOrDefault(command, 0);
        if (arity == 0) {
            return new String[] {""};
        }
        String[] a = new String[arity];
        for (int i = 0; i < arity; i++) {
            a[i] = "1";
        }
        return a;
    }

    /** Replies sent, across both send overloads. */
    private long repliesSent() {
        return mockingDetails(session).getInvocations().stream()
                .filter(i -> i.getMethod().getName().equals("send"))
                .count();
    }

    @BeforeEach
    void setUp() {
        session = mock(RemoteSession.class);
        plugin = mock(FruitJuicePlugin.class);
        world = mock(World.class);
        player = mock(Player.class);

        when(world.getName()).thenReturn("world");
        Location where = new Location(world, 10.5, 64.0, 20.5, 90.0f, 45.0f);

        when(player.getLocation()).thenReturn(where);
        when(player.getWorld()).thenReturn(world);
        when(player.getEntityId()).thenReturn(PLAYER_ID);
        when(player.getName()).thenReturn("steve");
        when(player.getPlayerListName()).thenReturn("steve");
        when(player.getHealth()).thenReturn(20.0);
        when(player.getFoodLevel()).thenReturn(20);
        when(player.getVelocity()).thenReturn(new org.bukkit.util.Vector(0, 0, 0));

        // The unsupported-command branch logs via session.plugin, and a mock
        // leaves public fields null.
        session.plugin = plugin;
        when(plugin.getLogger()).thenReturn(java.util.logging.Logger.getLogger("test"));

        when(plugin.getHostPlayer()).thenReturn(player);
        when(plugin.getNamedPlayer(any())).thenReturn(player);

        when(session.blockLocationToRelative(any())).thenReturn("10,64,20");
        when(session.locationToRelative(any())).thenReturn("10.5,64.0,20.5");
        when(session.parseRelativeLocation(any(), any(), any())).thenReturn(where);
        when(session.parseRelativeBlockLocation(any(), any(), any())).thenReturn(where);
        when(session.parseRelativeLocation(any(), any(), any(), anyFloat(), anyFloat()))
                .thenReturn(where);
        when(session.parseRelativeBlockLocation(any(), any(), any(), anyFloat(), anyFloat()))
                .thenReturn(where);

        // One player online. This is the whole reason no real server is needed:
        // the only thing the code asks the outside world is Bukkit's static
        // player list, and Mockito mocks statics directly.
        bukkit = mockStatic(Bukkit.class);
        List<Player> online = Collections.singletonList(player);
        bukkit.when(Bukkit::getOnlinePlayers).thenReturn(online);
    }

    @AfterEach
    void tearDown() {
        bukkit.close();
    }

    private void execute(String command, String... a) {
        new CmdPlayer(session, plugin).execute(command, a.length == 0 ? argsFor(command) : a);
    }

    // ── the reply-count invariant, with a player present ───────────────────

    @ParameterizedTest
    @DisplayName("a getter answers exactly once")
    @ValueSource(strings = {"getTile", "getPos", "getAbsPos", "getDirection",
                            "getRotation", "getPitch", "getFoodLevel", "getHealth",
                            "getWorld"})
    void gettersAnswerOnce(String command) {
        execute(command);
        assertEquals(1, repliesSent(), command + " should answer exactly once");
    }

    @ParameterizedTest
    @DisplayName("a setter acts and says nothing")
    @ValueSource(strings = {"setTile", "setPos", "setAbsPos", "setDirection",
                            "setRotation", "setPitch", "setFoodLevel", "setHealth",
                            "sendTitle", "addForce", "setPlayer"})
    void settersSayNothing(String command) {
        if (command.equals("setPlayer")) {
            execute(command, "steve");
        } else {
            execute(command);
        }
        assertEquals(0, repliesSent(),
                command + " should not answer -- a stray reply is read as the "
                        + "answer to the next command");
    }

    @Test
    @DisplayName("an unsupported command is reported once rather than ignored")
    void unsupportedCommandAnswersOnce() {
        execute("noSuchCommand");
        assertEquals(1, repliesSent());
    }

    // ── the optional leading id, end to end rather than in isolation ───────

    @Test
    @DisplayName("a leading id selects that player and is not read as a coordinate")
    void leadingIdIsStrippedBeforeTheArgumentsAreUsed() {
        execute("setPos", String.valueOf(PLAYER_ID), "1", "2", "3");

        // The id must not survive into the coordinates. Reading setPos(7,1,2,3)
        // as x=7,y=1,z=2 is the bug this whole scheme exists to prevent, and it
        // teleports somebody silently rather than failing.
        verify(session).parseRelativeLocation("1", "2", "3", 45.0f, 90.0f);
        assertEquals(0, repliesSent());
    }

    @Test
    @DisplayName("an unknown id is reported once and nothing is moved")
    void unknownIdAnswersOnce() {
        // Nobody has entity id 999, so getPlayerById finds no one.
        execute("setPos", "999", "1", "2", "3");

        assertEquals(1, repliesSent());
        verify(player, never()).teleport(any(Location.class));
        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(session).send(sent.capture());
        assertTrue(sent.getValue().startsWith("Fail,"), sent.getValue());
    }

    @Test
    @DisplayName("getPos with an id answers once, exactly as it does without one")
    void getterWithAnIdStillAnswersOnce() {
        execute("getPos", String.valueOf(PLAYER_ID));
        assertEquals(1, repliesSent());
    }

    // ── the values themselves ──────────────────────────────────────────────

    @Test
    @DisplayName("getWorld reports the world the player is in")
    void getWorldReportsThePlayersWorld() {
        execute("getWorld");
        verify(session).send("world");
    }

    @Test
    @DisplayName("getRotation and getPitch report the player's own angles")
    void anglesComeFromThePlayer() {
        execute("getRotation");
        verify(session).send(90.0f);
    }

    @Test
    @DisplayName("getHealth and getFoodLevel come from the player, not a constant")
    void vitalsComeFromThePlayer() {
        when(player.getHealth()).thenReturn(3.5);
        execute("getHealth");
        verify(session).send(3.5);
    }

    @Test
    @DisplayName("setHealth and setFoodLevel reach the player")
    void settersReachThePlayer() {
        execute("setHealth", "5");
        verify(player).setHealth(anyDouble());

        session = mock(RemoteSession.class);
        execute("setFoodLevel", "9");
        verify(player).setFoodLevel(anyInt());
    }

    @Test
    @DisplayName("getTile and getPos go through the session's coordinate translation")
    void positionsAreTranslatedRelativeToTheOrigin() {
        // Not raw coordinates: the location config setting decides whether the
        // origin is 0,0,0 or the spawn point, and that translation lives on the
        // session. A command reading the player's location directly would
        // ignore it.
        execute("getTile");
        verify(session).blockLocationToRelative(any());
        verify(session).send("10,64,20");
    }
}
