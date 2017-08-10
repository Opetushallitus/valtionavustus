# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut
palvelut.

Projekti koostuu kahdesta web-palvelusta: va-hakija ja
va-virkailija. Näillä on omat Leiningen-moduulit projektin
juurihakemistossa. Web-sovelluksien yhteinen koodi on moduulissa
va-common. Lisäksi moduulissa soresu-form on geneerinen lomake-editori,
joka on yhteinen riippuvuus muille projektin moduuleille. Soresu-form
pitää asentaa git submodulena.

[Tekninen dokumentaatio](doc/README.md)

## Riippuvuudet

* [Node.js 6](https://nodejs.org/)
* [Leiningen](https://leiningen.org/)
* [PostgreSQL 9.4](https://www.postgresql.org/)
* [soresu-form](https://github.com/Opetushallitus/soresu-form)

Asenna soresu-form-moduuli:

``` shell
git submodule init
git submodule update
```

Käytä OPH:n VPN:ää, jotta voit ladata tarvittavat jar-paketit OPH:n
Artifactorystä.

## Kehitysympäristö

Kehitystyössä hyödyllisiä työkaluja:

* [FakeSMTP](https://nilhcem.github.io/FakeSMTP/)

Projektin juurihakemisto sisältää `lein`-skriptin, jota voi käyttää
Leiningenin ajamiseen. Tämä takaa kiinteän version käytön Leiningenistä.

### Tietokanta

*Huom:* Linux-koneilla Postgres-komennot on helpointa ajaa
postgres-käyttäjänä:

``` shell
sudo -s -u postgres
```

Luo paikallinen postgres-datahakemisto:

``` shell
initdb -d postgres
```

Käynnistä tietokantapalvelin:

``` shell
postgres -D postgres
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

### Frontend

Asenna kaikki frontendin buildaamiseen käytetyt paketit:

``` shell
for dir in soresu-form va-common va-hakija va-virkailija scripts; do
    pushd "$dir" && npm install && popd
done
```

Käynnistä frontendin assettien monitorointi, kääntäen tarvittaessa:

``` shell
./scripts/web-watch-build.js
```

Vaihtoehtoisesti webpackin inkrementaalista kääntämistä hyödyntävä
build. Tällöin riippuvuuksissa (soresu-form, va-common) tapahtuvat
muutokset eivät siirry webpackin käännökseen, ellei itse web-sovelluksen
lähdekoodi muutu myös:

``` shell
cd va-hakija
npm run watch

cd va-virkailija
npm run watch
```

Mikäli kirjoitat muutoksia pääasiassa soresu-formiin tai va-commoniin,
käytä `web-watch-build.js`-skriptiä, jotta muutokset siirtyvät varmasti
va-hakijaan ja va-virkailijaan.

Frontendin yksikkötestit on
kirjoitettu [Mochalla](https://mochajs.org/). Niiden ajaminen,
esimerkiksi va-hakija-moduulissa:

``` shell
cd va-hakija
npm run test         # kerta-ajo
npm run watch-test   # monitorointi ja ajo muutoksista
```

Va-hakija-moduulilla on Mocha-pohjaistet UI-testit. Ne voi ajaa selaimessa, kun on ensin
käynnistänyt va-hakijan web-sovelluksen testiympäristössä:


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

Frontendin tuotantoversion build, projektin juurihakemistossa:

``` shell
./lein modules buildfront
```

### Backend

Asenna ensin web-sovelluksien riippuvuudet paikalliseen
`~/.m2`-hakemistoon:

``` shell
./lein modules install
```

Web-sovelluksien ajaminen Leiningenissa tapahtuu käyttämällä
`trampoline`-komentoa, jotta JVM ajaa shutdown-hookit, joissa
vapautetaan resursseja (uberjarin kautta ajaessa ongelmaa ei ole):

``` shell
cd va-hakija
../lein trampoline run
```

Toisessa terminaalissa:

``` shell
cd va-virkailija
../lein trampoline run
```

Web-sovelluksen palvelimen käynnistys ajaa tietokannan migraatiot
automaattisesti.

Kaikkien moduulien testien ajaminen, projektin juurihakemistossa:

``` shell
lein modules test
```

Yksittäisen moduulin testien ajaminen, esimerkkinä va-hakija:

``` shell
cd va-hakija
lein with-profile test spec -f d       # kerta-ajo
lein with-profile test spec -a         # monitorointi ja ajo muutoksista
lein with-profile test spec -a -t tag  # monitorointi ja ajo vain testeille, jotka merkitty tägillä `tag`
```

Backendin testit sisältävät myös frontendin yksikkötestien ajon ja
UI-testien ajon PhantomJS:llä (tiedostot `mocha_spec.clj`).

Mikäli muutat frontendin koodia, pitää ne kääntää erikseen (katso
ylhäältä).

Backendin tuotantoversion build, projektin juurihakemistossa:

``` shell
lein modules uberjar
```

### Ajoympäristöt

Sovelluksen ajoympäristön voi asettaa Leiningenin komennolla
`with-profile PROFILE`. Esimerkiksi `test`-ympäristön käyttö
web-sovelluksen ajamiseen:

``` shell
cd va-hakija
../lein with-profile test trampoline run
```

Ajoympäristojen konfiguraatiot ovat moduulien
`config`-hakemistossa
[`.edn`](https://github.com/edn-format/edn)-tiedostoissa.

Komento `lein test` käyttää `test`-ympäristöä
automaattisesti. [Lisätietoja Leiningenin profiileista](https://github.com/technomancy/leiningen/blob/master/doc/PROFILES.md).

### Sekalaisia komentoja

Tietokannan tyhjennys:

``` shell
cd va-hakija
../lein dbclear
```

Leiningenin komentoja voi ketjuttaa käyttämällä `do`-komentoa ja
erottelemalla halutut komennot pilkulla ja välilyönnillä. Esimerkiksi
tietokannan tyhjennys, tuotantoa vastaava fronttibuildi ja sovelluksen
käynnistys:

``` shell
cd va-hakija
../lein trampoline do dbclear, buildfront, run
```

Hakijasovelluksen tuotantoversion ajo:

``` shell
cd va-hakija
../lein uberjar
CONFIG=config/va-prod.edn java -jar target/uberjar/hakija-0.1.0-SNAPSHOT-standalone.jar
```

Riippuvuutena toimivien moduulien jarrien buildaus automaattisesti
muutoksista:

``` shell
cd soresu-form
../lein auto install

cd va-common
../lein auto install
```

Kaikkien moduulien install ja testien ajo projektin juuressa:

``` shell
./lein with-profile test do modules install, modules spec -f d
```

Backendin riippuvuuksien versioiden tarkistus, projektin
juurihakemistossa:

``` shell
./lein modules ancient
```

Frontendin riippuvuuksien tarkistus, moduulin hakemistossa:

``` shell
cd va-hakija
npm outdated
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
for dir in va-hakija va-virkailija; do
    mkdir -p "$dir/checkouts" && \
    pushd "$dir/checkouts" && \
    ln -s ../../soresu-form soresu && \
    ln -s ../../va-common common && \
    popd
done
```

Leiningen tunnistaa nyt `soresu` ja `common` -kirjastot
ns.
[checkout dependencyinä](https://github.com/technomancy/leiningen/blob/master/doc/TUTORIAL.md#checkout-dependencies),
jolloin muutokset lähdekoodissa ja muutoksen evaluointi voidaan saada
näkyviin hakijan ja virkailijan sovelluksissa ajonaikaisesti.

Esimerkiksi Emacsin
[CIDER](https://cider.readthedocs.io/)-kehitysympäristöä käyttäessä:

1. Käynnistä REPL hakijan tai virkailijan moduulissa: avaa moduulissa
   oleva clj-lähdekoodi puskuriin (esim. tiedosto
   `va-virkailija/src/oph/va/virkailija/routes.clj`) ja suorita
   Emacs-komento `cider-jack-in`

2. Kun REPL on käynnistynyt, käynnistä sovelluspalvelin REPL:ssä:

   ```
   oph.va.hakija.main> (def main (-main))
   ```

3. Muokkaa `soresu` tai `common` -kirjastossa olevaa clj-lähdekoodia,
   evaluoi muutos (esim. Emacs-komento `cider-eval-defun-at-point`)

4. Muutoksen vaikutuksen pitäisi näkyä sovelluksessa.

## JConsole-yhteys palvelimelle

1. Mene palvelimelle, esim: `./servers/ssh_to_va-test.bash`
2. Etsi Java-sovelluksen prosessi-id: `ps -fe | grep java`
3. Etsi mitä portteja prosessi kuuntelee, esim: `sudo lsof -a -iTCP
   -sTCP:LISTEN -n -P | grep $PID`
   * Katso mikä on prosessin vaihtuva RMI-portti (se, joka ei ole
     palvelun oletus-http-portti eikä oletus-JMX-portti)
   * Oletetaan, että JMX-portit ovat: va-hakija=10876, va.virkailija=11322
4. Avaa uusi ssh-yhteys koneelle ja putkita RMI-portti (JMX-portti
   putkitetaan valmiiksi ssh-skriptissä), esim:
   `.servers/ssh_to_va-test.bash -L46498:localhost:46498`
5. Avaa JConsole omalla koneellasi (`jconsole &`) ja muodosta
   remote-yhteydet Java-sovelluksiin käyttäen osoitteina:
   * testissä:
     - va-hakija: "localhost:10876"
     - va-virkailija: "localhost:11322"
   * tuotannossa:
     - va-hakija: "localhost:20876"
     - va-virkailija: "localhost:21322"

## Tuetut selaimet

Hakijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox, IE11.

Virkailijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox.
