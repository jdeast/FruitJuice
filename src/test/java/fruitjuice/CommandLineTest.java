package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** The wire protocol's parsing rules. */
class CommandLineTest {

    @Test
    void parsesNameAndArguments() {
        CommandLine c = CommandLine.parse("world.setBlock(1,2,3,STONE)");
        assertEquals("world.setBlock", c.name);
        assertArrayEquals(new String[] {"1", "2", "3", "STONE"}, c.args);
    }

    @Test
    void splitsNamespaceFromCommand() {
        CommandLine c = CommandLine.parse("world.setBlock(1,2,3,STONE)");
        assertEquals("world", c.namespace());
        assertEquals("setBlock", c.command());
    }

    @Test
    @DisplayName("events.block.hits keeps the dot in the command half")
    void keepsDotsAfterTheNamespace() {
        CommandLine c = CommandLine.parse("events.block.hits()");
        assertEquals("events", c.namespace());
        assertEquals("block.hits", c.command());
    }

    @Test
    @DisplayName("a call with no arguments gives an empty array, not one empty string")
    void noArgumentsGivesAnEmptyArray() {
        // String.split returns [""] here, which is why player.getPos() used to
        // look like it had one argument and broke the arity dispatch.
        assertEquals(0, CommandLine.parse("player.getPos()").args.length);
    }

    @Test
    void keepsEmptyArgumentsInTheMiddleAndAtTheEnd() {
        // split(",") without a negative limit drops trailing empties, which
        // would silently shorten a sendTitle with a blank subtitle
        CommandLine c = CommandLine.parse("player.sendTitle(hi,,10,70,)");
        assertArrayEquals(new String[] {"hi", "", "10", "70", ""}, c.args);
    }

    @ParameterizedTest
    @DisplayName("anything that is not name(arguments) parses to null rather than throwing")
    @ValueSource(strings = {
        "GET / HTTP/1.1",          // a port scanner
        "",                        // a stray newline
        "   ",
        "world.setBlock",          // no brackets
        "world.setBlock(1,2,3",    // unterminated
        "(1,2,3)",                 // no name
    })
    void malformedLinesAreRejected(String line) {
        // This used to be an unguarded substring() that threw inside the tick
        // loop, so the client got no reply at all and waited forever.
        assertNull(CommandLine.parse(line));
    }

    @Test
    void nullIsRejected() {
        assertNull(CommandLine.parse(null));
    }

    @Test
    void surroundingWhitespaceIsIgnored() {
        assertEquals("world.getHeight", CommandLine.parse("  world.getHeight(0,0)  ").name);
    }

    @Test
    @DisplayName("free text survives a round trip through the comma split")
    void rawArgumentsRebuildsTheOriginalText() {
        // chat.post used to rejoin with a space, turning "Hello, world!" into
        // "Hello  world!" and making a comma impossible to send.
        CommandLine c = CommandLine.parse("chat.post(Hello, world!)");
        assertEquals("Hello, world!", c.rawArguments());
    }

    @Test
    void rawArgumentsHandlesSeveralCommas() {
        assertEquals("a,b,c", CommandLine.parse("chat.post(a,b,c)").rawArguments());
    }

    @Test
    void rawArgumentsOfAnEmptyCallIsEmpty() {
        assertEquals("", CommandLine.parse("player.getPos()").rawArguments());
    }
}
