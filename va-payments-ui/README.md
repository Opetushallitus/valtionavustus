# Payments UI

Maksatusten käyttöliittymä

## Riippuvuudet

* [Reagent](https://reagent-project.github.io/)
* [Material UI](http://www.material-ui.com/)
* [Figwheel](https://github.com/bhauman/lein-figwheel)

## Kehitysympäristö

1. Käynnistä va-virkailija
2. Käynnistä Figwheel-kääntäjä

Figwheel compiler lähtee käyntiin komennolla:

``` bash
../lein figwheel
```

Kääntäjä luo buildin hakemistoon
`../va-virkailija/resources/public/payments`.

Figwheel puskee muutokset `.cljs`-tiedostoissa selaimelle. Kun Figwheel
on käynnissä, pitäisi selaimeen aueta `/payments/`.

### REPL

Figwheelin voi käynnistää REPL:n kautta:

``` bash
lein repl
# user=> (use 'figwheel-sidecar.repl-api)
# user=> (start-figwheel!)
```

Leiningenin REPL:n kanssa on ollut ongelmia requiren kanssa, koska se
etsii oletuksena .clj-tiedostoja.

rlwrap toimii Figwheelin kanssa:

``` bash
rlwrap lein figwheel
```

### Testaus

Sovellus on konfiguroitu käyttämään [doo]
(https://github.com/bensu/do://github.com/bensu/doo.) -runneria.

Testit voit ajaa kerran:

``` bash
../lein doo once
```

Tai watching-modessa:

``` bash
    $ ../lein doo
```

## Tuotantoympäristö

Sovelluksen kääntäminen tuotantoympäristöön:

``` bash
CONFIG=config/prod.edn ../lein package
```

`package` on alias, joka suorittaa `clean` ja `build` -taskit.
