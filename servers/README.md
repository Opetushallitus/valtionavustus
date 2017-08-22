# Valtionavustusjärjestelmän palvelimien provisiointi

Kaikki tässä kuvatut komennot tulee ajaa samassa hakemistossa, jossa
tämä README on.

## Ansiblen asennus

Provisiointi tehdään Ansiblella, joka on Python-sovellus. Käytä
Pythonin 2.7-versiota. Ansiblea kannattaa ajaa
[Virtualenvissä](http://docs.python-guide.org/en/latest/dev/virtualenvs/),
jotta dependencyt ovat oikein.

Jos käytät macOS:ää, tarvitset OpenSSL:n, jossa on TLS1.2 tuki, ja
Pythonin, joka on käännetty sitä vasten. Voit asentaa ne Homebrewillä:

``` bash
brew install openssl
brew install python
```

Asennus, jos Python-binääri on polussa `/usr/local/bin/python2.7`:

``` bash
make install
```

Muulloin määritä asennukselle Python-binäärin polku:

``` bash
PYTHON_BIN=/opt/bin/python2.7 make install
```

Asennuksen jälkeen ota Virtualenv käyttöön:

``` bash
eval `make venv`
```

Hakemistossa `roles/3rdparty` on asennettu muiden tekemät Ansible-roolit
ja hakemistossa `library` Ansibleen lisätyt moduulit. Nämä asennetaan
Ansible Galaxyllä:

``` bash
ansible-galaxy install -r requirements.yml
```

Roolin päivittäminen onnistuu vivulla `--force` (ansible-galaxy kertoo siitä).

## Yhteyden testaaminen palvelimille

Palveliment ovat CSC:n VMware-ympäristössä. Palvelinten Ansible
Inventoryn meta-tiedot on listattu staattisesti tiedostossa
`vmware_inventory.json`. Käyttö:

``` bash
./vmware_inventory.py
```

Tarkista, että pääset ssh:lla palvelimille:

``` bash
ssh -F ssh.config oph-va-app-test01 'echo ok'
```

Tarkista, että palvelimet vastaavat pingiin:

``` bash
# kaikki palvelimet
ansible all -i vmware_inventory.py -m ping

# tietty palvelin
ansible oph-va-app-test01.csc.fi -i vmware_inventory.py -m ping
```

## Tehtäviä

### Provisioi palvelinten ssh-tunnukset

``` bash
ansible-playbook -i vmware_inventory.py site.yml -t ssh
```

### Provisioi palvelinten palomuurit

``` bash
ansible-playbook -i vmware_inventory.py site.yml -t firewall
```

### Uuden käyttäjän lisääminen CI:n Jenkinsiin

``` bash
ssh -F ssh.config oph-va-ci-test01 add_va_jenkins_user.bash $username
```

### Buildikoneen päivitys

Jenkinsin päivityksen jälkeen lisää jobeihin Slack-notifikaatiot
päälle käsin: Jenkinsin jobin Configure -> Add post-build action ->
Slack Notifications.

Jos buildikoneen jenkins-käyttäjän ssh-avain on muuttunut, se tulee
lisätä soresu-formin deployment-avaimiin GitHubissa.

### Provisioi palvelin

Jos palvelin on uusi CentOS-kone, täytyy palvelimella käydä käsin
poistamassa tiedostosta `/etc/sudoers` seuraava rivi:

```
Defaults    requiretty
```

Muulloin Ansiblen suorittama komento ei voi saada sudo-oikeuksia.

Provisioi yksittäinen palvelin:

``` bash
ansible-playbook -i vmware_inventory.py site.yml -l oph-va-app-test01.csc.fi
```

Jos haluat ajaa provisioinnin tietystä Ansiblen taskista lähtien:

``` bash
ansible-playbook -i vmware_inventory.py site.yml -l oph-va-app-test01.csc.fi --step --start-at-task="Add supervisor conf to start and stop the applications"
```

Provisioi kaikki palvelimet:

``` bash
ansible-playbook -i vmware_inventory.py site.yml
```

Voit käyttää vipua `-vvvv` nähdäksesi tarkemmin mitä komento tekee.
