# Loppuselvitysraportin Puuttuu-sarake

## Tavoite

Lisätään VA-datasetin `Asiatarkastamattomat`-välilehdelle `Puuttuu`-sarake, joka näyttää haun ja valmistelijan osalta niiden hyväksyttyjen avustusten määrän, joiden loppuselvityksen tila on `missing`. Raportin pitää näyttää myös haut, joissa ei ole yhtään `submitted`-tilaista loppuselvitystä mutta joissa on `missing`-tilaisia loppuselvityksiä.

## Rajaus

Nykyinen `Lukumäärä` säilyttää merkityksensä: se laskee loppuselvitykset, joiden tila on `submitted` ja joiden asiatarkastusta ei ole hyväksytty.

`Puuttuu` laskee vain voimassa olevien hakemusversioiden hyväksytyt avustukset. Hyväksyntä tarkoittaa tietokannassa ehtoa `arvio.status = 'accepted'`. Mukaan otetaan vain varsinaiset hakemukset (`hakemus_type = 'hakemus'`), joiden status ei ole `cancelled`, `draft` tai `new`. Avustuksesta kieltäytyneet (`refused IS TRUE`) ja aloittamatta keskeytetyt (`keskeytetty_aloittamatta IS TRUE`) jätetään pois. Loppuselvityspyynnön lähettämistä VA:n kautta ei edellytetä, jotta historialliset järjestelmän ulkopuolella toimitetut loppuselvitykset löytyvät siivousta varten.

## Toteutus

Raportin nykyinen tietokantakysely laajennetaan käsittelemään sekä `submitted`- että `missing`-tilat. Molemmat määrät lasketaan PostgreSQL:n ehdollisilla aggregaateilla ja ryhmitellään nykyiseen tapaan avustushaun sekä valmistelijan mukaan. Hyväksyntä- ja muut kelpoisuusrajaukset kohdistetaan vain `Puuttuu`-joukkoon, jotta nykyisen `Lukumäärä`-sarakkeen käyttäytyminen ei muutu. Kyselyn yhteinen ehto ottaa mukaan ainoastaan nykyiseen `Lukumäärä`-joukkoon tai kelvolliseen `Puuttuu`-joukkoon kuuluvat rivit, joten hylätyistä tai muista kelvottomista `missing`-hakemuksista ei synny `0 / 0` -raporttirivejä. Näin myös rivi, jonka arvot ovat `Lukumäärä = 0` ja `Puuttuu > 0`, tulee tulokseen.

Excel-sarakkeet ovat muutoksen jälkeen:

1. `Avustushaku`
2. `Lukumäärä`
3. `Puuttuu`
4. `Valmistelija`

Tietokantamigraatiota tai rajapintamuutosta ei tarvita.

## Testaus

Playwright-raporttitesti päivitetään tarkistamaan uusi otsikko ja siirtynyt valmistelijasarake. Nykyinen `submitted`-tapaus varmistaa koko rivin `Lukumäärä = 1`, `Puuttuu = 0`. Lisäksi lisätään tapaus, jossa hyväksytyn avustuksen loppuselvitys on edelleen `missing`: raportissa pitää olla kyseiselle haulle rivi `Lukumäärä = 0`, `Puuttuu = 1`.

Poissulkurajaukset varmennetaan kahdella negatiivisella tapauksella: ei-hyväksytty `missing`-hakemus ei saa tuottaa raporttiriviä, ja kahden hyväksytyn `missing`-avustuksen haussa avustuksesta kieltäytyneen hakemuksen pitää jäädä laskennasta pois.
