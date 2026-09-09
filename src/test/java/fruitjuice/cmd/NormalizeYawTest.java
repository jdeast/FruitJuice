package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/**
 * player.getRotation must report a compass bearing.
 *
 * The version this replaces negated a negative yaw instead of wrapping it. That
 * is a mirror, not a rotation, and it is the worst shape of wrong: -90 is EAST
 * and came back as 90, which is WEST, so the whole eastern half of the compass
 * was reflected onto the western half. Anything reading it -- walking the way
 * you are facing, aiming a build at where you are looking -- was exactly
 * backwards for half the compass and perfectly correct for the other half,
 * which reads as "sometimes it works" rather than as a bug.
 *
 * Bukkit's convention: 0 south (+Z), 90 west (-X), 180 north (-Z), 270 east (+X).
 */
public class NormalizeYawTest {

    private static final float EPS = 1e-4f;

    @Test
    public void positiveBearingsAreUnchanged() {
        assertEquals(0f, CmdPlayer.normalizeYaw(0f), EPS);
        assertEquals(90f, CmdPlayer.normalizeYaw(90f), EPS);
        assertEquals(180f, CmdPlayer.normalizeYaw(180f), EPS);
        assertEquals(270f, CmdPlayer.normalizeYaw(270f), EPS);
    }

    @Test
    public void negativeYawWrapsRatherThanMirroring() {
        // The regression this exists for: east must not come back as west.
        assertEquals(270f, CmdPlayer.normalizeYaw(-90f), EPS,
                     "-90 is east and must stay east");
        assertEquals(180f, CmdPlayer.normalizeYaw(-180f), EPS);
        assertEquals(90f, CmdPlayer.normalizeYaw(-270f), EPS);
        assertEquals(315f, CmdPlayer.normalizeYaw(-45f), EPS);
    }

    @Test
    public void spinningPastAFullTurnWrapsToo() {
        // Bukkit keeps accumulating while a player spins on the spot.
        assertEquals(10f, CmdPlayer.normalizeYaw(370f), EPS);
        assertEquals(90f, CmdPlayer.normalizeYaw(450f), EPS);
        assertEquals(0f, CmdPlayer.normalizeYaw(720f), EPS);
        assertEquals(350f, CmdPlayer.normalizeYaw(-730f), EPS);
    }

    @Test
    public void everyBearingSurvivesARoundTrip() {
        // A rotation is one-to-one. The old mirror was not: it mapped -90 and
        // 90 both onto 90, so two different facings were indistinguishable.
        for (int deg = -720; deg <= 720; deg++) {
            float got = CmdPlayer.normalizeYaw(deg);
            assertEquals(((deg % 360) + 360) % 360, got, EPS, "yaw " + deg);
            if (got < 0f || got >= 360f) {
                throw new AssertionError("yaw " + deg + " left the range: " + got);
            }
        }
    }

    @Test
    public void oppositeFacingsStayOpposite() {
        // What the mirror actually destroyed: two facings 180 apart must stay
        // 180 apart, or "walk forwards" becomes "walk backwards".
        for (int deg = -359; deg <= 359; deg++) {
            float a = CmdPlayer.normalizeYaw(deg);
            float b = CmdPlayer.normalizeYaw(deg + 180);
            float apart = Math.abs(a - b);
            if (apart > 180f) apart = 360f - apart;
            assertEquals(180f, apart, 1e-2f, "yaw " + deg + " vs " + (deg + 180));
        }
    }

    @Test
    public void nonsenseBecomesSouthRatherThanNaN() {
        assertEquals(0f, CmdPlayer.normalizeYaw(Float.NaN), EPS);
        assertEquals(0f, CmdPlayer.normalizeYaw(Float.POSITIVE_INFINITY), EPS);
    }
}
