package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.bukkit.Location;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * A fill must not be able to stop the server.
 *
 * setBlocks loops over the whole cuboid on the main server thread and nothing
 * bounded how big one could be. Turning physics off made each block cheap,
 * which fixed the cost per block and left the count alone -- a coordinate typed
 * with one extra digit is still billions of iterations, and Paper's watchdog
 * kills a server that stops ticking.
 *
 * The volume has to be computed in long arithmetic. Three int extents that each
 * fit comfortably in an int multiply into something that does not, and a
 * silently overflowed int can come out small -- or negative -- and sail through
 * the very check meant to catch it.
 */
public class FillVolumeTest {

    private static Location at(int x, int y, int z) {
        return new Location(null, x, y, z);
    }

    @Test
    @DisplayName("both corners are included in the count")
    void boundsAreInclusive() {
        assertEquals(1L, CmdWorld.fillVolume(at(0, 0, 0), at(0, 0, 0)), "one block");
        assertEquals(8L, CmdWorld.fillVolume(at(0, 0, 0), at(1, 1, 1)), "2x2x2");
        assertEquals(1000L, CmdWorld.fillVolume(at(0, 0, 0), at(9, 9, 9)), "10x10x10");
    }

    @Test
    @DisplayName("the corners may be given in either order")
    void orderDoesNotMatter() {
        assertEquals(CmdWorld.fillVolume(at(0, 0, 0), at(9, 4, 2)),
                     CmdWorld.fillVolume(at(9, 4, 2), at(0, 0, 0)));
    }

    @Test
    @DisplayName("negative coordinates count the same as positive ones")
    void negativesSpanTheSame() {
        assertEquals(1000L, CmdWorld.fillVolume(at(-9, -9, -9), at(0, 0, 0)));
        // Spanning zero must not cancel out.
        assertEquals(21L * 21L * 21L, CmdWorld.fillVolume(at(-10, -10, -10), at(10, 10, 10)));
    }

    @Test
    @DisplayName("a mistyped coordinate is over the limit rather than overflowing under it")
    void aTypoIsCaught() {
        // The shape of the accident: one extra zero on a single coordinate.
        long intended = CmdWorld.fillVolume(at(0, 0, 0), at(100, 10, 100));
        long typo = CmdWorld.fillVolume(at(0, 0, 0), at(100, 10, 1000));
        assertTrue(intended <= CmdWorld.MAX_FILL_BLOCKS, "the intended fill is allowed: " + intended);
        assertTrue(typo > CmdWorld.MAX_FILL_BLOCKS, "the typo is refused: " + typo);
    }

    @Test
    @DisplayName("a huge span stays positive instead of overflowing")
    void noIntegerOverflow() {
        // Each extent fits in an int; the product does not. In int arithmetic
        // this wraps, and a wrapped value can land under the limit -- so the
        // check would pass and the server would then try to write it.
        long v = CmdWorld.fillVolume(at(-2_000_000, -300, -2_000_000),
                                     at(2_000_000, 300, 2_000_000));
        assertTrue(v > 0, "volume must not go negative: " + v);
        assertTrue(v > CmdWorld.MAX_FILL_BLOCKS, "and must be over the limit: " + v);
    }

    @Test
    @DisplayName("the limits are set where they were documented")
    void limitsAreSane() {
        // A million is 100x100x100 -- far more than any example builds in one
        // call, and small enough to write without missing a tick.
        assertEquals(1_000_000L, CmdWorld.MAX_FILL_BLOCKS);
        // TNT is 4 and a charged creeper is 6, so 20 is already a large crater.
        assertTrue(CmdWorld.MAX_EXPLOSION_POWER >= 6f, "must still allow a big bang");
        assertTrue(CmdWorld.MAX_EXPLOSION_POWER <= 50f, "but not an unbounded one");
    }
}
