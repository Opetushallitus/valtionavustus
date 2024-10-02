# Valtionavustuksien palvelimet


| Palvelin | web UI | Kuvaus |
|---|---|---|
| oph-va-app-test01 | [va-hakija](https://testi.valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://testi.valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://testi.virkailija.valtionavustukset.oph.fi/doc/) | Palvelun testiympäristö, ajaa sovelluksia ja tietokantaa. |
| oph-va-app-prod01 | [va-hakija](https://valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://virkailija.valtionavustukset.oph.fi/doc/), [avoimet avustushaut](http://oph.fi/rahoitus/valtionavustukset) | Palvelun tuotantoympäristö, ajaa sovelluksia ja tietokantaa. |


# AWS configurointi

Lisää `~/.aws/config` tiedostoon seuraavat profiilit:

```
[profile oph-va-dev]
source_profile = oph-federation
role_arn = arn:aws:iam::744751949839:role/CustomerCloudAdmin
region = eu-west-1

[profile oph-va-qa]
source_profile = oph-federation
role_arn = arn:aws:iam::596991599170:role/CustomerCloudAdmin
region = eu-west-1

[profile oph-va-prod]
source_profile = oph-federation
role_arn = arn:aws:iam::250854697970:role/CustomerCloudAdmin
region = eu-west-1
```
