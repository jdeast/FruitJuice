package fruitjuice.cmd;

import fruitjuice.FruitJuicePlugin;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

/**
 * /py &lt;script&gt; -- run one of the server's Python scripts from in-game.
 *
 * Borrowed from Raspberry Jam Mod, which has had this for years, and kept to
 * the same shape deliberately: it runs a NAMED script from a configured
 * directory. It does not evaluate code typed into chat.
 *
 * That distinction is the whole security design, and it is worth being explicit
 * about why. Being op in Minecraft already means near-total control of the
 * world, so "ops can run scripts" sounds like no escalation at all. But op does
 * not normally grant code execution on the host, and a /py that evaluated
 * arbitrary text would convert every op into a shell account on the machine the
 * server runs on. A directory of scripts somebody deliberately put there keeps
 * what makes this useful in a classroom -- a teacher starting a build without
 * leaving the game -- without that step.
 *
 * So, in order:
 *
 *   - Off unless python.enabled is set. Running processes is a decision, not a
 *     default.
 *   - Op only, via fruitjuice.py, which defaults to op.
 *   - The script must resolve inside the configured directory, checked after
 *     following symlinks rather than by rejecting ".." in the name. A link
 *     inside the directory pointing out of it is the case a textual check
 *     misses.
 *   - Started with an argument list, never a shell string, so a script name can
 *     never become shell syntax.
 *   - Killed after a timeout, so a script that waits forever does not leave a
 *     process behind every time somebody runs it.
 *
 * The script itself is ordinary Python using pyncraft; it connects back over
 * the same TCP port as any other client. The host, port and the name of the
 * player who ran it arrive in the environment, so a script does not have to
 * hardcode any of them.
 */
public class PyCommand implements CommandExecutor, TabCompleter {

    private final FruitJuicePlugin plugin;

    public PyCommand(FruitJuicePlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * Where a script name resolves to, or null if it escapes the directory.
     *
     * Static and package-visible so the containment rule can be tested without
     * a server. This is the part that has to be right.
     */
    static Path resolveScript(Path scriptsDir, String name) {
        if (name == null || name.isEmpty()) return null;

        // Reject the obvious before touching the filesystem. Not sufficient on
        // its own -- the real check is the containment test below -- but it
        // keeps unhelpful names out of the error messages.
        if (name.contains("/") || name.contains("\\") || name.contains("\0")) return null;
        if (name.equals(".") || name.equals("..")) return null;

        String fileName = name.endsWith(".py") ? name : name + ".py";

        try {
            Path dir = scriptsDir.toRealPath();
            Path candidate = dir.resolve(fileName);
            if (!Files.isRegularFile(candidate)) return null;

            // After following links. A symlink inside the directory pointing
            // somewhere else entirely passes every textual check there is.
            Path real = candidate.toRealPath();
            if (!real.startsWith(dir)) return null;
            return real;
        } catch (IOException cannotResolve) {
            return null;
        }
    }

    /** The scripts available to run, sorted, without the .py. */
    static List<String> listScripts(Path scriptsDir) {
        try (Stream<Path> files = Files.list(scriptsDir)) {
            return files.filter(Files::isRegularFile)
                    .map(p -> p.getFileName().toString())
                    .filter(n -> n.endsWith(".py"))
                    .map(n -> n.substring(0, n.length() - 3))
                    .sorted()
                    .collect(Collectors.toList());
        } catch (IOException noDirectory) {
            return Collections.emptyList();
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!plugin.getConfig().getBoolean("python.enabled", false)) {
            sender.sendMessage(ChatColor.RED + "/py is disabled. Set python.enabled to true "
                    + "in FruitJuice's config.yml to turn it on.");
            return true;
        }

        Path scriptsDir = plugin.getScriptsDirectory();

        if (args.length == 0) {
            List<String> scripts = listScripts(scriptsDir);
            if (scripts.isEmpty()) {
                sender.sendMessage(ChatColor.YELLOW + "No scripts in " + scriptsDir);
            } else {
                sender.sendMessage(ChatColor.GREEN + "Scripts: " + String.join(", ", scripts));
            }
            sender.sendMessage(ChatColor.GRAY + "Usage: /" + label + " <script> [arguments]");
            return true;
        }

        Path script = resolveScript(scriptsDir, args[0]);
        if (script == null) {
            // Deliberately the same message whether the name escaped the
            // directory or simply is not there. Distinguishing them would
            // report whether a path outside the directory exists.
            sender.sendMessage(ChatColor.RED + "No script called " + args[0]
                    + ". Try /" + label + " on its own to see what there is.");
            return true;
        }

        run(sender, script, args);
        return true;
    }

    private void run(CommandSender sender, Path script, String[] args) {
        String python = plugin.getConfig().getString("python.command", "python3");
        int timeout = plugin.getConfig().getInt("python.timeout", 60);
        String playerName = (sender instanceof Player) ? sender.getName() : "";
        String senderName = sender.getName();

        List<String> commandLine = new ArrayList<>();
        commandLine.add(python);
        commandLine.add(script.toString());
        // Everything after the script name goes to the script untouched.
        commandLine.addAll(java.util.Arrays.asList(args).subList(1, args.length));

        sender.sendMessage(ChatColor.GREEN + "Running " + script.getFileName().toString() + "...");

        // Off the server thread. A script that builds a town would otherwise
        // freeze the game for everybody until it finished.
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            Process process = null;
            try {
                ProcessBuilder builder = new ProcessBuilder(commandLine);
                builder.directory(script.getParent().toFile());
                builder.redirectErrorStream(true);

                // So a script does not have to hardcode where the server is, or
                // guess who ran it.
                builder.environment().put("PYNCRAFT_HOST", "localhost");
                builder.environment().put("PYNCRAFT_PORT",
                        String.valueOf(plugin.getConfig().getInt("port", 4711)));
                builder.environment().put("PYNCRAFT_PLAYER", playerName);

                process = builder.start();

                List<String> output = new ArrayList<>();
                try (BufferedReader out = new BufferedReader(new InputStreamReader(
                        process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    // Bounded: a script printing in a loop must not fill the
                    // server's heap through a chat relay.
                    while ((line = out.readLine()) != null && output.size() < 200) {
                        output.add(line);
                    }
                }

                boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    tell(sender, ChatColor.RED + script.getFileName().toString()
                            + " ran longer than " + timeout + "s and was stopped.");
                    return;
                }

                int exit = process.exitValue();
                for (String line : output) {
                    tell(sender, ChatColor.GRAY + line);
                }
                if (exit == 0) {
                    tell(sender, ChatColor.GREEN + script.getFileName().toString() + " finished.");
                } else {
                    tell(sender, ChatColor.RED + script.getFileName().toString()
                            + " exited with status " + exit + ".");
                }
            } catch (IOException e) {
                tell(sender, ChatColor.RED + "Could not run " + script.getFileName().toString()
                        + ": " + e.getMessage());
                plugin.getLogger().warning("/py " + script + " failed: " + e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                if (process != null) process.destroyForcibly();
            }
        });

        plugin.getLogger().info(senderName + " ran " + script);
    }

    /** Messages go back on the server thread; Bukkit is not thread-safe. */
    private void tell(CommandSender sender, String message) {
        plugin.getServer().getScheduler().runTask(plugin, () -> sender.sendMessage(message));
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command,
                                      String alias, String[] args) {
        if (args.length != 1 || !plugin.getConfig().getBoolean("python.enabled", false)) {
            return Collections.emptyList();
        }
        String prefix = args[0].toLowerCase();
        return listScripts(plugin.getScriptsDirectory()).stream()
                .filter(s -> s.toLowerCase().startsWith(prefix))
                .collect(Collectors.toList());
    }
}
