package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import fruitjuice.FruitJuicePlugin;
import fruitjuice.RemoteSession;
import java.util.Collections;
import java.util.List;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

/**
 * One command, one reply. Never two, never none.
 *
 * The protocol has no request ids and no framing beyond a newline: a client
 * sends a line and reads a line. So a command that answers twice is not a
 * cosmetic problem. The spare line is read as the answer to the NEXT command,
 * and every reply after it is off by one for the rest of the session. A command
 * that answers a query not at all hangs the client instead.
 *
 * This actually happened. With nobody logged in, getCurrentPlayer() sent
 * "Fail,There are no players in the server." and returned null, and its caller
 * sent the identical message again on seeing the null. Because the two strings
 * were word for word the same, a client reading one reply per command saw
 * exactly what it expected until a command with a different answer came along,
 * by which point the session had been desynchronised for some time.
 *
 * That bug was found by running against a real empty server, not here -- there
 * was no harness that could invoke a command handler at all. There is now, and
 * it needs nothing exotic: Bukkit.getOnlinePlayers() is static, which Mockito
 * mocks directly, so the empty server can be constructed in a unit test.
 */
class CmdPlayerReplyCountTest {

    /** Arguments of the right arity for a command, so dispatch reaches its branch. */
    private static String[] argsFor(String command) {
        int arity = CmdPlayer.ARG_COUNTS.get(command);
        if (arity == 0) {
            // A no-argument call arrives as one empty string, as it does on the wire.
            return new String[] {""};
        }
        String[] args = new String[arity];
        for (int i = 0; i < arity; i++) {
            args[i] = "1";
        }
        return args;
    }

    private static MockedStatic<Bukkit> emptyServer() {
        MockedStatic<Bukkit> bukkit = mockStatic(Bukkit.class);
        List<Player> nobody = Collections.emptyList();
        bukkit.when(Bukkit::getOnlinePlayers).thenReturn(nobody);
        return bukkit;
    }

    @Test
    @DisplayName("every player command answers exactly once when the server is empty")
    void everyCommandAnswersExactlyOnceOnAnEmptyServer() {
        try (MockedStatic<Bukkit> bukkit = emptyServer()) {
            for (String command : CmdPlayer.ARG_COUNTS.keySet()) {
                RemoteSession session = mock(RemoteSession.class);
                FruitJuicePlugin plugin = mock(FruitJuicePlugin.class);

                new CmdPlayer(session, plugin).execute(command, argsFor(command));

                // times(1) alone would pass if a second reply went out through
                // the send(Object) overload, so account for every interaction.
                verify(session, times(1).description(
                        command + " should answer exactly once on an empty server"))
                        .send(anyString());
                verifyNoMoreInteractions(session);
            }
        }
    }

    @Test
    @DisplayName("setPlayer answers exactly once too, though it takes a name rather than an id")
    void setPlayerAlsoAnswersOnce() {
        // setPlayer is deliberately absent from the arity table, so the loop
        // above never reaches it -- and it had its own version of this bug. Its
        // helper sent a failure from inside a command that answers nothing at
        // all when it succeeds, which desynchronises a session just as surely.
        try (MockedStatic<Bukkit> bukkit = emptyServer()) {
            RemoteSession session = mock(RemoteSession.class);
            new CmdPlayer(session, mock(FruitJuicePlugin.class))
                    .execute("setPlayer", new String[] {"steve"});

            verify(session, times(1)).send(anyString());
            verifyNoMoreInteractions(session);
        }
    }

    @Test
    @DisplayName("the empty-server reply is a Fail the client can recognise")
    void theReplyIsAFail() {
        try (MockedStatic<Bukkit> bukkit = emptyServer()) {
            RemoteSession session = mock(RemoteSession.class);
            new CmdPlayer(session, mock(FruitJuicePlugin.class))
                    .execute("getPos", new String[] {""});

            org.mockito.ArgumentCaptor<String> sent =
                    org.mockito.ArgumentCaptor.forClass(String.class);
            verify(session).send(sent.capture());
            assertEquals("Fail,There are no players in the server.", sent.getValue());
        }
    }
}
