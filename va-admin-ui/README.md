# Admin UI

Pääkäyttäjän käyttöliittymä

## Riippuvuudet

* [Reagent](https://reagent-project.github.io/)
* [Material UI](http://www.material-ui.com/)
* [Figwheel](https://github.com/bhauman/lein-figwheel)

## Kehitysympäristö

1. Käännä riippuvuudet `make clean build`
2. Käynnistä va-virkailija
3. Käynnistä Figwheel-kääntäjä

Figwheel kannattaa ajaa suoraan REPL:stä (esim. Emacs Cider):

``` bash
lein repl
# user=> (use 'figwheel-sidecar.repl-api)
# user=> (start-figwheel!)
# user=> (cljs-repl)
```

Figwheel compiler lähtee käyntiin myös komennolla:

``` bash
../lein figwheel
```

Kääntäjä luo buildin hakemistoon
`../va-virkailija/resources/public/admin-ui`.

Figwheel puskee muutokset `.cljs`-tiedostoissa selaimelle. Kun Figwheel
on käynnistynyt, pitäisi selaimeen aueta `/admin-ui/`.

### Vaihtoehtoinen REPL

Myös rlwrap toimii Figwheelin kanssa:

``` bash
rlwrap lein figwheel
```

### Testaus

Sovellus on konfiguroitu käyttämään
[doo](https://github.com/bensu/doo)-runneria.

Testit voit ajaa kerran:

``` bash
../lein doo once
```

Tai watching-modessa:

``` bash
../lein doo
```

## Tuotantoympäristö

Sovelluksen kääntäminen tuotantoympäristöön:

``` bash
../lein package
```

`package` on alias, joka suorittaa `clean` ja `build` -taskit.
