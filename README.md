# Valtionavustukset


Opetushallituksen (OPH) valtionavustusten hakemiseen, käsittelyyn ja
myöntämiseen tarkoitetut palvelut.

Projekti koostuu kahdesta web-palvelusta: va-hakija ja
va-virkailija. Molemmat palvelut ajetaan samasta Clojure-backendista,
joka on yksi Leiningen-projekti repositoryn juuressa (lähdekoodi
hakemistossa `server/`). Frontendien koodi on hakemistoissa
`va-hakija/web/` ja `va-virkailija/web/`, ja niiden yhteinen koodi
hakemistossa `soresu-form/web/`.

Tässä README:ssä on yleiskuvaus palveluista. Lisää dokumentaatiota:

* [Sähköpostien lähetyksen kulku](docs/emails-flow.md)

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

Docker ajaa backendin, tietokannan ja muut palvelut, joten niiden työkaluketjua
(Java, Leiningen, PostgreSQL) ei tarvita isäntäkoneella.

**Pakolliset (`task dev`):**

* [Docker](https://www.docker.com/) ja Docker Compose
* [Task](https://taskfile.dev/) (go-task) – ajaa kehitysympäristön ja testit
* tmux – `start-local-env.sh` käyttää tmux-sessiota
* [Node.js](https://nodejs.org/) – isäntäkoneen webpack-buildiin ja Playwrightiin;
  asentuu automaattisesti [`.nvmrc`](.nvmrc):n mukaan kehitysskripteissä

**Valinnaiset (backend Dockerin ulkopuolella tai REPL/editori):**

* OpenJDK + [Leiningen](https://leiningen.org/) – vain backendin ajamiseen
  isäntäkoneella (`./lein … run`) tai REPL:iin/CIDER:iin; Dockerissa valmiina.
  Käytä `lein`-skriptiä (lukittu versio); JDK-versio vastaa `Dockerfile.va-app`:ia.
  [SDKMAN!](https://sdkman.io/) helpottaa JDK:n asennusta.
* PostgreSQL-client – `pg_restore`/manuaalisiin tietokantaoperaatioihin; palvelin
  ajetaan Dockerissa.

## Trivy

https://trivy.util.yleiskayttoiset.opintopolku.fi/muut.html

## Kehitysympäristö

Kehitystyössä hyödyllisiä työkaluja:

Kehitysympäristö ja testit ajetaan [Taskilla](https://taskfile.dev); komennot
näkee komennolla `task --list` (ks. [`Taskfile.yml`](Taskfile.yml)). Repositoryn
`lein`-skripti takaa lukitun Leiningen-version.

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

Tietokanta ajetaan Docker Composella osana kehitysympäristöä (`task dev`),
tai yksinään:

``` shell
docker compose up db
```

Kun web-sovellus käynnistyy, ajaa se tarvittavat migraatiot tietokantaan.

Tietokannan palauttaminen backupista:

``` shell
pg_restore --user va -h localhost -v --clean --if-exists --no-acl --no-owner --dbname va-dev ./valtionavustukset-2.backup
```

### Frontend

Frontendin assetit buildataan webpackilla. `task dev` käynnistää buildin
automaattisesti ja buildaa uudelleen lähdekoodin muuttuessa. Buildin voi
ajaa myös käsin repositoryn juuressa:

``` shell
npm run build-watch
```

### Backend

Backendin käynnistys ajaa tietokannan migraatiot automaattisesti.
Backendin voi käynnistää suoraan Leiningenillä:

``` shell
./lein with-profile server-local run -m oph.va.hakija.main
```

### Ajoympäristöt

Sovelluksen ajoympäristön voi asettaa Leiningenin komennolla
`with-profile PROFILE` (esim. `server-local`, `server-test`).
Ajoympäristöjen konfiguraatiot ovat hakemistossa `server/config/`
[`.edn`](https://github.com/edn-format/edn)-tiedostoissa.

[Lisätietoja Leiningenin profiileista](https://github.com/technomancy/leiningen/blob/master/doc/PROFILES.md).

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
   `server/src/clojure/oph/va/virkailija/routes.clj`) ja suorita
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
Firefox.

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

