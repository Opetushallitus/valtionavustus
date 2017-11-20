package oph.va.virkailija.http;

import fi.vm.sade.utils.cas.CasAuthenticatingClient;
import fi.vm.sade.utils.cas.CasClient;
import fi.vm.sade.utils.cas.CasParams;
import org.http4s.client.Client;
import scala.Some;

import static oph.va.virkailija.http.Common.CLIENT_SUBSYSTEM_CODE;

public class CasClients {
    public static Client newCasAuthenticatingClient(String serviceUrl,
                                                    String username,
                                                    String password,
                                                    CasClient casClient,
                                                    Client serviceClient) {
        return newCasAuthenticatingClient(CasParams.apply(serviceUrl, username, password), casClient, serviceClient);
    }

    public static Client newCasAuthenticatingClient(CasParams casParams,
                                                    CasClient casClient,
                                                    Client serviceClient) {
        return CasAuthenticatingClient.apply(
                casClient,
                casParams,
                serviceClient,
                Some.apply(CLIENT_SUBSYSTEM_CODE),
                "JSESSIONID");
    }

    private CasClients() {}  // hide
}
