# Valtionavustukset

Opetushallituksen (OPH) valtionavustusten hakemiseen, käsittelyyn ja
myöntämiseen tarkoitetut palvelut.

Projekti koostuu kahdesta web-palvelusta: va-hakija ja
va-virkailija. Näillä on omat Leiningen-projektit tämän git-repositoryn
juurihakemistossa. Web-sovelluksien yhteinen koodi on
Leiningen-projektissa va-common. Lisäksi Leiningen-projektissa
soresu-form on geneerinen lomake-editori, joka on riippuvuus
va-commonille.

Tässä README:ssä on yleiskuvaus palveluista, lisää dokumentaatiota:

* [Tekninen yleiskuvaus](doc/technical_overview.md)
* [Tietokantaoperaatiot](doc/database_operations.md)

## Käsitteitä ja käyttäjärooleja

_Hakija_ on käyttäjä, joka täyttää ja lähettää _hakemuksen_ avoimeen
_avustushakuun_. Kuka tahansa voi lähettää hakemuksen (ei
autentikointia). Tähän käytetään va-hakija-sovellusta.

Virkailijan käyttöliittymässä (va-virkailija-sovellus) arvioidaan
hakemuksia. Sovellukseen kirjaudutaan OPH:n CAS-palvelun kautta. CAS
hakee käyttäjäoikeudet OPH:n LDAP:sta, johon on tallennettu käyttäjien
tyypit.

Käyttäjätyypit:

* Normaali (VA-käyttäjä)
  - voi lukea kaikkia hakuja ja hakemuksia
  - voi muokata niitä hakuja, joissa on esittelijä-roolissa
  - voi arvioida niitä hakuja, joissa on arvioija-roolissa
* Admin (VA-pääkäyttäjä)
  - voi lukea ja muokata kaikkia hakuja ja hakemuksia

Hakukohtaiset roolit:

* Esittelijä
  - voi muokata hakua ja siihen saapuneita hakemuksia
  - haun "vastaava"
  - vastaa rahoituksen jakautumisesta hyväksyttyjen hakemuksien kesken
* Arvioija
  - voi rajatusti muokata hakua: arvioi tiettyjä kohtia hausta ja voi muokata osia rahoituksesta
  - tukeva rooli esittelijälle

Haun roolista huolimatta kuka tahansa VA-käyttäjä voi kommentoida hakemuksia.

| Käsite | Kuvaus |
|---|---|
| Haku tai avustushaku | Mahdollistaa rahan jakamisen hakijoille. Avustushaulle tehdään lomake, joka julkaistaan. Hakija lähettää avustushakukohtaisen hakemuksen. |
| Hakemus | Hakijan kirjoittama avustushakukohtainen anomus rahoituksen saamiseksi. |
| Diaarinumero | Tunniste haun arkistointia varten. Usealla haulla voi olla sama diaarinumero. va-virkailija-sovellus lähettää haun (joka sisältää diaarinumeron) sähköpostilla kirjaamo.oph.fi:hin, jossa haut tulostetaan ja arkistoidaan. OPH:lla on suunnitteilla on ottaa käyttöön sähköinen arkistointi, jolloin diaarinumero tulisi hakuun automaattisesti integraation kautta. |

## Riippuvuudet

* [Node.js](https://nodejs.org/), versio 8.x
* [Leiningen](https://leiningen.org/), versio 2.7.1
* [Java SE Development Kit](http://www.oracle.com/technetwork/java/javase/index.html), versio 8
* [PostgreSQL](https://www.postgresql.org/), vähintään versio 9.4
* [GNU make](https://www.gnu.org/software/make/), vähintään versio 3.81

Käytä OPH:n VPN:ää, jotta voit ladata tarvittavat jar-paketit OPH:n
Artifactorystä.

## Kehitysympäristö

Kehitystyössä hyödyllisiä työkaluja:

* [FakeSMTP](https://nilhcem.github.io/FakeSMTP/)

Projektin juurihakemistossa on `Makefile`, jolla voi ajaa koko projektia koskevia yleisiä komentoja. Sen käyttöön on ohje:

``` shell
make help
```

Juurihakemisto sisältää `lein`-skriptin, jota voi käyttää Leiningenin
ajamiseen. Tämä takaa staattisen version käytön Leiningenistä.

### Suositeltu hakemistohierarkia

``` bash
ls -lA oph
```

```
drwxr-xr-x  26 username  staff    884 Feb 17 09:46 postgresql-data/
drwxr-xr-x  26 username  staff    884 Feb 17 09:46 valtionavustus/
drwxr-xr-x  25 username  staff    850 Feb 17 10:54 valtionavustus-secret/
```

### Tietokanta

*Huom:* Linux-koneilla Postgres-komennot on helpointa ajaa
postgres-käyttäjänä:

``` shell
sudo -s -u postgres
```

Luo paikallinen datahakemisto:

``` shell
initdb -D postgresql-data
```

Halutessasi aseta seuraavat tiedostoon
`postgresql-data/postgresql.conf`, jotta voit seurata tarkemmin mitä
tietokannassa tapahtuu:

```
log_destination = 'stderr'
log_line_prefix = '%t %u '
log_statement = 'mod'
```

Käynnistä tietokantapalvelin:

``` shell
postgres -D postgresql-data
```

Luo käyttäjät `va-hakija` ja `va-virkailija` (kummankin salasana `va`):

``` shell
createuser -s va_hakija -P
createuser -s va_virkailija -P
```

Luo tietokanta nimeltään `va-dev`:

``` shell
createdb -E UTF-8 va-dev
```

Kun web-sovellus käynnistyy, ajaa se tarvittavat migraatiot
tietokantaan.

Tietokannan saa tyhjennettyä ajamalla:

``` shell
dropdb va-dev
createdb -E UTF-8 va-dev
```

#### Docker

Vaihtoehtoisesti voit ajaa tietokantaa
[docker-composella](https://docs.docker.com/compose/). Hakemistossa
`scripts/docker`:

1. Vaihda `db-variables.env`-tiedostoon haluamasi postgres-käyttäjän
   salasana. Tiedosto on `.gitignore`:ssa, joten salasanasi ei päädy
   versiohallintaan.
2. Aja `docker-compose up -d`

Jos tahdot tyhjentää tietokannan tai teet muutoksia docker-tiedostoihin,
aja:

``` bash
docker-compose up --build -d
```

Vipu `-d` asettaa imagen pyörimään taustalle (daemon).

### Frontend

Asenna kaikki frontendin buildaamiseen käytetyt npm-moduulit, projektin
juurihakemistossa:

``` shell
make npm-clean npm-install-modules
```

Käynnistä frontendin assettien buildi webpackilla. Tällöin webpack
generoi selaimen käyttämät JavaScript-tiedostot. Webpack buildaa
tarvittaessa uudelleen, jos lähdekoodi yllä olevissa hakemistoissa
muuttuu:

``` shell
cd va-hakija
npm run build-watch

cd va-virkailija
npm run build-watch
```

Frontendin tuotantoversion buildi, projektin juurihakemistossa:

``` shell
make npm-build
```

Frontendin yksikkötestit on kirjoitettu
[Mochalla](https://mochajs.org/). Niiden ajaminen, esimerkiksi
va-hakijan hakemistossa:

``` shell
cd va-hakija
npm run test         # kerta-ajo
npm run test-watch   # monitorointi ja ajo muutoksista
```

Va-hakija-projektilla on Mocha-pohjaiset UI-testit. Ne voi ajaa
selaimessa, kun on ensin käynnistänyt va-hakijan web-sovelluksen
testiympäristössä:

``` shell
cd va-hakija
../lein with-profile test trampoline run
```

ja sitten avaa [testien url](http://localhost:8081/test/runner.html)
selaimessa.

Vaihtoehtoisesti UI-testit voi ajaa PhantomJS:llä:

``` shell
cd va-hakija
npm run test-browser
```

Kaikkien frontendin yksikkötestien ajo, projektin juurihakemistossa:

``` shell
make npm-test
```

### Backend

Asenna ensin backendien riippuvuudet paikalliseen
`~/.m2`-hakemistoon. Tarvitset tätä varten OPH:n VPN:n, koska osa
riippuvuuksista on OPH:n Artifactoryssä. Projektin juurihakemistossa:

``` shell
make lein-clean lein-install-jar-commons
```

Backendien ajaminen Leiningenissa tapahtuu käyttämällä
`trampoline`-komentoa, jotta JVM ajaa shutdown-hookit, joissa
vapautetaan resursseja (uberjarin kautta ajaessa ongelmaa ei ole):

``` shell
cd va-hakija
../lein trampoline run

cd va-virkailija
../lein trampoline run
```

Backendin käynnistys ajaa tietokannan migraatiot automaattisesti.

Backendin uberjarrien buildi, projektin juurihakemistossa:

``` shell
make lein-build
```

Yksittäisen Leiningen-projektin testien ajaminen, esimerkkinä va-hakija:

``` shell
cd va-hakija
lein with-profile test spec -f d       # kerta-ajo
lein with-profile test spec -a         # monitorointi ja ajo muutoksista
lein with-profile test spec -a -t tag  # monitorointi ja ajo vain testeille, jotka merkitty tägillä `tag`
```

Backendin testit sisältävät myös frontendin yksikkötestien ajon ja
UI-testien ajon PhantomJS:llä (tiedostot `mocha_spec.clj`).

Mikäli muutat frontendin koodia, pitää frontendin buildi ajaa uudelleen
(katso ylhäältä).

Kaikkien Leiningen-projektien testien ajaminen, juurihakemistossa:

``` shell
make lein-test
```

### Ajoympäristöt

Sovelluksen ajoympäristön voi asettaa Leiningenin komennolla
`with-profile PROFILE`. Esimerkiksi `test`-ympäristön käyttö
web-sovelluksen ajamiseen:

``` shell
cd va-hakija
../lein with-profile test trampoline run
```

Ajoympäristojen konfiguraatiot ovat Leiningen-projektien
`config`-hakemistossa
[`.edn`](https://github.com/edn-format/edn)-tiedostoissa.

Komento `lein test` käyttää `test`-ympäristöä
automaattisesti. [Lisätietoja Leiningenin profiileista](https://github.com/technomancy/leiningen/blob/master/doc/PROFILES.md).

### Yleisiä komentoja

Tietokannan tyhjennys:

``` shell
cd va-hakija
../lein dbclear
```

Leiningenin komentoja voi ketjuttaa käyttämällä `do`-komentoa ja
erottelemalla halutut komennot pilkulla ja välilyönnillä. Esimerkiksi
tietokannan tyhjennys ja sovelluksen käynnistys:

``` shell
cd va-hakija
../lein trampoline do dbclear, run
```

Jos muutat backendien riippuvuuksina toimivien soresu-formin ja
va-commonin Clojure-koodia, pitää niiden jar-paketit asentaa uudelleen,
jotta backendit saavat muutokset käyttöön:

``` shell
cd soresu-form
../lein do clean, install
```

Vaihtoehtoisesti jarrien buildaus automaattisesti, kun lähdekoodi
muuttuu:

``` shell
cd soresu-form
../lein auto install
```

Hakijasovelluksen tuotantoversion ajo:

``` shell
cd va-hakija
../lein uberjar
CONFIG=config/va-prod.edn java -jar target/uberjar/hakija-0.1.0-SNAPSHOT-standalone.jar
```

Frontendin ja backendin puhdas buildi ja testien ajo, projekin
juurihakemistossa:

``` shell
make clean build test
```

Backendin riippuvuuksien versioiden tarkistus, projektin
juurihakemistossa:

``` shell
make lein-outdated-dependencies
```

Frontendin riippuvuuksien tarkistus, projektin juurihakemistossa:

``` shell
make npm-outdated-dependencies
```

Hakemusten generointi:

``` shell
cd va-hakija
../lein populate 400
```

### Interaktiivinen kehitys

Luo `checkouts`-hakemistot hakijan ja virkailijan
sovellusmoduuleihin. Projektin juurihakemistossa:

``` shell
make lein-install-checkouts
```

Leiningen tunnistaa nyt `soresu` ja `common` -kirjastot ns. [checkout
dependencyinä](https://github.com/technomancy/leiningen/blob/master/doc/TUTORIAL.md#checkout-dependencies),
jolloin muutokset lähdekoodissa ja muutoksen evaluointi voidaan saada
näkyviin hakijan ja virkailijan sovelluksissa ajonaikaisesti.

Jotkut kehitystyökalut saattavat injektoida Leiningeniä käynnistäessä
overridaavan riippuvuuden `org.clojure/tools.nrepl`-jarriin, jota myös
Leiningen itse käyttää. Mikäli overriden versio on eri kuin Leiningenin
käyttämä versio, ilmoittaa Leiningen virheestä ja aborttaa, koska asetus
`:pedantic? :abort` on päällä. Voit ratkaista ongelman kahdella eri
tavalla:

* Aseta `:pedantic? :range` Leiningenin user-profiiliin tiedostossa
  `~/.lein/profiles.clj`:

  ``` edn
  {:user {:pedantic? :range}
  ```

  Tällöin Leiningen varoittaa overridaavista riippuvuuksista, mutta ei
  aborttaa.

* Määrittele `org.clojure/tools.nrepl`-jarrin versio samaksi kuin mitä
  kehitystyökalu käyttää tiedostoon `~/.lein/profiles.clj`. Esimerkiksi:

  ``` edn
  {:repl {:dependencies [[org.clojure/tools.nrepl "0.2.13"]]}}
  ```

Esimerkiksi Emacsin
[CIDER](https://cider.readthedocs.io/)-kehitysympäristöä käyttäessä:

1. Aseta `(customize-set-variable 'cider-prompt-for-symbol nil)`, jotta
   CIDER ei [injektoi riippuvuuksia
   automaattisesti](https://github.com/clojure-emacs/cider/blob/master/doc/installation.md#ciders-nrepl-middleware).

2. Aseta CIDERin riippuvuudet `~/.lein/profiles.clj`:ssä:

   ``` edn
   {:repl {:plugins [[cider/cider-nrepl "0.16.0-SNAPSHOT"]]
           :dependencies [[org.clojure/tools.nrepl "0.2.13"]]}}
   ```

3. Käynnistä REPL hakijan tai virkailijan moduulissa: avaa moduulissa
   oleva clj-lähdekoodi puskuriin (esim. tiedosto
   `va-virkailija/src/oph/va/virkailija/routes.clj`) ja suorita
   Emacs-komento `cider-jack-in`

4. Kun REPL on käynnistynyt, käynnistä sovelluspalvelin REPL:ssä:

   ```
   oph.va.virkailija.main> (def main (-main))
   ```

5. Muokkaa `soresu` tai `common` -kirjastossa olevaa clj-lähdekoodia,
   evaluoi muutos (esim. Emacs-komento `cider-eval-defun-at-point`)

6. Muutoksen vaikutuksen pitäisi näkyä sovelluksessa.

## Tuetut selaimet

Hakijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox, IE11.

Virkailijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox.

## Käyttöliittymän ratkaisuja

Ei näkymää, jossa listataan avoimet haut. OPH linkittää avoimet haut
oph.fi:hin käsin. Tämä johtuu prosessista, joilla hakuja luodaan (uusi
haku vaatii asetuksen).

Hakemuksen voi arvioida vasta hakuajan umpeuduttua. Tämä siksi, että
hakija voi muokata hakemusta siihen asti.

Hakemuksen tilat:

* hakijan näkökulmasta
  - uusi
  - luonnos
  - lähetetty
  - odottaa täydennystä
  - poistettu
* virkailijan ja arvioijan näkökulmasta
  - käsittelemättä
  - käsittelyssä
  - mahdollinen
  - hylätty (mahdollinen lopputila)
  - hyväksytty (mahdollinen lopputila)

va-virkailijan hakulomakkeen json-editorilla voi täysin muokata
lomakkeen sisältöä. Kaikkia graafisen lomake-editorin komponentteja ei
ole toteutettu. Lomakkeen voi kopioida json-editorin kautta toiseen
avustushakuun.

## Käytäntöjä

### Git

Git workflow on "Long-Running Branches" tyyppinen: [Git Branching - Branching
Workflows](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows).

Kehityksessä käytetään `develop`-haaraa.

Ominaisuudet yms. toteutetaan omina brancheina, jotka on tehty `develop`
-haarasta. Tähän poikkeuksen tekevät kiireelliset hotfixit, jotka tehdään
`master`-haarasta. Tällöin hotfixin julkaisun jälkeen tulee muutokset
rebasettaa/mergetä `develop`-haaraan.

Branchit nimetään Jira-tiketin mukaan, esimerkiksi
`va3-24-rearrange-of-form-fields`. Voit käyttää branchin nimeämisessä myös
suomenkieltä.

Branchit mergetään `develop`-haaraan pull requesteilla.

`develop`-haara mergetään `master`:iin hallitusti, esimerkiksi ennen
sprintin demoa.

`master`-haara kannattaa mergetä `develop`:iin aina ennen uuden branchin
luomista, jotta `master` ei eroa liiaksi `develop`:sta.

### Tyyli

- `.editorconfig`-tiedostossa on määritelty perustyylit, kuten
  - sisennys: 2 välilyöntiä
  - rivin pituus 80 merkkiä
- Frontendissä CSS-luokkien nimet pienellä ja sanat viivalla eroteltuna

### Kehityksen muistilista

Ennen pull requestin avaamista, toteuta ja tarkista seuraavat kohdat:

- [ ] Ohjeet kohta kohdalta, kuinka toteutus testataan (PR:n selitteeseen mukaan)
- [ ] Aja eslint
- [ ] Aja testit

