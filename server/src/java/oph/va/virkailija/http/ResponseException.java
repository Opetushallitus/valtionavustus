package oph.va.virkailija.http;

public class ResponseException extends RuntimeException {
    private static final long serialVersionUID = 2L;

    public final String reason;
    public final int statusCode;
    public final String method;
    public final String uri;
    public final String body;

    public ResponseException(String reason, int statusCode, String method, String uri, String body) {
        this.reason = reason;
        this.statusCode = statusCode;
        this.method = method;
        this.uri = uri;
        this.body = body;
    }

    @Override
    public String getMessage() {
        return String.format(
                "%s: status code %d for %s %s\n----\n%s\n----",
                reason,
                statusCode,
                method,
                uri,
                body);
    }
}
