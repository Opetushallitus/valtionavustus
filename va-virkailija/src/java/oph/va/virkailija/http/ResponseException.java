package oph.va.virkailija.http;

public class ResponseException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public final int statusCode;
    public final String method;
    public final String uri;
    public final String body;

    public ResponseException(int statusCode, String method, String uri, String body) {
        this.statusCode = statusCode;
        this.method = method;
        this.uri = uri;
        this.body = body;
    }

    @Override
    public String getMessage() {
        return String.format(
                "%s for %s %s\n----\n%s\n----",
                statusCode,
                method,
                uri,
                body);
    }
}
