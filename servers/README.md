Valtionavustusjärjestelmän palvelimien provisiointi
===================================================

* provisiointi tehdään Ansiblella
* käytä ansiblea [virtualenvissä](http://docs.python-guide.org/en/latest/dev/virtualenvs/):
  - `pip install virtualenv`
  - `virtualenv python-venv`
    * huom. jos käytössä OsX, niin tarvitaan uudempi OpenSSL (jossa TLS1.2 tuki) ja python joka on käännetty sitä vasten:
      `brew install openssl`
      `brew install python`
      `virtualenv -p /usr/local/bin/python2.7 python-venv`
  - `source python-venv/bin/activate`
  - `pip install ansible`
* roles/3rdparty hakemistoon on asennettu muiden tekemät Ansible-roolit. Nämä Ansible-roolit ovat asennettu Ansible Galaxystä:
  - `./python-venv/bin/ansible-galaxy install --roles-path=roles/3rdparty --role-file=third_party_roles.yml  --ignore-errors`
  - roolin päivittäminen onnistuu samalla tavalla, mutta vaatii --force -vivun (ansible-galaxy kertoo kyllä siitä)
* Kolmannen osapuolen muut kirjastot
  - `./python-venv/bin/ansible-galaxy install gaqzi.ssh-config -p library/`

### Uuden käyttäjän lisääminen buildikoneelle kirjautumista varten
`./ssh_to_va-build.bash add_va_jenkins_user.bash <käyttäjätunnus>`
### Buildikoneen päivittämisen jälkeen lisää jobeihin Slack-notifikaatiot päälle käsin: jobin Configure ->
  Add post-build action -> Slack Notifications
### Ja jos buildikoneen jenkins-käyttäjän SSH-avain on muuttunut, se tulee lisätä soresu-form -repon deployment-avaimiin.

## CSC vmware ympäristö

* palvelinten inventory meta tiedot on listattu staattisesti tiedostossa: `vmware_inventory.json`
  - käytetään `vmware_inventory.py` avulla
* tarkista, että palvelimet vastaavat ansiblen pingiin (esim. oph-va-app-test01` tai kaikki `all`):
  - `./python-venv/bin/ansible all -i vmware_inventory.py -m ping`
* asenna netaddr -python-paketti, esim
  - `pip install netaddr`
* alusta palvelinten ssh tunnukset ja niiden oikeudet
  - `./python-venv/bin/ansible-playbook -i vmware_inventory.py init_ssh.yml`
* alusta kaikki palvelimet
  - `./python-venv/bin/ansible-playbook -i vmware_inventory.py site.yml`
  - perään voi laittaa -vvvv jos haluaa nähdä tarkemmin, mitä se tekee
  - huom. jos on täysin uusi CentOs kone täytyy käydä koneella kommentoimassa käsin `/etc/sudoers`:sta tämä rivi:
    * `Defaults    requiretty`
    * muuten ei Ansible saa sudotettua itseään
* alusta yksittäinen palvelin
  - `./python-venv/bin/ansible-playbook -i vmware_inventory.py site.yml -l oph-va-app-test01.csc.fi`
* jos haluat ajaa vain tietyt taskit niin onnistuu steppaamalla halutusta kohdasta alkaen.
    * esim. `./python-venv/bin/ansible-playbook -i vmware_inventory.py site.yml -l oph-va-app-test01.csc.fi --step --start-at-task="Add supervisor conf to start and stop the applications"`
