# Valtionavustuksien palvelimet

Kaikki tässä kuvatut komennot tulee ajaa samassa hakemistossa, jossa
tämä README on.

| Palvelin | web UI | Kuvaus |
|---|---|---|
| oph-va-lb-prod01 | | Kuormantasaaja, yhteinen palvelun testi- ja tuotantoympäristöille. |
| oph-va-ci-test01 | [Jenkins](https://dev.valtionavustukset.oph.fi/) | CI. |
| oph-va-app-test01 | [va-hakija](https://testi.valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://testi.valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://testi.virkailija.valtionavustukset.oph.fi/doc/) | Palvelun testiympäristö, ajaa sovelluksia ja tietokantaa. |
| oph-va-app-prod01 | [va-hakija](https://valtionavustukset.oph.fi/avustushaku/1/), [va-hakija api](https://valtionavustukset.oph.fi/doc), [va-virkailija](https://testi.virkailija.valtionavustukset.oph.fi/), [va-virkailija api](https://virkailija.valtionavustukset.oph.fi/doc/), [avoimet avustushaut](http://oph.fi/rahoitus/valtionavustukset) | Palvelun tuotantoympäristö, ajaa sovelluksia ja tietokantaa. |

## Palvelinten provisiointi

Repon juuresta löytyy seuraavat skriptit palvelinten provisiointiin:

``` bash
./run-ansible-jenkins.sh
./run-ansible-qa.sh
./run-ansible-prod.sh
./run-ansible-loadblanacer.sh
```

## Yhteyden testaaminen palvelimille

Repon juuressa `ssh.sh` scripti.
``` bash
./ssh.sh qa
```

### Lue palvelimen lokeja

``` bash
cd /logs/valtionavustus/
```

### Sovelluksien hallinta

Tarkista tila:

``` bash
sudo supervisorctl status
```

```
va                        RUNNING   pid 924, uptime 0:23:43
```

va:n uudelleenkäynnistys:

``` bash
sudo supervisorctl restart va
```

### Thread dump

Thread dump webappin stdoutiin, joka ohjautuu lokiin:

``` bash
ps -fe | grep java  # etsi sovelluksen pid
sudo kill -3 924    # pyydä prosessilta thread dump
less +F /logs/valtionavustus/va-hakija_run.log
```

### psql-yhteys palvelimelle

Repon juuressa `psql.sh` scripti.

```bash
./scripts/psql-qa.sh
```

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
