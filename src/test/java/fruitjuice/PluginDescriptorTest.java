package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

/**
 * plugin.yml has to satisfy more than Bukkit.
 *
 * Bukkit is forgiving: it reads what it recognises and ignores the rest, so a
 * malformed descriptor still loads and nothing complains. Hangar, PaperMC's
 * plugin repository, deserialises the same file into a typed object, and a
 * field of the wrong shape makes the whole thing come back empty. The error it
 * returns is "Could not load metadata from uploaded file", which does not say
 * which field or why.
 *
 * That is exactly what happened publishing 0.5.0: the descriptor said
 *
 *     author: [Zhuowei, MinecraftDawn, jdeast, d4g33z, mwrowe]
 *
 * and `author` is specified as a single string -- a list of authors goes in
 * `authors`. Bukkit had never minded. The upload failed on a stranger's server
 * with a message that named nothing, which is the worst place to find out.
 *
 * Hence these checks, which run in CI rather than at publish time.
 */
class PluginDescriptorTest {

    private static Map<String, Object> descriptor;

    @BeforeAll
    static void load() throws Exception {
        try (InputStream in = PluginDescriptorTest.class.getResourceAsStream("/plugin.yml")) {
            assertNotNull(in, "plugin.yml is not on the classpath");
            descriptor = new Yaml().load(in);
        }
        assertNotNull(descriptor, "plugin.yml parsed to nothing");
    }

    @Test
    @DisplayName("the fields every consumer needs are present and are strings")
    void requiredFieldsArePresent() {
        for (String key : new String[] {"name", "version", "main"}) {
            Object value = descriptor.get(key);
            assertNotNull(value, key + " is missing from plugin.yml");
            assertInstanceOf(String.class, value, key + " must be a string");
            assertFalse(((String) value).trim().isEmpty(), key + " is empty");
        }
    }

    @Test
    @DisplayName("author is a single string; several authors go in authors")
    void authorFieldsHaveTheRightShape() {
        Object author = descriptor.get("author");
        if (author != null) {
            assertInstanceOf(String.class, author,
                    "author must be a single string. For several people use "
                            + "authors: [a, b, c] -- a list here parses under Bukkit "
                            + "but makes Hangar reject the whole descriptor.");
        }

        Object authors = descriptor.get("authors");
        if (authors != null) {
            assertInstanceOf(List.class, authors, "authors must be a list");
            for (Object a : (List<?>) authors) {
                assertInstanceOf(String.class, a, "every author must be a string");
            }
        }

        assertTrue(author != null || authors != null,
                "credit the contributors in one of author or authors");
    }

    @Test
    @DisplayName("the version matches the one Maven built")
    void versionMatchesTheBuild() {
        // The two have disagreed before: plugin.yml reported 0.1.0 for three
        // releases while the pom moved on, so the server logged a version that
        // had not existed for years. The release workflow refuses to publish on
        // a mismatch; this catches it earlier, on every push.
        String fromPom = System.getProperty("project.version");
        if (fromPom == null || fromPom.isEmpty()) {
            return;     // running outside Maven, e.g. straight from an IDE
        }
        assertEquals(fromPom, descriptor.get("version"),
                "plugin.yml and pom.xml disagree about the version");
    }

    @Test
    @DisplayName("api-version is declared, so Bukkit does not treat this as pre-1.13")
    void apiVersionIsDeclared() {
        // Without it the server assumes a legacy plugin and applies the
        // pre-flattening material mapping, which is the one thing this plugin
        // most needs not to happen.
        Object apiVersion = descriptor.get("api-version");
        assertNotNull(apiVersion, "api-version is missing");
        assertInstanceOf(String.class, apiVersion,
                "api-version must be quoted, or 1.20 parses as the number 1.2");
    }
}
