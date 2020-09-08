package oph.va.virkailija.http;

import fi.vm.sade.utils.cas.CasAuthenticatingClient;
import fi.vm.sade.utils.cas.CasClient;
import fi.vm.sade.utils.cas.CasParams;
import org.http4s.client.Client;
import scala.Some;

public class CasClients {
    public static Client newCasAuthenticatingClient(String serviceUrl,
                                                    String username,
                                                    String password,
                                                    CasClient casClient,
                                                    Client serviceClient,
                                                    String callerId) {
        return newCasAuthenticatingClient(CasParams.apply(serviceUrl, username, password), casClient, serviceClient, callerId);
    }

    public static Client newCasAuthenticatingClient(CasParams casParams,
                                                    CasClient casClient,
                                                    Client serviceClient,
                                                    String callerId) {
        return CasAuthenticatingClient.apply(
                casClient,
                casParams,
                serviceClient,
                callerId,
                "JSESSIONID");
    }

    private CasClients() {}  // hide
}
