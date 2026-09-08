package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Which files /py will and will not run.
 *
 * This is the security boundary of the whole feature. /py runs a process as the
 * user the server runs as, and Minecraft op does not otherwise grant that, so
 * "only scripts inside the configured directory" has to actually hold rather
 * than merely look like it does.
 *
 * The interesting case is not "..". It is a symlink sitting inside the scripts
 * directory and pointing somewhere else: it contains no suspicious characters,
 * passes every textual check, and resolves outside. Hence the containment test
 * runs after following links, and hence these tests create real links.
 */
class PyCommandTest {

    @TempDir
    Path root;

    private Path scripts;
    private Path outside;

    @BeforeEach
    void setUp() throws IOException {
        scripts = Files.createDirectories(root.resolve("plugins/FruitJuice/scripts"));
        outside = Files.createDirectories(root.resolve("elsewhere"));
        Files.write(scripts.resolve("hello.py"), List.of("print('hi')"));
        Files.write(scripts.resolve("build_tower.py"), List.of("pass"));
        Files.write(outside.resolve("secrets.py"), List.of("pass"));
    }

    // ── what should work ───────────────────────────────────────────────────

    @Test
    @DisplayName("a plain name resolves, with or without the extension")
    void plainNamesResolve() {
        assertNotNull(PyCommand.resolveScript(scripts, "hello"));
        assertNotNull(PyCommand.resolveScript(scripts, "hello.py"));
        assertEquals("hello.py",
                PyCommand.resolveScript(scripts, "hello").getFileName().toString());
    }

    @Test
    @DisplayName("underscores and digits in a name are fine")
    void ordinaryNamesAreNotRejected() {
        assertNotNull(PyCommand.resolveScript(scripts, "build_tower"));
    }

    // ── what must not ──────────────────────────────────────────────────────

    @ParameterizedTest
    @DisplayName("nothing with a path separator or a traversal is accepted")
    @ValueSource(strings = {
        "../elsewhere/secrets",
        "../../elsewhere/secrets",
        "/etc/passwd",
        "subdir/hello",
        "..\\elsewhere\\secrets",
        "..",
        ".",
    })
    void traversalIsRefused(String name) {
        assertNull(PyCommand.resolveScript(scripts, name), name + " should not resolve");
    }

    @Test
    @DisplayName("an empty or null name is refused")
    void emptyIsRefused() {
        assertNull(PyCommand.resolveScript(scripts, ""));
        assertNull(PyCommand.resolveScript(scripts, null));
    }

    @Test
    @DisplayName("a name that is not there is refused rather than invented")
    void missingIsRefused() {
        assertNull(PyCommand.resolveScript(scripts, "nosuchscript"));
    }

    @Test
    @DisplayName("a directory is not a script")
    void directoriesAreRefused() throws IOException {
        Files.createDirectory(scripts.resolve("subdir.py"));
        assertNull(PyCommand.resolveScript(scripts, "subdir"));
    }

    @Test
    @DisplayName("a symlink pointing out of the directory is refused")
    void symlinkEscapeIsRefused() throws IOException {
        Path link = scripts.resolve("innocent.py");
        try {
            Files.createSymbolicLink(link, outside.resolve("secrets.py"));
        } catch (UnsupportedOperationException | IOException cannotLink) {
            // Windows needs privileges for this. The check still runs on CI.
            return;
        }
        // Nothing about the name is suspicious. Only following it reveals that
        // it leaves the directory, which is why the check is not textual.
        assertNull(PyCommand.resolveScript(scripts, "innocent"),
                "a link out of the scripts directory must not resolve");
    }

    @Test
    @DisplayName("a symlink staying inside the directory is fine")
    void symlinkWithinIsAllowed() throws IOException {
        Path link = scripts.resolve("alias.py");
        try {
            Files.createSymbolicLink(link, scripts.resolve("hello.py"));
        } catch (UnsupportedOperationException | IOException cannotLink) {
            return;
        }
        assertNotNull(PyCommand.resolveScript(scripts, "alias"),
                "a link within the directory is not an escape");
    }

    @Test
    @DisplayName("a missing scripts directory is refused, not created implicitly")
    void missingDirectoryIsRefused() {
        assertNull(PyCommand.resolveScript(root.resolve("nope"), "hello"));
    }

    // ── listing ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("listing shows every script, sorted, without the extension")
    void listingIsSortedAndStripped() {
        List<String> found = PyCommand.listScripts(scripts);
        assertEquals(List.of("build_tower", "hello"), found);
    }

    @Test
    @DisplayName("listing ignores anything that is not a .py")
    void listingIgnoresOtherFiles() throws IOException {
        Files.write(scripts.resolve("notes.txt"), List.of("x"));
        Files.write(scripts.resolve("data.json"), List.of("{}"));
        assertEquals(List.of("build_tower", "hello"), PyCommand.listScripts(scripts));
    }

    @Test
    @DisplayName("listing a directory that is not there is empty rather than an error")
    void listingMissingDirectory() {
        assertTrue(PyCommand.listScripts(root.resolve("nope")).isEmpty());
    }
}
