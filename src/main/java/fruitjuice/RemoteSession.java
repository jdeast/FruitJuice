package fruitjuice;

import fruitjuice.cmd.CmdEntity;
import fruitjuice.cmd.CmdEvent;
import fruitjuice.cmd.CmdPlayer;
import fruitjuice.cmd.CmdWorld;

import org.bukkit.*;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.ProjectileHitEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerInteractEvent;

import java.io.*;
import java.net.Socket;
import java.util.Queue;
import java.util.concurrent.LinkedBlockingQueue;

public class RemoteSession {

    private final LocationType locationType;

    private Location origin;

    private Socket socket;

    private BufferedReader in;

    private BufferedWriter out;

    private Thread inThread;

    private Thread outThread;

    // Concurrent, not ArrayDeque. inQueue is written by the socket thread and
    // drained by the main server thread; outQueue is the reverse. Neither was
    // synchronised on both sides, and ArrayDeque is not thread-safe.
    private Queue<String> inQueue = new LinkedBlockingQueue<String>();

    private Queue<String> outQueue = new LinkedBlockingQueue<String>();

    public boolean running = true;

    public boolean pendingRemoval = false;

    public FruitJuicePlugin plugin;

    // Bounded, and concurrent because chat events arrive on an async thread.
    // A client that never polls -- scratch never polls chat or arrows -- used to
    // accumulate events for the whole life of the connection.
    public static final int MAX_EVENT_QUEUE = 1000;

    public Queue<PlayerInteractEvent> interactEventQueue = new LinkedBlockingQueue<PlayerInteractEvent>(MAX_EVENT_QUEUE);

    public Queue<ProjectileHitEvent> arrowHitEventQueue = new LinkedBlockingQueue<ProjectileHitEvent>(MAX_EVENT_QUEUE);

    public Queue<AsyncPlayerChatEvent> chatPostedQueue = new LinkedBlockingQueue<AsyncPlayerChatEvent>(MAX_EVENT_QUEUE);

    private int maxCommandsPerTick = 9000;

    private boolean closed = false;


    private CmdEntity cmdEntity;
    private CmdEvent cmdEvent;
    private CmdPlayer cmdPlayer;
    private CmdWorld cmdWorld;

    public RemoteSession(FruitJuicePlugin plugin, Socket socket) throws IOException {
        this.socket = socket;
        this.plugin = plugin;
        this.locationType = plugin.getLocationType();
        init();
        createCmdObject();
    }

    public void init() throws IOException {
        socket.setTcpNoDelay(true);
        socket.setKeepAlive(true);
        socket.setTrafficClass(0x10);
        this.in = new BufferedReader(new InputStreamReader(socket.getInputStream(), "utf-8"));
        this.out = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), "utf-8"));
        startThreads();
        plugin.getLogger().info("Opened connection to" + socket.getRemoteSocketAddress() + ".");
    }

    public void createCmdObject(){
        cmdEntity = new CmdEntity(this);
        cmdEvent = new CmdEvent(this);
        cmdPlayer = new CmdPlayer(this, plugin);
        cmdWorld = new CmdWorld(this);

    }

    protected void startThreads() {
        inThread = new Thread(new InputThread());
        inThread.start();
        outThread = new Thread(new OutputThread());
        outThread.start();
    }


    public Location getOrigin() {
        return origin;
    }

    public void setOrigin(Location origin) {
        this.origin = origin;
    }

    public Socket getSocket() {
        return socket;
    }

    // Drops the oldest event when the queue is full rather than throwing or
    // growing forever. offer() returns false on a full bounded queue.
    //
    // Static and package-visible so the bounding can be tested directly. A
    // RemoteSession needs a live socket to construct, and none of that is
    // relevant to "what happens when the queue fills up".
    static <T> void queueEvent(Queue<T> queue, T event) {
        while (!queue.offer(event)) {
            if (queue.poll() == null) return;
        }
    }

    public void queuePlayerInteractEvent(PlayerInteractEvent event) {
        queueEvent(interactEventQueue, event);
    }

    public void queueChatPostedEvent(AsyncPlayerChatEvent event) {
        queueEvent(chatPostedQueue, event);
    }

    public void queueArrowHitEvent(ProjectileHitEvent event){
        queueEvent(arrowHitEventQueue, event);
    }

    /**
     * Point this session at a world.
     *
     * Every command resolves its coordinates against origin, so moving origin
     * into another world is all it takes to build somewhere else. Which point
     * of that world becomes the origin depends on the location setting, the
     * same as it does when a session first starts.
     */
    public void useWorld(World world) {
        switch (locationType) {
            case ABSOLUTE:
                this.origin = new Location(world, 0, 0, 0);
                break;
            case RELATIVE:
                this.origin = world.getSpawnLocation();
                break;
            default:
                throw new IllegalArgumentException("Unknown location type " + locationType);
        }
    }

    /**
     * called from the server main thread
     */
    public void tick() {
        if (origin == null) {
            // The first world is where a session starts, which for a server
            // built for this is the one people play in. world.setWorld moves it.
            useWorld(plugin.getServer().getWorlds().get(0));
        }
        int processedCount = 0;
        String message;
        while ((message = inQueue.poll()) != null) {
            handleLine(message.trim());
//            handleLine(message);
            processedCount++;
            if (processedCount >= maxCommandsPerTick) {
                plugin.getLogger().warning("Over " + maxCommandsPerTick +
                        " commands were queued - deferring " + inQueue.size() + " to next tick");
                break;
            }
        }

        if (!running && inQueue.size() <= 0) {
            pendingRemoval = true;
        }
    }

    protected void handleLine(String line) {
        // FINE, not INFO. This runs for every single command on the main server
        // thread, so a build of a few hundred thousand blocks wrote a few hundred
        // thousand lines to the log, and on a Pi that is SD card I/O in the
        // critical path. Raise the level in server logging config to see them.
        plugin.getLogger().fine(line);

        if (line.isEmpty()) return;

        CommandLine parsed = CommandLine.parse(line);
        if (parsed == null) {
            plugin.getLogger().warning("Ignoring malformed command: " + line);
            send("Fail,Malformed command. Expected name(arguments), got: " + line);
            return;
        }

        handleCommand(parsed.name, parsed.args);
    }

    protected void handleCommand(String c, String[] args) {


        try {
            // get the server
            Server server = plugin.getServer();

            // get the world
            World world = origin.getWorld();

            // split command
            String[] cmd = c.split("[.]", 2);

            //System.out.println(cmd);
            //plugin.getLogger().info(c);

            if (cmd[0].equals("player")) {
                cmdPlayer.execute(cmd[1], args);

            } else if (cmd[0].equals("entity")) {
                cmdEntity.execute(cmd[1], args);

            } else if (cmd[0].equals("world")) {
//                new CmdWorld(this).execute(world, cmd[1], args);
                cmdWorld.execute(world, cmd[1], args);

            } else if (cmd[0].equals("events")) {
                cmdEvent.execute(cmd[1], args);

                // chat.post
            } else if (c.equals("chat.post")) {
                // handleLine split the line on commas, so rejoin with commas to get
                // the message back exactly. Joining with a space used to turn
                // "Hello, world!" into "Hello  world!" and made it impossible to
                // put a comma in chat at all.
                String chatMessage = String.join(",", args);   // see CommandLine.rawArguments
                server.broadcastMessage(chatMessage);

                // not a command which is supported
            } else {
                plugin.getLogger().warning(c + " is not supported.");
                send("Fail," + c + " is not supported.");
            }
        } catch (Exception e) {

            plugin.getLogger().warning("Error handling " + c + ": " + e);
            e.printStackTrace();
            // Tell the CALLER what went wrong, not just the console.
            //
            // This used to reply "Please check out minecraft server console",
            // which is useless to the person who caused it: a child in Scratch
            // cannot see the console, and the reply is the only thing that
            // reaches them. Every mistake -- a misspelled block, a letter typed
            // where a number goes, a facing that is not a direction -- arrived
            // as the same sentence.
            //
            // The exception's own message names the thing that was wrong. Class
            // name too, because NumberFormatException's message is
            // 'For input string: "abc"' and needs the context.
            send("Fail," + c + ": " + describe(e));

        }
    }

    /**
     * A short, single-line description of a failure, safe to send to a client.
     *
     * Single line because the protocol is line-based: a newline in here would
     * be read as the end of the reply and the rest as an answer to whatever was
     * asked next.
     */
    static String describe(Throwable e) {
        String message = e.getMessage();
        String name = e.getClass().getSimpleName();
        String text;
        if (message == null || message.isEmpty()) {
            text = name;
        } else if (e instanceof IllegalArgumentException || e instanceof NumberFormatException) {
            // These already read as an explanation on their own.
            text = message;
        } else {
            text = name + ": " + message;
        }
        text = text.replace('\n', ' ').replace('\r', ' ');
        return text.length() > 200 ? text.substring(0, 197) + "..." : text;
    }

    /**
     * Floor a coordinate to a block coordinate.
     *
     * Floor, not a cast. Casting truncates toward zero, so -0.5 gave block 0
     * rather than block -1 and everything at a negative fractional coordinate
     * addressed the block next door.
     */
    public static int toBlockCoordinate(String coordinate) {
        return (int) Math.floor(Double.parseDouble(coordinate));
    }

    public Location parseRelativeBlockLocation(String xstr, String ystr, String zstr) {
        int x = toBlockCoordinate(xstr);
        int y = toBlockCoordinate(ystr);
        int z = toBlockCoordinate(zstr);
        return parseLocation(origin.getWorld(), x, y, z, origin.getBlockX(), origin.getBlockY(), origin.getBlockZ());
    }

    public Location parseRelativeLocation(String xstr, String ystr, String zstr) {
        double x = Double.parseDouble(xstr);
        double y = Double.parseDouble(ystr);
        double z = Double.parseDouble(zstr);
        return parseLocation(origin.getWorld(), x, y, z, origin.getX(), origin.getY(), origin.getZ());
    }

    public Location parseRelativeBlockLocation(String xstr, String ystr, String zstr, float pitch, float yaw) {
        Location loc = parseRelativeBlockLocation(xstr, ystr, zstr);
        loc.setPitch(pitch);
        loc.setYaw(yaw);
        return loc;
    }

    public Location parseRelativeLocation(String xstr, String ystr, String zstr, float pitch, float yaw) {
        Location loc = parseRelativeLocation(xstr, ystr, zstr);
        loc.setPitch(pitch);
        loc.setYaw(yaw);
        return loc;
    }

    public String blockLocationToRelative(Location loc) {
        return parseLocation(loc.getBlockX(), loc.getBlockY(), loc.getBlockZ(), origin.getBlockX(), origin.getBlockY(), origin.getBlockZ());
    }

    public String locationToRelative(Location loc) {
        return parseLocation(loc.getX(), loc.getY(), loc.getZ(), origin.getX(), origin.getY(), origin.getZ());
    }

    private String parseLocation(double x, double y, double z, double originX, double originY, double originZ) {
        return (x - originX) + "," + (y - originY) + "," + (z - originZ);
    }

    private Location parseLocation(World world, double x, double y, double z, double originX, double originY, double originZ) {
        return new Location(world, originX + x, originY + y, originZ + z);
    }

    private String parseLocation(int x, int y, int z, int originX, int originY, int originZ) {
        return (x - originX) + "," + (y - originY) + "," + (z - originZ);
    }

    private Location parseLocation(World world, int x, int y, int z, int originX, int originY, int originZ) {
        return new Location(world, originX + x, originY + y, originZ + z);
    }

    public void send(Object a) {
        send(a.toString());
    }

    public void send(String a) {
        if (pendingRemoval) return;
        outQueue.add(a);
    }

    public void close() {
        if (closed) return;
        running = false;
        pendingRemoval = true;

        // Whatever this session was holding loaded, let it go. Releasing when
        // an entity is removed instead would leak, because most spawned
        // entities are never explicitly removed.
        plugin.pinnedChunks().releaseAll(this);

        //wait for threads to stop
        try {
            inThread.join(2000);
            outThread.join(2000);
        } catch (InterruptedException e) {
            plugin.getLogger().warning("Failed to stop in/out thread");
            e.printStackTrace();
        }

        try {
            socket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        plugin.getLogger().info("Closed connection to" + socket.getRemoteSocketAddress() + ".");
    }

    public void kick(String reason) {
        try {
            out.write(reason);
            out.flush();
        } catch (Exception e) {
        }
        close();
    }

    /**
     * socket listening thread
     */
    private class InputThread implements Runnable {
        public void run() {
            plugin.getLogger().info("Starting input thread");
            while (running) {
                try {
                    String newLine = in.readLine();
                    //System.out.println(newLine);
                    if (newLine == null) {
                        running = false;
                    } else {
                        inQueue.add(newLine);
                        //System.out.println("Added to in queue");
                    }
                } catch (Exception e) {
                    // if its running raise an error
                    if (running) {
                        // constant first: getMessage() is null for plenty of
                        // exceptions, and an NPE raised in here killed the thread
                        // silently.
                        if ("Connection reset".equals(e.getMessage())) {
                            plugin.getLogger().info("Connection reset");
                        } else {
                            e.printStackTrace();
                        }
                        running = false;
                    }
                }
            }
            //close in buffer
            try {
                in.close();
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to close in buffer");
                e.printStackTrace();
            }
        }
    }

    private class OutputThread implements Runnable {
        public void run() {
            plugin.getLogger().info("Starting output thread!");
            while (running) {
                try {
                    String line;
                    while ((line = outQueue.poll()) != null) {
                        out.write(line);
                        out.write('\n');
                    }
                    out.flush();
                    Thread.yield();
                    Thread.sleep(1L);
                } catch (Exception e) {
                    // if its running raise an error
                    if (running) {
                        e.printStackTrace();
                        running = false;
                    }
                }
            }
            //close out buffer
            try {
                out.close();
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to close out buffer");
                e.printStackTrace();
            }
        }
    }

    /**
     * from CraftBukkit's org.bukkit.craftbukkit.block.CraftBlock.blockFactToNotch
     */
    public static int blockFaceToNotch(BlockFace face) {
        switch (face) {
            case DOWN:
                return 0;
            case UP:
                return 1;
            case NORTH:
                return 2;
            case SOUTH:
                return 3;
            case WEST:
                return 4;
            case EAST:
                return 5;
            default:
                return 7; // Good as anything here, but technically invalid
        }
    }

}
