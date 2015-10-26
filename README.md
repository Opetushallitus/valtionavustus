# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut palvelut.

# Riippuvuudet

* Node.js tai io.js
* Leiningen (Clojure build tool): http://leiningen.org/
* Postgres

Riippuvuudet asentuvat ajamalla komennot:

    ./lein modules deps

ja

    cd soresu-form && npm install && cd ..
    cd va-common && npm install && cd ..
    cd va-hakija && npm install && cd ..
    cd va-virkailija && npm install

Kehitysaikaisesti hyödyllisiä työkaluja:

* FakeSMTP: https://nilhcem.github.io/FakeSMTP/

# Tietokanta

Luo paikallinen postgres-datahakemisto

    initdb -d postgres

Käynnistä tietokantaserveri

    postgres -D postgres

Luo käyttäjät ```va-hakija``` ja ```va-virkailija``` (kummankin salasana: va)

    createuser -s va_hakija -P
    createuser -s va_virkailija -P

Luo ```va-dev``` tietokanta

    createdb -E UTF-8 va-dev

Luo skeema ja lataa initial data (myös serverin start ajaa automaattisesti migraatiot)

    cd va-hakija
    ../lein dbmigrate
    cd ..
    cd va-virkailija
    ../lein dbmigrate

Tietokannan saa kokonaan tyhjättyä ajamalla

    cd va-hakija
    ../lein dbclear
    cd ..
    cd va-virkailija
    ../lein dbclear

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

# Dokumentaatio

Swagger-pohjainen API-dokumentaatio löytyy osoitteesta http://localhost:8080/doc

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

Ovatko riippuvuudet päivittyneet?

    ./lein modules ancient
