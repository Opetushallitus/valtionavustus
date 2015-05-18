Valtionavustusjärjestelmän palvelimien provisiointi
===================================================

* hanki pouta-tunnukset
* [asenna Nova-työkalut](https://research.csc.fi/pouta-install-client)
  - huom. OsX:ssä tulee valmiiksi six versio 1.4.1, joka ei ole nova-clientin kanssa yhteensopiva. Siksi asenna ja käytä novaa [virtualenvissä](http://docs.python-guide.org/en/latest/dev/virtualenvs/):
  - `pip install virtualenv`
  - `virtualenv pouta-venv`
  - `source pouta-venv/bin/activate`
  - `pip install python-novaclient`
* ja [alusta todennus](https://research.csc.fi/pouta-credentials)
* kun olet ajanut `source openrc.sh`, sinun pitäisi saada listattua tarjolla olevat käyttöjärjestelmä-imaget komennolla `nova image-list`
* lisää poutaan henkilökohtainen avaimesi skriptillä `add_personal_key.bash`
* asenna [Ansible](http://ansible.com/)
* luo palvelimet komennolla `ansible-playbook -i va.hosts create_machines.yml`
* testaa pääsetkö buildikoneelle komennolla `./ssh_to_build_machine.bash`
* palvelinten pitäisi myös vastata ansiblen pingiin `ansible all -i va.hosts -m ping -u cloud-user`
* alusta palvelimet komennolla `ansible-playbook -i va.hosts site.yml`  # perään voi laittaa -vvvv jos haluaa nähdä tarkemmin, mitä se tekee
