package oph.va.virkailija.cas;

import org.http4s.client.Client;
import org.http4s.client.blaze.BlazeClientConfig;
import org.http4s.client.blaze.SimpleHttp1Client;
import scala.concurrent.duration.Duration;

import java.util.concurrent.TimeUnit;

public class BlazeClients {
    public static BlazeClientConfig newClientConfig() {
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
                defaultConfig.customExecutor(),
                defaultConfig.group());
    }

    public static Client newSimpleClient(BlazeClientConfig config) {
        return SimpleHttp1Client.apply(config);
    }

    public static Client newSimpleClient() {
        return SimpleHttp1Client.apply(newClientConfig());
    }
}
