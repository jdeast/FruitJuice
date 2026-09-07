package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import fruitjuice.FruitJuicePlugin;
import fruitjuice.RemoteSession;
import java.util.logging.Logger;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

/**
 * entity.* against a fake entity, so none of this needs a server or a player.
 *
 * The invariant being defended is the same one CmdPlayerReplyCountTest defends:
 * one command, one reply -- or for a setter, one command, no reply. The wire
 * has no request ids, so a command that answers when it should not is read as
 * the answer to the next command, and everything after it is off by one.
 */
class CmdEntityTest {

    private static final int ID = 42;

    private RemoteSession session;
    private FruitJuicePlugin plugin;
    private Entity entity;
    private World world;

    /** Every entity.* command that answers a question. */
    private static final String[] GETTERS = {
        "getTile", "getPos", "getDirection", "getRotation", "getPitch", "getName",
    };

    /** Every entity.* command that acts and stays quiet. */
    private static final String[] SETTERS = {
        "setTile", "setPos", "addForce", "setDirection", "setRotation", "setPitch",
    };

    private static String[] args(String... rest) {
        String[] a = new String[rest.length + 1];
        a[0] = String.valueOf(ID);
        System.arraycopy(rest, 0, a, 1, rest.length);
        return a;
    }

    /** Arguments of the right shape for a command, id included. */
    private static String[] argsFor(String command) {
        switch (command) {
            case "setTile":
            case "setPos":
            case "addForce":
            case "setDirection":
                return args("1", "2", "3");
            case "setRotation":
            case "setPitch":
                return args("90");
            default:
                return args();
        }
    }

    /** How many replies went out, across both send overloads. */
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
        entity = mock(Entity.class);

        // CmdEntity reads session.plugin directly, and a mock leaves public
        // fields null.
        session.plugin = plugin;
        when(plugin.getLogger()).thenReturn(Logger.getLogger("test"));

        Location where = new Location(world, 10.5, 64.0, 20.5, 90.0f, 45.0f);
        when(entity.getLocation()).thenReturn(where);
        when(entity.getEntityId()).thenReturn(ID);
        when(entity.getName()).thenReturn("Pig");
        // addForce reads the current velocity before adding to it, so this has
        // to be a real Vector rather than a mock's null.
        when(entity.getVelocity()).thenReturn(new org.bukkit.util.Vector(0, 0, 0));
        when(plugin.getEntity(ID)).thenReturn(entity);

        when(session.blockLocationToRelative(any())).thenReturn("10,64,20");
        when(session.locationToRelative(any())).thenReturn("10.5,64.0,20.5");
    }

    private void execute(String command) {
        new CmdEntity(session).execute(command, argsFor(command));
    }

    // ── the reply-count invariant ──────────────────────────────────────────

    @ParameterizedTest
    @DisplayName("a getter answers exactly once")
    @ValueSource(strings = {"getTile", "getPos", "getDirection", "getRotation",
                            "getPitch", "getName"})
    void gettersAnswerOnce(String command) {
        execute(command);
        assertEquals(1, repliesSent(), command + " should answer exactly once");
    }

    @ParameterizedTest
    @DisplayName("a setter acts and says nothing")
    @ValueSource(strings = {"setTile", "setPos", "addForce", "setDirection",
                            "setRotation", "setPitch"})
    void settersSayNothing(String command) {
        execute(command);
        assertEquals(0, repliesSent(),
                command + " should not answer -- a stray reply is read as the "
                        + "answer to the next command");
    }

    @Test
    @DisplayName("an unknown id is reported once, and nothing else happens")
    void unknownEntityAnswersOnceAndStops() {
        when(plugin.getEntity(999)).thenReturn(null);
        new CmdEntity(session).execute("getPos", new String[] {"999"});

        assertEquals(1, repliesSent());
        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(session).send(sent.capture());
        assertTrue(sent.getValue().startsWith("Fail,"), sent.getValue());
        // Falling through here used to NPE on entity.getLocation(), and the
        // outer handler then answered with a SECOND Fail.
        verify(entity, never()).getLocation();
    }

    @Test
    @DisplayName("an unsupported command is reported once rather than ignored")
    void unsupportedCommandAnswersOnce() {
        execute("noSuchCommand");
        assertEquals(1, repliesSent());
    }

    // ── entity.remove ──────────────────────────────────────────────────────

    @Test
    @DisplayName("remove removes the entity and answers with its id")
    void removeRemovesAndAnswers() {
        new CmdEntity(session).execute("remove", args());

        verify(entity, times(1)).remove();
        assertEquals(1, repliesSent());
        verify(session).send(ID);
    }

    @Test
    @DisplayName("remove refuses a player instead of quietly doing nothing")
    void removeRefusesAPlayer() {
        Player player = mock(Player.class);
        when(player.getLocation()).thenReturn(new Location(world, 0, 0, 0));
        when(player.getName()).thenReturn("steve");
        when(plugin.getEntity(ID)).thenReturn(player);

        new CmdEntity(session).execute("remove", args());

        // Entity.remove() does nothing at all on a player, so calling it would
        // have reported success while changing nothing.
        verify(player, never()).remove();
        assertEquals(1, repliesSent());
        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(session).send(sent.capture());
        assertTrue(sent.getValue().startsWith("Fail,"), sent.getValue());
        assertTrue(sent.getValue().contains("steve"), sent.getValue());
    }

    @Test
    @DisplayName("removing an id that is not there answers once and removes nothing")
    void removeUnknownId() {
        when(plugin.getEntity(999)).thenReturn(null);
        new CmdEntity(session).execute("remove", new String[] {"999"});

        assertEquals(1, repliesSent());
        verify(entity, never()).remove();
    }

    // ── the values themselves ──────────────────────────────────────────────

    @Test
    @DisplayName("getRotation and getPitch report the entity's own angles")
    void anglesComeFromTheEntity() {
        execute("getRotation");
        verify(session).send(90.0f);

        session = mock(RemoteSession.class);
        session.plugin = plugin;
        execute("getPitch");
        verify(session).send(45.0f);
    }

    @Test
    @DisplayName("getName uses the list name for a player and the plain name otherwise")
    void nameDependsOnWhetherItIsAPlayer() {
        execute("getName");
        verify(session).send("Pig");

        Player player = mock(Player.class);
        when(player.getLocation()).thenReturn(new Location(world, 0, 0, 0));
        when(player.getPlayerListName()).thenReturn("steve");
        when(plugin.getEntity(ID)).thenReturn(player);

        session = mock(RemoteSession.class);
        session.plugin = plugin;
        new CmdEntity(session).execute("getName", args());
        // getNamedPlayer looks players up by list name, so getName has to agree
        // with it or a round trip through the two does not find the player.
        verify(session).send("steve");
        verify(player, never()).getName();
    }

    @Test
    @DisplayName("every getter and setter is accounted for by the lists above")
    void theCommandListsAreComplete() {
        // A command added without a decision about whether it replies is the
        // bug this file exists to prevent, so fail loudly if the lists drift.
        assertEquals(6, GETTERS.length);
        assertEquals(6, SETTERS.length);
        for (String g : GETTERS) {
            session = mock(RemoteSession.class);
            session.plugin = plugin;
            execute(g);
            assertEquals(1, repliesSent(), g);
        }
        for (String s : SETTERS) {
            session = mock(RemoteSession.class);
            session.plugin = plugin;
            execute(s);
            assertEquals(0, repliesSent(), s);
        }
        verify(session, never()).send(anyString());
    }
}
