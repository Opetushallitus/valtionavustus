# Valtionavustuksien palvelimet


| Palvelin | web UI | Kuvaus |
|---|---|---|
| oph-va-app-test01 | [va-hakija](https://testi.valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://testi.valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://testi.virkailija.valtionavustukset.oph.fi/doc/) | Palvelun testiympäristö, ajaa sovelluksia ja tietokantaa. |
| oph-va-app-prod01 | [va-hakija](https://valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://virkailija.valtionavustukset.oph.fi/doc/), [avoimet avustushaut](http://oph.fi/rahoitus/valtionavustukset) | Palvelun tuotantoympäristö, ajaa sovelluksia ja tietokantaa. |


# AWS configurointi

Lisää `~/.aws/config` tiedostoon seuraavat profiilit:

```
[sso-session oph-federation]
sso_session=oph-federation
sso_region=eu-west-1
sso_start_url = https://oph-aws-sso.awsapps.com/start
sso_registration_scopes = sso:account:access

[profile oph-valtionavustukset-dev]
region = eu-west-1
sso_session = oph-federation
sso_account_id = 744751949839
sso_role_name = AdministratorAccess

[profile oph-valtionavustukset-qa]
region = eu-west-1
sso_session = oph-federation
sso_account_id = 596991599170
sso_role_name = AdministratorAccess

[profile oph-valtionavustukset-prod]
region = eu-west-1
sso_session = oph-federation
sso_account_id = 250854697970
sso_role_name = AdministratorAccess
```
