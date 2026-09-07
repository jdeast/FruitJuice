package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * The optional leading player id.
 *
 * pyncraft prepends an entity id to every positional command when
 * Minecraft.create() was given a playerName. Scratch never does, and neither
 * does pyncraft's default path, where playerId is [] and flattens away. Both
 * shapes arrive on the same commands, so the server decides by counting.
 *
 * Getting this wrong is not a crash: player.setPos(id,x,y,z) read as x=id
 * teleports the wrong player somewhere absurd, silently.
 */
class CmdPlayerDispatchTest {

    private static String[] args(String... a) {
        return a;
    }

    // ── the shape scratch and default pyncraft send ──────────────────────────

    @Test
    @DisplayName("a no-argument call arrives as one empty string, not an empty array")
    void normalisesTheEmptyCall() {
        assertEquals(0, CmdPlayer.normaliseArgs(args("")).length);
    }

    @Test
    void leavesRealArgumentsAlone() {
        assertArrayEquals(args("1", "2", "3"), CmdPlayer.normaliseArgs(args("1", "2", "3")));
    }

    @ParameterizedTest
    @DisplayName("no id when the command gets exactly the arguments it takes")
    @CsvSource({
        "getPos,       ''",
        "getRotation,  ''",
        "setRotation,  90",
        "setPitch,     45",
        "setFoodLevel, 20",
    })
    void noLeadingIdWhenArgumentCountMatches(String command, String rest) {
        String[] a = rest.isEmpty() ? args() : args(rest);
        assertNull(CmdPlayer.leadingPlayerId(command, a));
    }

    @Test
    void noLeadingIdForSetPosWithThreeCoordinates() {
        assertNull(CmdPlayer.leadingPlayerId("setPos", args("10.5", "64", "20")));
    }

    // ── the shape pyncraft sends with a playerName ──────────────────────────

    @Test
    void idIsTakenWhenThereIsExactlyOneArgumentTooMany() {
        assertEquals(42, CmdPlayer.leadingPlayerId("getPos", args("42")));
        assertEquals(42, CmdPlayer.leadingPlayerId("setPos", args("42", "10.5", "64", "20")));
        assertEquals(7, CmdPlayer.leadingPlayerId("setRotation", args("7", "90")));
    }

    @Test
    @DisplayName("the id is stripped so every command branch keeps its argument positions")
    void argumentsShiftAfterTheId() {
        String[] a = args("42", "10.5", "64", "20");
        Integer id = CmdPlayer.leadingPlayerId("setPos", a);
        assertEquals(42, id);
        assertArrayEquals(args("10.5", "64", "20"), java.util.Arrays.copyOfRange(a, 1, a.length));
    }

    // ── things that must not be mistaken for an id ──────────────────────────

    @Test
    @DisplayName("a non-numeric first argument is not an id")
    void nonNumericIsNotAnId() {
        // pyncraft's sendTitle used to pass the builtin id function, arriving as
        // "<built-in function id>". Rejecting it falls back to the old behaviour
        // rather than failing the command.
        assertNull(CmdPlayer.leadingPlayerId("sendTitle",
                args("<built-in function id>", "hi", "there", "10", "70", "20")));
    }

    @Test
    void setPlayerTakesANameSoIsNeverGivenIdTreatment() {
        // setPlayer is deliberately absent from the arity table
        assertNull(CmdPlayer.leadingPlayerId("setPlayer", args("steve")));
    }

    @Test
    void unknownCommandsAreNeverGivenIdTreatment() {
        assertNull(CmdPlayer.leadingPlayerId("notACommand", args("1", "2")));
    }

    @Test
    @DisplayName("two arguments too many is not an id either")
    void onlyExactlyOneExtraArgumentCounts() {
        assertNull(CmdPlayer.leadingPlayerId("getPos", args("42", "99")));
    }

    @Test
    void surroundingWhitespaceOnAnIdIsTolerated() {
        assertEquals(42, CmdPlayer.leadingPlayerId("getPos", args(" 42 ")));
    }

    @Test
    @DisplayName("sendTitle with an id is five arguments plus one")
    void sendTitleWithAnId() {
        assertEquals(3, CmdPlayer.leadingPlayerId("sendTitle",
                args("3", "title", "sub", "10", "70", "20")));
    }
}
