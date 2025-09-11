# Valtionavustukset

Opetushallituksen (OPH) valtionavustusten hakemiseen, käsittelyyn ja
myöntämiseen tarkoitetut palvelut.

Projekti koostuu kahdesta web-palvelusta: va-hakija ja
va-virkailija. Näillä on omat Leiningen-projektit tämän git-repositoryn
juurihakemistossa. Web-sovelluksien yhteinen koodi on
Leiningen-projektissa soresu-form.

Tässä README:ssä on yleiskuvaus palveluista, lisää dokumentaatiota:

* [Tekninen yleiskuvaus](doc/technical_overview.md)
* [Tietokantaoperaatiot](doc/database_operations.md)

## Käsitteitä ja käyttäjärooleja

_Hakija_ on käyttäjä, joka täyttää ja lähettää _hakemuksen_ avoimeen
_avustushakuun_. Kuka tahansa voi lähettää hakemuksen (ei
autentikointia). Tähän käytetään va-hakija-sovellusta.

Virkailijan käyttöliittymässä (va-virkailija-sovellus) arvioidaan
hakemuksia. Sovellukseen kirjaudutaan OPH:n CAS-palvelun (autentikointi)
ja Käyttöoikeuspalvelun (autorisointi) kautta.

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
| Asianumero | Tunniste haun arkistointia varten. Usealla haulla voi olla sama asianumero. va-virkailija-sovellus lähettää haun (joka sisältää asianumeron) sähköpostilla kirjaamo.oph.fi:hin, jossa haut tulostetaan ja arkistoidaan. OPH:lla on suunnitteilla on ottaa käyttöön sähköinen arkistointi, jolloin asianumero tulisi hakuun automaattisesti integraation kautta. |

## Riippuvuudet

* [Node.js](https://nodejs.org/)
  * asennus esim. [nvm](https://github.com/creationix/nvm):n tai [nodenv](https://github.com/nodenv/nodenv):n kautta
* [npm](https://www.npmjs.com/)
* [Leiningen](https://leiningen.org/), versio 2.8.1
* [Java SE Development Kit](http://www.oracle.com/technetwork/java/javase/index.html), versio 8
* [PostgreSQL](https://www.postgresql.org/), vähintään versio 12.2

## Trivy

https://trivy.util.yleiskayttoiset.opintopolku.fi/muut.html

## Kehitysympäristö

Kehitystyössä hyödyllisiä työkaluja:

Juurihakemisto sisältää `lein`-skriptin, jota voi käyttää Leiningenin
ajamiseen. Tämä takaa staattisen version käytön Leiningenistä.

### Suositeltu hakemistojärjestely

``` bash
ls -lA oph
```

```
drwxr-xr-x  26 username  staff    884 Feb 17 09:46 valtionavustus/
drwxr-xr-x  25 username  staff    850 Feb 17 10:54 valtionavustus-secret/
```

Missä `valtionavustus` ja `valtionavustus-secret` ovat projektin git-repositoryt.

### Tietokanta

#### Ajaminen Dockerilla

Docker-imagen luonti:

``` shell
cd valtionavustus/script/postgres-docker
docker build -t va-postgres:12.2 .
```

Data-hakemiston luonti:

``` shell
mkdir -p postgres-data
```

Tietokannan ajaminen Dockerissa:

``` shell
run_database.sh
```

Tietokannan palauttaminen, esim Lammen backupista:

``` shell
pg_restore --user va -h localhost -v --clean --if-exists --no-acl --no-owner --dbname va-dev ./valtionavustukset-2.backup
```

#### Ajaminen manuaalisesti

Kun web-sovellus käynnistyy, ajaa se tarvittavat migraatiot tietokantaan.

### Frontend

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

### Backend

Backendin käynnistys ajaa tietokannan migraatiot automaattisesti.

#### Yksittäisen Leiningen-projektin testien ajaminen, esimerkkinä va-hakija:

``` shell
cd va-hakija
../lein with-profile test spec -f d       # kerta-ajo
../lein with-profile test spec -a         # monitorointi ja ajo muutoksista
../lein with-profile test spec -a -t tag  # monitorointi ja ajo vain testeille, jotka merkitty tägillä `tag`
```

Backendin testit sisältävät myös frontendin yksikkötestien ajon

Mikäli muutat frontendin koodia, pitää frontendin buildi ajaa uudelleen
(katso ylhäältä).

Huom! va-virkailijan testien ajaminen edellyttää, että va-hakijan testit on ajettu aiemmin.

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

Hakemusten generointi:

``` shell
cd va-hakija
../lein populate 400
```

Clojuren formatterin käyttö
``` shell
lein cljfmt check 
lein cljfmt fix
```

### Interaktiivinen kehitys

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

2. Aseta CIDERin riippuvuudet `~/.lein/profiles.clj`:ssä (versionumerot
   riippuvat CIDER:n versiosta):

   ``` edn
   {:repl {:plugins [[cider/cider-nrepl "0.15.1"]]
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

08/2018 lisätty kommenttien piilotus, jos käyttäjä ei ole itse vielä
kommentoinut ([Jira VA3-438](https://jira.csc.fi/browse/VA3-438)). Kommenteissa
ei ole ollut aiemmin käyttäjän tunnistetta. Näin ollen vanhemmissa hauissa ei
voida tarkistaa, onko käyttäjä vielä kommentoinut. Tällöin näytetään kaikki
kommentit.

Uudemmissa hauissa toimintatapa on seuraava:
- Kun haku on jossain muussa tilassa, kuin ratkaistu
  - Jos käyttäjä ei ole kommentoinut, näytetään teksti, että mahdolliset muiden
    käyttäjien kommentit näkyvät, kun käyttäjä on kirjoittanut oman kommenttinsa
  - Käyttäjä ei voi tietää, onko hakemuksessa kommentteja vai ei
- Kun haku on ratkaistu
  - Näytetään kaikki kommentit tai teksti "Ei kommentteja"

## Maksatus

Sovellus tarkistaa jokaisen maksatuksen lähetyksessä, että virkailija ei ole
asettanut "Ei maksuun" tietoa tai hakija ei ole ilmoittanut, että ei ota
avustusta vastaan.

Handi palauttaa XML-muodossa vastauksen maksatuksesta, mikä luetaan
payment-schedulerin avulla ajastetusti ja maksatuksen tila päivitetään
tietokantaan.

Maksatukset-näkymässä listataan sekä julkaistut että ratkaistut haut. Ainoastaan
ratkaistujen hakujen maksatuslistaukset ovat käytettävissä.

Kun haun päätökset lähetetään, kaikille hakemuksille luodaan 1. erän maksatus
seuraavin ehdoin:
- Tila on hyväksytty
- Virkailija ei ole asettanut "Ei maksuun" täppää
- Hakija ei ole ilmoittanut, että ei ota avustusta vastaan

Maksatusprosessi etenee seuraavasti yhdessä erässä maksettavan haun kanssa:

- Ensimmäisen erän suuruus on luonnollisesti myönnetty summa (OPH:n osuus)
- Virkailija luo Maksatukset-näkymässä uuden maksuerän täyttämällä tarvittavat
  tiedot ja lähettää maksatukset Handiin

Maksatusprosessi etenee seuraavasti useammassa erässä maksettavan haun kanssa:

- Ensimmäisen erän summa määräytyy haussa tehtyjen määritysten (avustuksen
  summan leikkuri yms.) mukaan
  - Jos näitä ei ole haun tietoihin määritelty, käytetään oletusarvona, että
    kaikille maksetaan useassa erässä ja ensimmäinen erä on 60% myönnetystä
    summasta
- Virkailija luo Maksatukset-näkymässä uuden maksuerän täyttämällä tarvittavat
  tiedot ja lähettää 1. erän maksatukset Handiin
    - Asiakirjoja virkailija voi lisätä mielivaltaisen määrän maksuerää ja
    vaihetta kohden. Näitä tietoja käytetään maksatusten sähköposti-ilmoituksen
    lähettämiseen.
- Seuraavan erän summan asettaa virkailija Väliselvitys-välilehdellä
  - Tämän jälkeen maksu ilmestyy Maksatus-näkymään, josta sen voi lähettää,
    kuten ensimmäisen erän

Maksusanomassa on pitkäviite, jolla tunnistetaan hakemuksen maksatus
VA-järjestelmässä. Pitkäviite koostuu hakemuksen asianumerosta ja maksuerän
numerosta alaviivalla erotettuna. Samainen pitkäviite palautuu Handista
sanoman mukana, kun maksatus on maksettu.

Vanhoissa maksatuksissa ei ole pitkäviitteessä maksuerän numeroa. Näitä
parsittaessa oletetaan, että kyseessä on maksatuksen 1. erä.

### Maksatuksen tila

Maksatusten mahdolliset tilat ja niiden selitteet löytyvät tietokannasta taulusta `paymentstatus`.

## Muutoksenhaku

Tällä hetkellä järjestelmä tukee hakijan luomaa muutosta ainoastaan avustuksen
vastaanottamatta jättämisen osalta.

Jokaiselle hakemukselle luodaan lähetysvaiheessa (submit) vahvistussähköpostin
luonnissa uniikki tunniste, jolla hakija pääsee lähettämään
muutoshakemuksen. Tämä tunniste vanhenee, kun avustuksen ensimmäinen maksatus
lähetetään.

