package oph.va.virkailija.http;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

public class DaemonThreadPool {
    public static ExecutorService newFixedPool(int numThreads, String namePrefix) {
        return Executors.newFixedThreadPool(numThreads, new DaemonThreadFactory(namePrefix));
    }

    private DaemonThreadPool() {}  // hide

    private static class DaemonThreadFactory implements ThreadFactory {
        private static final AtomicInteger poolNumber = new AtomicInteger(1);

        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final ThreadGroup group;
        private final String namePrefix;

        DaemonThreadFactory(String namePrefix) {
            this.group = Thread.currentThread().getThreadGroup();
            this.namePrefix = namePrefix + "-daemon_pool-" + poolNumber.getAndIncrement() + "-thread-";
        }

        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(
                    group,
                    runnable,
                    namePrefix + threadNumber.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }
}
