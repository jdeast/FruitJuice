package fruitjuice;

/**
 * One line of the wire protocol, parsed.
 *
 * A line is <code>namespace.command(arg,arg,...)</code> followed by a newline.
 * Splitting this out of RemoteSession is what makes it testable without a
 * running server, and it is where the protocol's rules actually live:
 *
 * <ul>
 *   <li>Arguments are separated by commas and nothing escapes them, so an
 *       argument cannot itself contain one. Commands that carry free text
 *       (chat.post, setSign) rejoin the pieces with commas to recover the
 *       original string.</li>
 *   <li>A call with no arguments parses to a single empty string rather than
 *       an empty array, because that is what String.split does. Callers get an
 *       empty array from here instead, which is what they meant.</li>
 * </ul>
 */
public final class CommandLine {

    public final String name;

    public final String[] args;

    private CommandLine(String name, String[] args) {
        this.name = name;
        this.args = args;
    }

    /**
     * Parse a protocol line, or return null if it is not one.
     *
     * Returning null rather than throwing matters: this used to be an unguarded
     * substring() inside the tick loop, so any line without a bracket -- a port
     * scanner, a stray newline -- threw before the caller could answer, and the
     * client waited forever for a reply that was never sent.
     */
    public static CommandLine parse(String line) {
        if (line == null) return null;
        String trimmed = line.trim();
        if (trimmed.isEmpty()) return null;

        int open = trimmed.indexOf('(');
        if (open <= 0 || !trimmed.endsWith(")")) return null;

        String name = trimmed.substring(0, open);
        String body = trimmed.substring(open + 1, trimmed.length() - 1);
        return new CommandLine(name, body.isEmpty() ? new String[0] : body.split(",", -1));
    }

    /** The namespace, e.g. "world" for "world.setBlock". */
    public String namespace() {
        int dot = name.indexOf('.');
        return dot < 0 ? name : name.substring(0, dot);
    }

    /** Everything after the first dot, e.g. "setBlock", or "block.hits". */
    public String command() {
        int dot = name.indexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1);
    }

    /**
     * The arguments put back together as they arrived.
     *
     * For commands carrying free text. Joining with a space instead used to turn
     * "Hello, world!" into "Hello  world!" and made it impossible to send a
     * comma at all.
     */
    public String rawArguments() {
        return String.join(",", args);
    }
}
