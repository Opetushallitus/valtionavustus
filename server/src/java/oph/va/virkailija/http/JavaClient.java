package oph.va.virkailija.http;

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
import org.http4s.*;
import org.http4s.dsl.io.*;
import org.http4s.Uri;
import org.http4s.client.Client;
import org.http4s.headers.Accept$;
import org.http4s.package$;
import org.http4s.util.Renderable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import scala.Option;
import scala.collection.JavaConversions;
import scala.runtime.AbstractFunction1;
import scala.runtime.AbstractPartialFunction;
import scala.util.control.NonFatal$;
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
          HttpService.lift(new AbstractFunction1<Request, Task<Request>>() {
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
            public Task<String> apply(final Response response) {
                return response.as(EntityDecoder$.MODULE$.text(Charset.UTF$minus8())).flatMap(new AbstractFunction1<String, Task<String>>() {
                    public Task<String> apply(String body) {
                        ResponseException responseException = checkSuccessfulResponse(request, response, body);

                        if (responseException == null) {
                            //responseException = checkResponseContentType(request, response, body);
                        }

                        if (responseException != null) {
                            Task tmp = Task.fail(responseException);
                            @SuppressWarnings("unchecked")
                            Task<String> ret = tmp;
                            return ret;
                        }

                        return Task.now(body);
                    }
                });
            }
        }).handleWith(new AbstractPartialFunction<Throwable, Task<String>>() {
            @Override
            public Task<String> apply(Throwable ex) {
                String msg = String.format("Failed requesting %s %s", request.method().name(), request.uri().toString());
                LOG.warn(msg, ex);
                Task tmp = Task.fail(new RuntimeException(msg, ex));
                @SuppressWarnings("unchecked")
                Task<String> ret = tmp;
                return ret;
            }

            public boolean isDefinedAt(Throwable ex) {
                return NonFatal$.MODULE$.apply(ex) && !(ex instanceof ResponseException);
            }
        });
    }

    private static Request newRequest(Method method, Uri uri, Headers headers) {
        return Request.apply(
                method,
                uri,
                HttpVersion$.MODULE$.HTTP$div1$u002E1(),
                headers,
                package$.MODULE$.EmptyBody());
    }

    private static Headers newHeaders(Map<String, String> clientHeaders) {
        Set<Header> headers = new LinkedHashSet<>();

        for (Map.Entry<String, String> entry : clientHeaders.entrySet()) {
            headers.add(Header$.MODULE$.apply(entry.getKey(), entry.getValue()));
        }

        headers.add(Header$.MODULE$.apply("clientSubSystemCode", CLIENT_SUBSYSTEM_CODE));

        return Headers.apply(JavaConversions.asScalaSet(headers).toSeq());
    }

    private static ResponseException checkSuccessfulResponse(Request request, Response response, String body) {
        if (!response.status().isSuccess()) {
            String reason = "Unsuccessful status code";
            LOG.warn("{}: {} for {} {}\n----\n{}\n----",
                    reason,
                    response.status().code(),
                    request.method().name(),
                    request.uri().toString(),
                    body);
            return new ResponseException(
                    reason,
                    response.status().code(),
                    request.method().name(),
                    request.uri().toString(),
                    body);
        }

        return null;
    }

   /* private static ResponseException checkResponseContentType(Request request, Response response, String body) {
        Option tmpRequestAcceptHeader = request.headers().get(Accept$.MODULE$);
        @SuppressWarnings("unchecked")
        Option<Header.Recurring> requestAcceptHeader = (Option<Header.Recurring>) tmpRequestAcceptHeader;

        if (requestAcceptHeader.isDefined() && response.contentType().isDefined()) {
            NonEmptyList<String> acceptContentTypes = requestAcceptHeader.get().values().map(new AbstractFunction1<Object, String>() {
                public String apply(Object renderable) {
                    return ((Renderable) renderable).renderString().toLowerCase();
                }
            });

            String actualContentType = response.contentType().get().mediaType().renderString().toLowerCase();

            if (!acceptContentTypes.contains(actualContentType)) {
                String reason = String.format("Unexpected Content-Type: %s (accepting %s)",
                        actualContentType,
                        acceptContentTypes.mkString(", "));
                LOG.warn("{} for {} {}\n----\n{}\n----",
                        reason,
                        request.method().name(),
                        request.uri().toString(),
                        body);
                return new ResponseException(
                        reason,
                        response.status().code(),
                        request.method().name(),
                        request.uri().toString(),
                        body);
            }
        }

        return null;
    }*/
}
