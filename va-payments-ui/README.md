# Payments UI

Maksatusten käyttöliittymä

## Kehitys

### Kehitystila

1. Käynnistä Virkailijan näkymä

2. Käynnistä Figwheel compiler

Figwheel compiler lähtee käyntiin komennolla:

    ../lein figwheel

Figwheel puskee cljs muutokset suoraan selaimelle.

Kun Figwheel on käynnissä, pitäisi selaimeen aueta `/payments/`

### Repl

Jos tahdot käyttää leiningenin repliä, onnistuu figwheelin käynnistys myös tätä
kautta.

```
$ ../lein repl
user=> (use 'figwheel-sidecar.repl-api)
user=> (start-figwheel!)
```

Leiningenin replin kanssa on ollut ongelmia requiren kanssa, koska se etsii
oletuksena .clj-tiedostoja.

Myös esimerkiksi rlwrap toimii figwheelin kanssa:

    rlwrap ../lein figwheel

### Sovellus käyttää seuraavia kirjastoja:

- [Reagent](https://reagent-project.github.io/)
- [Material UI](http://www.material-ui.com)
- [Figwheel](https://github.com/bhauman/lein-figwheel)

### Testaus

Sovellus on konfiguroitu käyttämään [doo]
(https://github.com/bensu/do://github.com/bensu/doo.) -runneria.

Testit voit ajaa kerran:

    $ ../lein doo once

Tai watching-modessa:

    $ ../lein doo

## Tuotanto

### Tuotantopaketin luonti

    config="config/prod.edn" ../lein package

`package` on alias, jolla tehdään sekä clean että build. Jos pelkän cleanin
tarvitsee tehdä, niin se onnistuu `../lein clean`

Käytettävä config-tiedosto annetaan polun kera
"config"-ympäristömuuttujalla. Paketti luodaan `va-virkailija`:n
`resources/public/payments`-kansioon. Myös kehitysaikainen build menee samaiseen
kansioon, jolloin sitä voi käyttää virkailijan näkymästä `payments/`-polussa.

