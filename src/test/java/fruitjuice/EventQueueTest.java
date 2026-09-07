package fruitjuice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * What happens to events nobody is collecting.
 *
 * A script that registers for block hits and then stops calling
 * events.block.hits leaves the server queueing them forever. Unbounded, that is
 * a slow memory leak on a machine with 2GB of heap: the queue is the only thing
 * holding those event objects, and the players causing them have no idea.
 *
 * The queues are bounded and drop the OLDEST event when full, which is the
 * right end to drop -- the newest events are the ones a client that comes back
 * actually wants, and the stale ones describe a world that has moved on.
 */
class EventQueueTest {

    @Test
    @DisplayName("a queue with room just takes the event")
    void normalCaseIsAPlainAdd() {
        Queue<String> q = new LinkedBlockingQueue<>(10);
        RemoteSession.queueEvent(q, "one");
        RemoteSession.queueEvent(q, "two");
        assertEquals(2, q.size());
        assertEquals("one", q.poll());
        assertEquals("two", q.poll());
    }

    @Test
    @DisplayName("a full queue drops the oldest rather than growing or throwing")
    void fullQueueDropsTheOldest() {
        Queue<String> q = new LinkedBlockingQueue<>(3);
        for (int i = 1; i <= 5; i++) {
            RemoteSession.queueEvent(q, "event" + i);
        }

        // Never more than it was built to hold. add() would have thrown
        // IllegalStateException here and killed the thread that called it.
        assertEquals(3, q.size());

        // The three most recent, oldest first.
        assertEquals("event3", q.poll());
        assertEquals("event4", q.poll());
        assertEquals("event5", q.poll());
    }

    @Test
    @DisplayName("the real bound is a thousand, and holds under a flood")
    void theConfiguredBoundHolds() {
        Queue<Integer> q = new LinkedBlockingQueue<>(RemoteSession.MAX_EVENT_QUEUE);
        for (int i = 0; i < RemoteSession.MAX_EVENT_QUEUE * 3; i++) {
            RemoteSession.queueEvent(q, i);
        }
        assertEquals(RemoteSession.MAX_EVENT_QUEUE, q.size());
        // The oldest survivor is exactly one full queue back from the end.
        assertEquals(RemoteSession.MAX_EVENT_QUEUE * 2, q.peek());
    }

    @Test
    @DisplayName("a zero-capacity queue gives up instead of spinning forever")
    void aQueueThatCanNeverAcceptDoesNotHang() {
        // The drop-oldest loop is `while (!offer) { if (poll() == null) return; }`.
        // Without that inner guard, a queue that can never accept anything spins
        // forever holding the server thread -- so this is a deadlock test, and it
        // has to be timed rather than merely called.
        assertTimeoutPreemptively(Duration.ofSeconds(5), () -> {
            Queue<String> cannotHold = new LinkedBlockingQueue<>(1) {
                @Override
                public boolean offer(String e) {
                    return false;   // always refuses
                }
            };
            RemoteSession.queueEvent(cannotHold, "anything");
        });
    }

    @Test
    @DisplayName("events arriving from several threads at once are not lost or duplicated")
    void concurrentProducersAreSafe() throws Exception {
        // Bukkit events fire on the server thread, chat arrives asynchronously,
        // and the session's own reader is a third thread. The old ArrayDeque was
        // not safe across any of that: concurrent writes could corrupt it or
        // silently drop entries, which is what issue #6 was about.
        final int threads = 8;
        final int perThread = 250;
        Queue<Integer> q = new LinkedBlockingQueue<>(threads * perThread);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger next = new AtomicInteger();
        List<Thread> workers = new ArrayList<>();

        for (int t = 0; t < threads; t++) {
            Thread worker = new Thread(() -> {
                try {
                    start.await();
                    for (int i = 0; i < perThread; i++) {
                        RemoteSession.queueEvent(q, next.getAndIncrement());
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
            workers.add(worker);
            worker.start();
        }

        start.countDown();
        assertTrue(done.await(30, TimeUnit.SECONDS), "producers did not finish");
        for (Thread worker : workers) {
            worker.join();
        }

        assertEquals(threads * perThread, q.size(),
                "every event should be present exactly once");
        boolean[] seen = new boolean[threads * perThread];
        Integer value;
        while ((value = q.poll()) != null) {
            assertTrue(value >= 0 && value < seen.length, "unexpected value " + value);
            assertTrue(!seen[value], "value " + value + " appeared twice");
            seen[value] = true;
        }
    }
}
