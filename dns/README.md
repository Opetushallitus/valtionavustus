# DNS-palvelin

Tässä hakemistossa oleva palvelu käynnistää sinulle Docker containeriin Bind9 nimipalvelimen.

Nimipalvelin on käytettävissä osoitteessa 127.0.0.1:53 (udp)

Nimipalvelin yliajaa Valtionavustusten DNS konffit tavalla, joka saa AWS:ssä olevat Hosted Zonet
näyttämään siltä kuten ne olisi jo otettu tuotannossa käyttöön
(ts. kyseiset domainit olisi jo delegoitu AWS:ään)

## Käynnistäminen

* Aja komento `./start-local-dns.sh`

## Käyttäminen MacOS:ssä

Ohjeet "network locationin" luomiseen: https://support.apple.com/en-sa/guide/mac-help/mchlp1175/14.0/mac/14.0

* Luo itsellesi uusi "network location"
* Anna locationille nimeksi esim "VA DNS override"
* Ota käyttöön "VA DNS override" network location klikkaamalla apple-ikonia työpöydän vasemmasta ylälaidasta -> "Location"
* Muuta kyseisessä "network locationissa" DNS-palvelimien osoitteiksi 127.0.0.1 sekä 8.8.8.8


## Testaaminen

* Aja komento `./test-local-dns.sh`

## Käytön lopettaminen

* Vaihda "network location" takaisin tilaan "automatic"

## Jos container ei käynnisty koska "port 53 is already in use"

Known issues For Mac:

Creating a container with the port 53 fails with the error address already in use.
As a workaround, deactivate network acceleration by adding "kernelForUDP": false,
in the settings.json file located at ~/Library/Group Containers/group.com.docker/settings.json.

Jonka jälkeen käynnistä Docker daemon uudestaan

Lähde: https://docs.docker.com/desktop/release-notes/#4240
