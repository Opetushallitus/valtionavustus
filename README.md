# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut palvelut.

[Tekninen dokumentaatio](doc/README.md)

# Riippuvuudet

* Node.js tai io.js
* Leiningen (Clojure build tool): http://leiningen.org/
* Postgres
* Soresu https://github.com/Opetushallitus/soresu-form

Lisää Soresu forms -submoduli paikalleen:

    git submodule init
    git submodule update

Riippuvuudet asentuvat ajamalla komennot:

    cd soresu-form && npm install && cd ..
    cd va-common && npm install && cd ..
    cd va-hakija && npm install && cd ..
    cd va-virkailija && npm install

Kehitysaikaisesti hyödyllisiä työkaluja:

* FakeSMTP: https://nilhcem.github.io/FakeSMTP/

# Tietokanta

Huom: Linux-koneilla postgres-komennot on helpointa ajaa postgres-käyttäjänä

   sudo su postgres

Luo paikallinen postgres-datahakemisto

    initdb -d postgres

Käynnistä tietokantaserveri

    postgres -D postgres

Luo käyttäjät ```va-hakija``` ja ```va-virkailija``` (kummankin salasana: va)

    createuser -s va_hakija -P
    createuser -s va_virkailija -P

Luo ```va-dev``` tietokanta

    createdb -E UTF-8 va-dev

Asenna kaikki modulit paikalliseen m2-repositoryyn

   lein modules do buildfront, install

Serverin start ajaa automaattisesti migraatiot

    cd va-hakija
    ../lein run

ja eri terminaalissa

    cd va-virkailija
    ../lein run

Tietokannan saa kokonaan tyhjättyä ajamalla

    dropdb va-dev
    createdb -E utf-8 va-dev

# Käynnistys

*Huom*: trampoline on tarpeellinen, koska muuten JVM:n shutdown-hookkia ei
ajeta. Tämä taas jättää mahdollisesti resursseja vapauttamatta. Uberjarin
kautta ajaessa ongelmaa ei ole.

Paikallisesti (ilman fronttibuildia):

    cd va-hakija
    ../lein trampoline run
    cd va-virkailija
    ../lein trampoline run

Kannan tyhjäys, fronttibuildi ja sovelluksen käynnistys paikallisesti:

    cd va-hakija
    ../lein trampoline do dbclear, buildfront, run

Tai virkailijasovellukselle

    cd va-virkailija
    ../lein trampoline do dbclear, buildfront, run

Hakijasovellus tuotantoversiona:

    cd va-hakija
    ../lein uberjar
    CONFIG=config/va-prod.edn java -jar target/uberjar/hakija-0.1.0-SNAPSHOT-standalone.jar

**Huom:** Jar-tiedoston versio voi vaihtua

Eri ympäristön voi ottaa käyttöön seuraavasti (ympäristöjen konffit ovat ```config``` hakemistossa)

    ../lein with-profile [dev,test,va-test,va-prod] run

# Testien ajo

Testien ajo (ajaa myös mocha testit):

    ./lein with-profile test do modules clean, modules spec -f d

tai (automaattisesti pelkät hakijapuolen testit aina muutoksissa)

    cd va-hakija
    ../lein with-profile test spec -a

Ajettavaa testisettiä voi rajata tiettyyn tägiin lisäämällä esimerkiksi parametrin
```-t ui``` tai ```-t server``` .

Huom: Vaikka ```lein run``` lataa automaattisesti muuttuneet koodit,
Javascriptin automaattikäännöstä varten pitää käynnistää erilliseen
terminaaliin oma watch komento:

    cd va-hakija
    npm run watch

    cd va-virkailija
    npm run watch

Yhteisten jarrien teko automaattisesti aina muutoksista

    cd soresu-form
    ../lein auto install

    cd va-common
    ../lein auto install

Kaikkien moduulien install ja testien ajo projektin juuressa:

    ./lein with-profile test do modules install, modules spec -f d

## Mocha testit

Voit ajaa selaimella osoitteessa http://localhost:8080/test/runner.html

# Konfiguraatiot

Eri konfiguraatiot sijaitsevat hakemistossa ```config```.

Konfiguraatiotiedostot ovat EDN-formaatissa, joka on yksinkertaistettu
Clojure-tyyppinen tietorakenne.

# Muut komennot

Ovatko riippuvuudet päivittyneet? Aja alimodulissa seuraavat komennot

    ./lein modules ancient

ja

    npm outdated

Hakemusten generointi

    cd va-hakija
    lein populate 400

# JConsole yhteys palvelimelle

* mene palvelimelle: esim. `./servers/ssh_to_va-test.bash`
* katso java serverprosessin id: `ps -fe | grep java`
* katso mitä portteja se kuuntelee: esim.`sudo netstat -apn | grep 32762 | grep LISTEN`
  - katso mikä on palvelun vaihtuva RMI portti (se on siis se, joka ei ole palvelun vakio http portti eikä vakio JMX portti)
    * JMX portti on: va-hakija=10876, va.virkailija=11322
* avaa uusi ssh yhteys koneelle ja putkita RMI portti (JMX portti putkitetaan valmiiksi ssh skriptissä): esim. `.servers/ssh_to_va-test.bash -L46498:localhost:46498`
* avaa jconsole omalla koneellasi: `jconsole &` ja ota remote yhteys käyttäen osoitteena:
  - testissä:
   * va-hakija: "localhost:10876"
   * va-virkailija: "localhost:11322"
  - pilotissa:
   * va-hakija: "localhost:20876"
   * va-virkailija: "localhost:21322"

# Tuetut selaimet

Hakijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla Firefox, IE11.

Virkailijan käyttöliittymä: viimeisin stabiili Google Chrome ja Mozilla Firefox.
