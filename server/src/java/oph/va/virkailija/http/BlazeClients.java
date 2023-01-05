package oph.va.virkailija.http;

import org.http4s.client.Client;
import org.http4s.blaze.client.BlazeClientBuilder;
import scala.Some;
import scala.concurrent.duration.Duration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

public class BlazeClients {

    public static Client newPooledClient(int maxTotalConnections) {
        return BlazeClientBuilder
              .withMaxTotalConnections(maxTotalConnections)
              .resource;
    }

    public static Client newPooledClient(int maxTotalConnections, int numThreads) {
        return newPooledClient(maxTotalConnections);
    }

    private BlazeClients() {}  // hide
}
