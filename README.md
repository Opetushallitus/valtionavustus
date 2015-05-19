# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut palvelut.

# Riippuvuudet

* Node.js tai io.js
* Leiningen (Clojure build tool): http://leiningen.org/

Riippuvuudet asentuvat ajamalla komennot:

    lein deps

ja

    npm install

# Tietokanta

Luo käyttäjä ```va``` (salasana: va)

    createuser -s va -P

Luo ```va-dev``` tietokanta

    createdb -E UTF-8 va-dev

Luo skeema

    psql va-dev < resources/ddl/create.sql

Lataa initial data

    psql va-dev < resources/ddl/initial.sql

# Käynnistys

Paikallisesti:

    lein run

Tuotantoversiona:

    lein uberjar
    CONFIG=config/prod.edn java -jar target/uberjar/oph-valtionavustus-0.1.0-SNAPSHOT-standalone.jar

**Huom:** Jar-tiedoston versio voi vaihtua

Eri ympäristön voi ottaa käyttöön seuraavasti

    lein with-profile dev run
    lein with-profile test run
    lein with-profile prod run

# Dokumentaatio

Swagger-pohjainen API-dokumentaatio löytyy osoitteesta http://localhost:8080/doc

# Testien ajo

Testien ajo (ajaa myös mocha testit):

    lein spec -f d

tai (automaattisesti)

    lein spec -a

Huom: Vaikka ```lein run``` lataa automaattisesti muuttuneet koodit,
Javascriptin automaattikäännöstä varten pitää käynnistää erilliseen
terminaaliin oma watch komento:

    npm run watch

## Mocha testit

Voit ajaa selaimella osoitteessa http://localhost:8080/test/runner.html

# Konfiguraatiot

Eri konfiguraatiot sijaitsevat hakemistossa ```config```.

Konfiguraatiotiedostot ovat EDN-formaatissa, joka on yksinkertaistettua
Clojure-tyyppinen tietorakenne.

# Muut komennot

Ovatko riippuvuudet päivittyneet?

    lein ancient
