Valtionavustusjärjestelmän palvelimien provisiointi
===================================================

* hanki pouta-tunnukset
* [asenna Nova-työkalut](https://research.csc.fi/pouta-install-client)
  - huom. OsX:ssä tulee valmiiksi six versio 1.4.1, joka ei ole nova-clientin kanssa yhteensopiva. Siksi asenna ja käytä novaa [virtualenvissä](http://docs.python-guide.org/en/latest/dev/virtualenvs/):
  - `pip install virtualenv`
  - `virtualenv python-venv`
    * huom. jos käytössä OsX, niin tarvitaan uudempi OpenSSL (jossa TLS1.2 tuki) ja python joka on käännetty sitä vasten:
      `brew install openssl`
      `brew install python`
      `virtualenv -p /usr/local/bin/python2.7 python-venv`
  - `source python-venv/bin/activate`
  - `pip install python-novaclient ansible`
* ja [alusta todennus](https://research.csc.fi/pouta-credentials)
  - tallenna `tlp*-openrc.sh` tähän hakemistoonn
* kun olet ajanut `source tlp*-openrc.sh`, sinun pitäisi saada listattua tarjolla olevat käyttöjärjestelmä-imaget komennolla `./python-venv/bin/nova image-list`
* lisää poutaan henkilökohtainen avaimesi skriptillä `add_personal_key.bash`
* luo palvelimet komennolla `./python-venv/bin/ansible-playbook -i openstack_inventory.py create_machines.yml`
  - jos jonkin palvelimen luominen keskeytyy virheeseen, saattaa olla parasta tuhota palvelin ja yrittää uudelleen.
  - virhetilanteissa komennon uudelleen ajaminen _ei_ korjaa tilannetta (komento ei ole atominen).
* alusta uuden koneen ssh (huom. pitää siis antaa luojan pouta pem, koska muut eivät ole vielä luetettuja)
  - `./python-venv/bin/ansible-playbook -i openstack_inventory.py init_ssh.yml --private-key ~/.ssh/pouta-$USER.pem -l va-test`
* testaa pääsetkö koneelle ssh komennolla:
  - `./open-ssh va-test` tai
  - `./open-ssh va-build`
* tarkista, että uusi palvelin myös vastaa ansiblen pingiin (esim. va-test tai kaikki `all`):
  - `./python-venv/bin/ansible va-test -i openstack_inventory.py -m ping -u cloud-user`
* roles/3rdparty hakemistoon on asennettu muiden tekemät roolit. Nämä Ansible-roolit ovat asennettu Ansible Galaxystä:
  - `./python-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty --role-file=third_party_roles.yml`
  - roolin päivittäminen onnistuu samalla tavalla, mutta vaatii --force -vivun (ansible-galaxy kertoo kyllä siitä)
* Kolmannen osapuolen muut kirjastot
  - `./python-venv/bin/ansible-galaxy install gaqzi.ssh-config -p library/`
* alusta palvelimet
  - `./python-venv/bin/ansible-playbook -i openstack_inventory.py site.yml`
  - perään voi laittaa -vvvv jos haluaa nähdä tarkemmin, mitä se tekee
  - jos haluat ajaa vain tietyt taskit niin onnisttuu steppaamalal halutusta kohdasta alkaen.
    * esim. `./python-venv/bin/ansible-playbook -i openstack_inventory.py site.yml -l va-test --step --start-at-task="Add script to start and stop the application"`

# Uuden käyttäjän lisääminen buildikoneelle kirjautumista varten
`./open-ssh va-build add_va_jenkins_user.bash <käyttäjätunnus>`
# Buildikoneen päivittämisen jälkeen lisää jobeihin Slack-notifikaatiot päälle käsin: jobin Configure ->
  Add post-build action -> Slack Notifications
# Ja jos buildikoneen jenkins-käyttäjän SSH-avain on muuttunut, se tulee lisätä soresu-form -repon deployment-avaimiin.


Vinkkejä virhetilanteisiin
==========================

* Jos levyjärjestelmään tulee häiriö, joka saa aikaan levyjärjestelmän rikkoutumisen niin että se herjaa eri
  operaatioille "Input/output error", sen saattaa saada korjattua xfs_repair \-komennolla. Ks.
  [tarkemmat ohjeet](disk_io_error_repair.md).
