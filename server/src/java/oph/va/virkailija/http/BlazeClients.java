package oph.va.virkailija.http;

import org.http4s.client.Client;
import org.http4s.client.blaze.BlazeClientConfig;
import org.http4s.client.blaze.PooledHttp1Client;
import scala.Some;
import scala.concurrent.duration.Duration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

public class BlazeClients {
    public static BlazeClientConfig newClientConfig(ExecutorService executorService) {
        BlazeClientConfig defaultConfig = BlazeClientConfig.defaultConfig();
        return BlazeClientConfig.apply(
                Duration.apply(30, TimeUnit.SECONDS),
                Duration.apply(60, TimeUnit.SECONDS),
                Duration.apply(120, TimeUnit.SECONDS),
                defaultConfig.userAgent(),

                defaultConfig.sslContext(),
                defaultConfig.checkEndpointIdentification(),

                defaultConfig.maxResponseLineSize(),
                defaultConfig.maxHeaderLength(),
                defaultConfig.maxChunkSize(),
                defaultConfig.lenientParser(),

                defaultConfig.bufferSize(),
                Some.apply(executorService),
                defaultConfig.group());
    }

    public static Client newPooledClient(int maxTotalConnections, BlazeClientConfig config) {
        return PooledHttp1Client.apply(maxTotalConnections, config);
    }

    public static Client newPooledClient(int maxTotalConnections, int numThreads) {
        return newPooledClient(
                maxTotalConnections,
                newClientConfig(DaemonThreadPool.newFixedPool(numThreads, "http4s-blaze")));
    }

    private BlazeClients() {}  // hide
}
