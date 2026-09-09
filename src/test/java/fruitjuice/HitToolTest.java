package fruitjuice;

import org.bukkit.Material;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Which items trigger a hit event.
 *
 * This was a hardcoded set of five swords, written in the initial commit in
 * December 2012 and never revisited. Netherite arrived in Minecraft 1.16 in
 * 2020, so for six years the best sword in the game silently did nothing:
 * hits never arrived, with no error and no log line, which from inside Scratch
 * looks exactly like the extension being broken.
 *
 * It was found by someone holding one and wondering why the piano was silent.
 */
class HitToolTest {

    @Test
    @DisplayName("every sword counts, including the one added after the list was written")
    void allSwordsCount() {
        assertTrue(FruitJuicePlugin.isHitTool(Material.WOODEN_SWORD));
        assertTrue(FruitJuicePlugin.isHitTool(Material.STONE_SWORD));
        assertTrue(FruitJuicePlugin.isHitTool(Material.IRON_SWORD));
        assertTrue(FruitJuicePlugin.isHitTool(Material.GOLDEN_SWORD));
        assertTrue(FruitJuicePlugin.isHitTool(Material.DIAMOND_SWORD));
        assertTrue(FruitJuicePlugin.isHitTool(Material.NETHERITE_SWORD));
    }

    @Test
    @DisplayName("no sword is missed, whatever the server version calls them")
    void noSwordIsMissed() {
        for (Material m : Material.values()) {
            if (m.name().endsWith("_SWORD") && !m.name().startsWith("LEGACY_")) {
                assertTrue(FruitJuicePlugin.isHitTool(m),
                        m.name() + " should trigger a hit");
            }
        }
    }

    @Test
    @DisplayName("other tools do not, so ordinary play does not fire events")
    void otherToolsDoNot() {
        assertFalse(FruitJuicePlugin.isHitTool(Material.DIAMOND_PICKAXE));
        assertFalse(FruitJuicePlugin.isHitTool(Material.NETHERITE_AXE));
        assertFalse(FruitJuicePlugin.isHitTool(Material.STICK));
        assertFalse(FruitJuicePlugin.isHitTool(Material.STONE));
        assertFalse(FruitJuicePlugin.isHitTool(Material.AIR));
    }

    @Test
    @DisplayName("nothing in hand is not a sword")
    void nothingInHand() {
        assertFalse(FruitJuicePlugin.isHitTool(null));
    }
}
