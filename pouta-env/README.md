Valtionavustusjärjestelmän palvelimien provisiointi
===================================================

* hanki pouta-tunnukset
* [asenna Nova-työkalut](https://research.csc.fi/pouta-install-client)
  - huom. OsX:ssä tulee valmiiksi six versio 1.4.1, joka ei ole nova-clientin kanssa yhteensopiva. Siksi asenna ja käytä novaa [virtualenvissä](http://docs.python-guide.org/en/latest/dev/virtualenvs/):
  - `pip install virtualenv`
  - `virtualenv pouta-venv`
  - `source pouta-venv/bin/activate`
  - `pip install python-novaclient ansible`
* ja [alusta todennus](https://research.csc.fi/pouta-credentials)
  - tallenna `tlp*-openrc.sh` tähän hakemistoonn
* kun olet ajanut `source tlp*-openrc.sh`, sinun pitäisi saada listattua tarjolla olevat käyttöjärjestelmä-imaget komennolla `./pouta-venv/bin/nova image-list`
* lisää poutaan henkilökohtainen avaimesi skriptillä `add_personal_key.bash`
* luo palvelimet komennolla `./pouta-venv/bin/ansible-playbook -i openstack_inventory.py create_machines.yml`
  - jos jonkin palvelimen luominen keskeytyy virheeseen, saattaa olla parasta tuhota palvelin ja yrittää uudelleen.
  - virhetilanteissa komennon uudelleen ajaminen _ei_ korjaa tilannetta (komento ei ole atominen).
* testaa pääsetkö buildikoneelle komennolla `./ssh_to_build_machine.bash`
* palvelinten pitäisi myös vastata ansiblen pingiin `./pouta-venv/bin/ansible all -i openstack_inventory.py -m ping -u cloud-user`
* roles/3rdparty hakemistoon on asennettu muiden tekemät roolit. Nämä Ansible-roolit ovat asennettu Ansible Galaxystä:
  - `./pouta-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty Stouts.jenkins`
  - `./pouta-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty debops.nginx`
  - `./pouta-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty nodesource.node`
  - `./pouta-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty debops.pki`
* alusta palvelimet komennolla `./pouta-venv/bin/ansible-playbook -i openstack_inventory.py site.yml`  # perään voi laittaa -vvvv jos haluaa nähdä tarkemmin, mitä se tekee


# Uuden käyttäjän lisääminen buildikoneelle kirjautumista varten
`./ssh_to_build_machine.bash add_va_jenkins_user.bash <käyttäjätunnus>`