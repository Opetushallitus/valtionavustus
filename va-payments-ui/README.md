# Payments UI

Maksatusten käyttöliittymä

## Kehitys

### Kehitystila

1. Käynnistä Virkailijan näkymä

2. Käynnistä Figwheel compiler

Figwheel compiler lähtee käyntiin komennolla:

    lein figwheel

Figwheel puskee cljs muutokset suoraan selaimelle.

Kun Figwheel on käynnissä, pitäisi selaimeen aueta `/payments/`

### Repl

Jos tahdot käyttää leiningenin repliä, onnistuu figwheelin käynnistys myös tätä
kautta.

```
$ lein repl
user=> (use 'figwheel-sidecar.repl-api)
user=> (start-figwheel!)
```

Myös esimerkiksi rlwrap toimii figwheelin kanssa:

    rlwrap lein figwheel

### Sovellus käyttää seuraavia kirjastoja:

- [Reagent](https://reagent-project.github.io/)
- [Material UI](http://www.material-ui.com)
- [Figwheel](https://github.com/bhauman/lein-figwheel)

## Tuotanto

### Tuotantopaketin luonti

    config="config/prod.edn" lein package

Eli käytettävä config-tiedosto annetaan polun kera
"config"-ympäristömuuttujalla.

## TODO

- SASS tai vastaava

