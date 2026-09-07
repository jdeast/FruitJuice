package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Turning a coordinate string into a block coordinate. */
class CoordinateTest {

    @ParameterizedTest
    @CsvSource({
        "0,      0",
        "1,      1",
        "1.9,    1",
        "-1,    -1",
    })
    void wholeAndPositiveCoordinatesAreUnsurprising(String given, int expected) {
        assertEquals(expected, RemoteSession.toBlockCoordinate(given));
    }

    @ParameterizedTest
    @DisplayName("negative fractions floor rather than truncating toward zero")
    @CsvSource({
        "-0.5,  -1",
        "-0.1,  -1",
        "-1.5,  -2",
        "-2.9,  -3",
    })
    void negativeFractionsFloor(String given, int expected) {
        // A cast truncates toward zero, so -0.5 gave block 0 instead of -1 and
        // everything at a negative fractional coordinate was one block out.
        assertEquals(expected, RemoteSession.toBlockCoordinate(given));
    }

    @Test
    @DisplayName("the block containing a position is the same whichever side you approach from")
    void flooringIsConsistentAcrossZero() {
        // Every point within a block must map to that block. With a cast, the
        // two halves of block -1 disagreed.
        assertEquals(-1, RemoteSession.toBlockCoordinate("-0.99"));
        assertEquals(-1, RemoteSession.toBlockCoordinate("-1.0"));
        assertEquals(0, RemoteSession.toBlockCoordinate("0.0"));
        assertEquals(0, RemoteSession.toBlockCoordinate("0.99"));
    }
}
