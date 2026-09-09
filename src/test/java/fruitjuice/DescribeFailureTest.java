package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * A failure has to say what went wrong, to the person who caused it.
 *
 * Every error used to come back as "Fail,Please check out minecraft server
 * console". That is useless to whoever hit it: a child working in Scratch has
 * no way to see the console, and the reply is the only thing that reaches them.
 * A misspelled block, a letter typed where a number goes and a facing that is
 * not a direction all arrived as the same sentence.
 *
 * The reply is also a LINE in a line-based protocol, so it must not contain a
 * newline of its own -- one would be read as the end of the reply, and whatever
 * followed as the answer to the next question asked.
 */
public class DescribeFailureTest {

    @Test
    @DisplayName("a mistyped block name comes back naming the block")
    void namesTheBadValue() {
        // What Material.valueOf actually throws.
        String s = RemoteSession.describe(
            new IllegalArgumentException("No enum constant org.bukkit.Material.STOEN"));
        assertTrue(s.contains("STOEN"), s);
    }

    @Test
    @DisplayName("a letter typed where a number goes says so")
    void namesTheBadNumber() {
        String s = RemoteSession.describe(new NumberFormatException("For input string: \"abc\""));
        assertTrue(s.contains("abc"), s);
    }

    @Test
    @DisplayName("an exception with no message still identifies itself")
    void fallsBackToTheClassName() {
        assertEquals("NullPointerException", RemoteSession.describe(new NullPointerException()));
        assertEquals("NullPointerException", RemoteSession.describe(new NullPointerException("")));
    }

    @Test
    @DisplayName("less obvious exceptions carry their class name too")
    void keepsContextWhereTheMessageAloneIsCryptic() {
        String s = RemoteSession.describe(new IllegalStateException("not here"));
        assertTrue(s.startsWith("IllegalStateException"), s);
        assertTrue(s.contains("not here"), s);
    }

    @Test
    @DisplayName("a newline in the message cannot end the reply early")
    void staysOnOneLine() {
        String s = RemoteSession.describe(new IllegalStateException("first\nsecond\r\nthird"));
        assertFalse(s.contains("\n"), s);
        assertFalse(s.contains("\r"), s);
        assertTrue(s.contains("first") && s.contains("third"), s);
    }

    @Test
    @DisplayName("a runaway message is truncated rather than sent whole")
    void isBounded() {
        StringBuilder huge = new StringBuilder();
        for (int i = 0; i < 500; i++) huge.append("wide ");
        String s = RemoteSession.describe(new IllegalArgumentException(huge.toString()));
        assertTrue(s.length() <= 200, "length was " + s.length());
        assertTrue(s.endsWith("..."), s);
    }

    @Test
    @DisplayName("nobody is told to go and read the server console")
    void doesNotPointAtSomethingUnreachable() {
        String s = RemoteSession.describe(new IllegalArgumentException("No enum constant Material.X"));
        assertFalse(s.toLowerCase().contains("console"), s);
    }
}
