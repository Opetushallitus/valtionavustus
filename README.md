# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut
palvelut.

[Tekninen dokumentaatio](doc/README.md)

# Riippuvuudet

* [Node.js](https://nodejs.org/)
* [Leiningen](https://leiningen.org/)
* [PostgreSQL](https://www.postgresql.org/)
* [Soresu](https://github.com/Opetushallitus/soresu-form)

Lisää Soresu forms -submoduli paikalleen:

``` shell
git submodule init
git submodule update
```

Riippuvuudet asentuvat ajamalla komennot:

``` shell
cd soresu-form && npm install && cd ..
cd va-common && npm install && cd ..
cd va-hakija && npm install && cd ..
cd va-virkailija && npm install
```

Kehitystyössä hyödyllisiä työkaluja:

* [FakeSMTP](https://nilhcem.github.io/FakeSMTP/)

# Tietokanta

Huom: Linux-koneilla postgres-komennot on helpointa ajaa
postgres-käyttäjänä:

``` shell
sudo su postgres
```

Luo paikallinen postgres-datahakemisto:

``` shell
initdb -d postgres
```

Käynnistä tietokantaserveri:

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

Asenna kaikki modulit paikalliseen m2-repositoryyn:

``` shell
lein modules do buildfront, install
```

Serverin start ajaa automaattisesti migraatiot:

``` shell
cd va-hakija
../lein run
```

ja eri terminaalissa:

``` shell
cd va-virkailija
../lein run
```

Tietokannan saa kokonaan tyhjättyä ajamalla:

``` shell
dropdb va-dev
createdb -E utf-8 va-dev
```

# Käynnistys

*Huom*: Leiningenin trampoline-komento on tarpeellinen, koska muuten
JVM:n shutdown-hookkia ei ajeta. Tämä taas jättää mahdollisesti
resursseja vapauttamatta. Uberjarin kautta ajaessa ongelmaa ei ole.

Paikallisesti (ilman fronttibuildia):

``` shell
cd va-hakija
../lein trampoline run
```

``` shell
cd va-virkailija
../lein trampoline run
```

Kannan tyhjäys, fronttibuildi ja sovelluksen käynnistys paikallisesti:

``` shell
cd va-hakija
../lein trampoline do dbclear, buildfront, run
```

Tai virkailijasovellukselle:

``` shell
cd va-virkailija
../lein trampoline do dbclear, buildfront, run
```

Hakijasovellus tuotantoversiona:

``` shell
cd va-hakija
../lein uberjar
CONFIG=config/va-prod.edn java -jar target/uberjar/hakija-0.1.0-SNAPSHOT-standalone.jar
```

*Huom:* Jar-tiedoston versio voi vaihtua.

Eri ympäristön voi ottaa käyttöön seuraavasti (ympäristöjen konffit ovat
`config` hakemistossa):

``` shell
../lein with-profile [dev,test,va-test,va-prod] run
```

# Testien ajo

Testien ajo (ajaa myös mocha testit):

``` shell
./lein with-profile test do modules clean, modules spec -f d
```

tai (automaattisesti pelkät hakijapuolen testit aina muutoksissa):

``` shell
cd va-hakija
../lein with-profile test spec -a
```

Ajettavaa testisettiä voi rajata tiettyyn tägiin lisäämällä esimerkiksi
parametrin `-t ui` tai `-t server`.

*Huom:* Vaikka `lein run` lataa automaattisesti muuttuneet koodit,
Javascriptin automaattikäännöstä varten pitää käynnistää erilliseen
terminaaliin oma watch komento:

``` shell
cd va-hakija
npm run watch
```

``` shell
cd va-virkailija
npm run watch
```

Yhteisten jarrien teko automaattisesti aina muutoksista:

``` shell
cd soresu-form
../lein auto install
```

``` shell
cd va-common
../lein auto install
```

Kaikkien moduulien install ja testien ajo projektin juuressa:

``` shell
./lein with-profile test do modules install, modules spec -f d
```

## Mocha testit

Voit ajaa selaimella osoitteessa: http://localhost:8080/test/runner.html

# Konfiguraatiot

Eri konfiguraatiot sijaitsevat hakemistossa `config`.

Konfiguraatiotiedostot ovat EDN-formaatissa, joka on yksinkertaistettu
Clojure-tyyppinen tietorakenne.

# Muut komennot

Ovatko riippuvuudet päivittyneet? Aja alimodulissa seuraavat komennot:

``` shell
./lein modules ancient
```

ja

``` shell
npm outdated
```

Hakemusten generointi:

``` shell
cd va-hakija
../lein populate 400
```

# Interaktiivinen kehitys

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

Leiningen tunnistaa nyt `soresu` ja `common` -kirjastot ns.
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

# JConsole-yhteys palvelimelle

1. Mene palvelimelle, esim: `./servers/ssh_to_va-test.bash`
2. Etsi Java-sovelluksen prosessi-id: `ps -fe | grep java`
3. Etsi mitä portteja prosessi kuuntelee, esim: `sudo netstat -apn |
   grep 32762 | grep LISTEN`
   * Katso mikä on prosessin vaihtuva RMI-portti (se on siis se, joka ei
     ole palvelun oletus-http-portti eikä oletus-JMX-portti)
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

# Tuetut selaimet

Hakijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox, IE11.

Virkailijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla
Firefox.
