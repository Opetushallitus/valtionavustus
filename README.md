# Valtionavustus

Valtionavustusten hakemiseen, käsittelyyn ja myöntämiseen tarkoitetut palvelut.

# Riippuvuudet

* Node.js tai io.js
* Leiningen (Clojure build tool): http://leiningen.org/

Riippuvuudet asentuvat ajamalla komennot:

    lein deps

ja

    npm install

# Komennot

Käynnistys:

    lein run

Testien ajo:

    lein spec -f d

tai (automaattisesti)

    lein spec -a

Huom: Vaikka ```lein run``` lataa automaattisesti muuttuneet koodit,
Javascriptin automaattikäännöstä varten pitää käynnistää erilliseen
terminaaliin oma watch komento:

    npm run watch

# Muut komennot

Ovatko riippuvuudet päivittyneet?

    lein ancient
