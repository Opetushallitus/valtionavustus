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

Palvelimet ovat CSC:n VMware-ympäristössä. Palvelinten Ansible
inventoryn meta-tiedot on listattu staattisesti tiedostossa
`vmware_inventory.json`. Käyttö:

``` bash
./vmware_inventory.py
```

CSC:n palomuuri suojaa VMware-ympäristöä. Tarvitset OPH:n VPN:n
päästäksesi ssh:lla palvelimille. VPN:n ollessa päällä, testaa
ssh-yhteyttä:

``` bash
ssh -F ssh.config oph-va-app-test01 'echo ok'
```

## Yleisiä tehtäviä palvelimilla

Kirjaudu ensin palvelimelle:

``` bash
ssh -F ssh.config oph-va-app-test01
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
va-hakija                        RUNNING   pid 924, uptime 0:23:43
va-virkailija                    RUNNING   pid 24412, uptime 5 days, 1:43:38
```

va-hakijan uudelleenkäynnistys:

``` bash
sudo supervisorctl restart va-hakija
```

va-virkailijan uudelleenkäynnistys:

``` bash
sudo supervisorctl restart va-virkailija
```

### Thread dump

Thread dump webappin stdoutiin, joka ohjautuu lokiin:

``` bash
ps -fe | grep java  # etsi sovelluksen pid
sudo kill -3 924    # pyydä prosessilta thread dump
less +F /logs/valtionavustus/va-hakija_run.log
```

### psql-yhteys palvelimelle

Tiedostoon `ssh.config` on asetettu valmiiksi PostgreSQL:n daemonin
portin 5432 forwardointi.

1. Luo ssh-yhteys palvelimelle, esim: `ssh -F ssh.config
   oph-va-app-test01`
2. Lokaalisti: `psql -d va-qa -U va_hakija -h localhost -p 30012`

### JConsole-yhteys palvelimelle

Tiedostoon `ssh.config` on asetettu valmiiksi porttiforwardoinnit osalle
JConsolen vaatimista RMI-porteista.

1. Luo ssh-yhteys palvelimelle, esim: `ssh -F ssh.config
   oph-va-app-test01`
2. Etsi Java-sovelluksen prosessi-id: `ps -fe | grep java`
3. Etsi mitä portteja prosessi kuuntelee, esim: `sudo lsof -a -iTCP
   -sTCP:LISTEN -n -P | grep $PID`
   * Katso mikä on prosessin vaihtuva RMI-portti (se, joka ei ole
     palvelun oletus-http-portti eikä oletus-JMX-portti)
   * Oletetaan, että JMX-portit ovat: va-hakija=10876, va.virkailija=11322
4. Avaa uusi ssh-yhteys koneelle ja putkita RMI-portti (JMX-portti
   putkitetaan valmiiksi ssh-skriptissä), esim:
   `ssh -F ssh.config -L46498:localhost:46498 oph-va-app-test01`
5. Avaa JConsole omalla koneellasi (`jconsole &`) ja muodosta
   remote-yhteydet Java-sovelluksiin käyttäen osoitteina:
   * testiympäristöön:
     - va-hakija: "localhost:30013"
     - va-virkailija: "localhost:30014"
   * tuotantoympäristöön:
     - va-hakija: "localhost:30023"
     - va-virkailija: "localhost:30024"

## Tuotantoonvienti

Tuotantoonvienti päivittää molemmat sovellukset, va-hakijan ja
va-virkailijan.

1. Mene Jenkinsin web-käyttöliittymään
2. Aja jobi valtionavustus-deploy-production
3. Seuraa console outputia
4. Tarkista tuotannon lokeista, että kaikki on ok

### Rollback

Web-sovelluksen rollbackin voi tehdä vaihtamalla kohde, johon symlink
`va-hakija-current` tai `va-virkailija-curren` osoittaa. Esimerkkinä
va-hakijan rollback:

``` bash
ssh -F ssh.config oph-va-app-prod01

cd /data/www
sudo supervisorctl stop va-hakija
sudo rm va-hakija-current
sudo ln -s va-hakija-20170601152639 va-hakija-current
sudo chown -h va-deploy:www-data va-hakija-current
sudo supervisorctl start va-hakija
```
