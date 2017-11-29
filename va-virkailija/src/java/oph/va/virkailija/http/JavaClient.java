package oph.va.virkailija.http;

import org.http4s.AttributeMap;
import org.http4s.Charset;
import org.http4s.EntityDecoder$;
import org.http4s.Header;
import org.http4s.Header$;
import org.http4s.Headers;
import org.http4s.HttpVersion$;
import org.http4s.Method;
import org.http4s.Method$;
import org.http4s.Request;
import org.http4s.Response;
import org.http4s.Service;
import org.http4s.Uri;
import org.http4s.client.Client;
import org.http4s.package$;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import scala.collection.JavaConversions;
import scala.runtime.AbstractFunction1;
import scalaz.concurrent.Task;
import scalaz.concurrent.Task$;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import static oph.va.virkailija.http.Common.CLIENT_SUBSYSTEM_CODE;

/** Wraps {@link Client} to provide nicer interface for Java programs. */
public class JavaClient {
    private static final Logger LOG = LoggerFactory.getLogger(JavaClient.class);

    public static JavaClient newClient(Client client) {
        return new JavaClient(client);
    }

    private final Client client;

    private JavaClient(Client client) {
        this.client = new Client(
                Service.lift(new AbstractFunction1<Request, Task<Request>>() {
                    @Override
                    public Task<Request> apply(Request request) {
                        LOG.debug("-> {}", request);
                        return Task.now(request);
                    }
                }).andThen(client.open(), Task$.MODULE$.taskInstance()),
                client.shutdown()
        );
    }

    public Task<String> getAsString(String uri, Map<String, String> headers) {
        return expectAsString((Method) Method$.MODULE$.GET(), uri, headers);
    }

    private Task<String> expectAsString(Method method, String uri, Map<String, String> headers) {
        return expectAsString(newRequest(method, Uri.unsafeFromString(uri), newHeaders(headers)));
    }

    private Task<String> expectAsString(Request request) {
        // avoid {@code client.expect}, because it inserts Accept header based
        // on {@link EntityDecoder} in the request
        return client.fetch(request, new AbstractFunction1<Response, Task<String>>() {
            @Override
            public Task<String> apply(Response response) {
                Task<String> bodyText = response.as(EntityDecoder$.MODULE$.text(Charset.UTF$minus8()));

                if (response.status().isSuccess()) {
                    return bodyText;
                } else {
                    return bodyText.flatMap(new AbstractFunction1<String, Task<String>>() {
                        @Override
                        public Task<String> apply(String body) {
                            LOG.warn("Unsuccessful HTTP response status: {} for {} {}\n----\n{}\n----",
                                    response.status().code(),
                                    request.method().name(),
                                    request.uri().toString(),
                                    body);

                            Task tmp = Task.fail(new ResponseException(
                                    response.status().code(),
                                    request.method().name(),
                                    request.uri().toString(),
                                    body));
                            @SuppressWarnings("unchecked")
                            Task<String> ret = tmp;
                            return ret;
                        }
                    });
                }
            }
        });
    }

    private static Request newRequest(Method method, Uri uri, Headers headers) {
        return Request.apply(
                method,
                uri,
                HttpVersion$.MODULE$.HTTP$div1$u002E1(),
                headers,
                package$.MODULE$.EmptyBody(),
                AttributeMap.empty());
    }

    private static Headers newHeaders(Map<String, String> clientHeaders) {
        Set<Header> headers = new LinkedHashSet<>();

        for (Map.Entry<String, String> entry : clientHeaders.entrySet()) {
            headers.add(Header$.MODULE$.apply(entry.getKey(), entry.getValue()));
        }

        headers.add(Header$.MODULE$.apply("clientSubSystemCode", CLIENT_SUBSYSTEM_CODE));

        return Headers.apply(JavaConversions.asScalaSet(headers).toSeq());
    }
}
