Valtionavustusjärjestelmän palvelimien provisiointi
===================================================

* hanki pouta-tunnukset
* [asenna Nova-työkalut](https://research.csc.fi/pouta-credentials)
* kun olet ajanut `source openrc.sh`, sinun pitäisi saada listattua tarjolla olevat käyttöjärjestelmä-imaget komennolla `nova image-list`
* lisää poutaan henkilökohtainen avaimesi skriptillä `add_personal_key.bash`
* asenna [Ansible](http://ansible.com/)
* luo palvelimet komennolla `ansible-playbook -i va.hosts create_machines.yml`
* testaa pääsetkö buildikoneelle komennolla `./ssh_to_build_machine.bash`
