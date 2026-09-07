package fruitjuice.cmd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;

import fruitjuice.RemoteSession;
import java.util.concurrent.LinkedBlockingQueue;
import org.bukkit.event.entity.ProjectileHitEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * events.clear must clear every queue, not most of them.
 *
 * It used to empty the block-hit and chat queues and leave the arrow-hit queue
 * alone. A script that cleared events before starting a round then got arrows
 * fired before it began, which reads as a bug in the script rather than in the
 * server -- the sort of thing a child gives up on rather than reports.
 */
class CmdEventTest {

    private RemoteSession session;

    private long repliesSent() {
        return mockingDetails(session).getInvocations().stream()
                .filter(i -> i.getMethod().getName().equals("send"))
                .count();
    }

    @BeforeEach
    void setUp() {
        session = mock(RemoteSession.class);
        // The queues are public fields, and a mock leaves fields null.
        session.interactEventQueue = new LinkedBlockingQueue<>(RemoteSession.MAX_EVENT_QUEUE);
        session.chatPostedQueue = new LinkedBlockingQueue<>(RemoteSession.MAX_EVENT_QUEUE);
        session.arrowHitEventQueue = new LinkedBlockingQueue<>(RemoteSession.MAX_EVENT_QUEUE);

        // The unsupported-command branch logs through session.plugin.
        session.plugin = mock(fruitjuice.FruitJuicePlugin.class);
        org.mockito.Mockito.when(session.plugin.getLogger())
                .thenReturn(java.util.logging.Logger.getLogger("test"));

        session.interactEventQueue.add(mock(PlayerInteractEvent.class));
        session.chatPostedQueue.add(mock(AsyncPlayerChatEvent.class));
        session.arrowHitEventQueue.add(mock(ProjectileHitEvent.class));
    }

    @Test
    @DisplayName("clear empties all three queues, arrows included")
    void clearEmptiesEveryQueue() {
        new CmdEvent(session).execute("clear", new String[] {""});

        assertTrue(session.interactEventQueue.isEmpty(), "block hits were left behind");
        assertTrue(session.chatPostedQueue.isEmpty(), "chat was left behind");
        assertTrue(session.arrowHitEventQueue.isEmpty(),
                "arrow hits were left behind -- this was the bug");
    }

    @Test
    @DisplayName("clear says nothing, so it does not desync the session")
    void clearIsSilent() {
        new CmdEvent(session).execute("clear", new String[] {""});
        assertEquals(0, repliesSent());
    }

    @Test
    @DisplayName("an unsupported events command is reported once rather than ignored")
    void unsupportedCommandAnswersOnce() {
        new CmdEvent(session).execute("noSuchCommand", new String[] {""});
        assertEquals(1, repliesSent());
    }
}
