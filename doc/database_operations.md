# Yleisiä tietokantaoperaatioita

Komento [psql-jq](../scripts/psql-jq) on wrapperi komennoille
[`psql`](https://www.postgresql.org/docs/current/static/app-psql.html)
ja [`jq`](https://stedolan.github.io/jq/).

### Tiedotteen asettaminen

Tiedote näkyy va-hakijassa ja va-virkailijassa sivuston yläosassa.

``` sql
update hakija.environment set notice = '{"fi": "Käyttökatko palvelussa to 1.2. klo 16.30 alkaen. Palvelu on taas käytössä tiistaiaamuna 6.2. klo 8.00.", "sv": "Driftsavbrott torsdagen 1.2 fr.o.m. kl. 16.30. Tjänsterna är i bruk igen tisdag morgon 6.2 kl. 8.00."}';
```

### Tiedotteen poistaminen

``` sql
update hakija.environment set notice = '{"fi": "", "sv": ""}';
```

### Avustushaun listaus jsonina

``` bash
psql-jq -d va-dev -c "select * from hakija.avustushaut where id = 165" | less
```

### Avustushakukohtaisten hakemuksien listaus jsonina

``` bash
psql-jq -d va-dev -c "select h.organization_name, h.id as hakemus_id, h.version as hakemus_version, h.user_key as hakemus_user_key, s.form as form_id, s.id as form_submission_id, s.version as form_submission_version, s.answers from hakija.hakemukset h join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version) where h.avustushaku = 3 and h.status != 'cancelled' and h.status != 'new' and h.version_closed is null and h.hakemus_type = 'hakemus' order by upper(h.organization_name), upper(h.project_name)" | less
```

### Kysely testi- tai tuotantopalvelimelta

Esimerkkinä hakemuksen tilan haku tuotannosta. Avaa ensiksi ssh-yhteys
palvelimelle oph-va-app-prod01, jotta lokaali portti 30022 forwardoituu
palvelimen porttiin 5432. Komenna sitten lokaalisti:

``` bash
psql-jq -d va-prod -h localhost -p 30022 -U va_hakija -c "select * from hakija.hakemukset where id = 5582 and version_closed is null" | less
```

### Hakemuksen tunnisteiden selvitys

Jos tiedät hakemuksen id:n:

``` sql
select id as hakemus_id, user_key, avustushaku as avustushaku_id from hakija.hakemukset where id = 5346 and version_closed is null;
```

Jos tiedät hakemuksen user_key:n:

``` sql
select id as hakemus_id, user_key, avustushaku as avustushaku_id from hakija.hakemukset where user_key = 'a4244aa43ddd6e3ef9e64bb80f4ee952f68232aa008d3da9c78e3b627e5675c8' and version_closed is null;
```

### Tietyn hakemuksen kaikkien tilojen haku

Esimerkkinä hakemuksen 5806 kaikkien tilojen (status) haku,
luontijärjestyksessä:

``` sql
select created_at, status, form_submission_id, form_submission_version from hakija.hakemukset where id = 5007 order by created_at;
```

### Avustushaun hakeminen lomakkeen sisällön perusteella

``` sql
select avustushaut.id as avustushaku_id, forms.id as form_id from hakija.forms join hakija.avustushaut on forms.id = avustushaut.form where forms.content::text ilike '%liiketaloudellisin perustein toimiva yhtiö%'
```

### Hakemuksen tai selvityksen version palautus

Seuraavassa esimerkissä 9324 on hakemukseen liitetyn lomakkeen
vastauksien (form_submission) id. Hakemuksen id on 9308:

``` sql
begin;

-- sulje hakemukseen liitetty viimeisin versio (version = 149) lomakkeen vastauksista
update hakija.form_submissions
set version_closed = now()
where id = 9324 and version = 149;

-- luo uusi versio (150) lomakkeen vastauksista aikaisemman palautettavan version pohjalta (version = 145)
insert into hakija.form_submissions (id, version, version_closed, form, answers)
select 9324, 150, null, form, answers from hakija.form_submissions where id = 9324 and version = 145;

-- sulje viimeisin versio hakemuksesta (version = 150)
update hakija.hakemukset
set version_closed = now()
where id = 9308 and version = 150;

-- luo uusi versio (151) hakemuksesta aikaisemman palautettavan version pohjalta (version = 146)
insert into hakija.hakemukset (id, version, version_closed, form_submission_id, form_submission_version, user_key, status, last_status_change_at, avustushaku, budget_total, budget_oph_share, organization_name, project_name, register_number, status_change_comment, user_oid, user_first_name, user_last_name, user_email, hakemus_type, parent_id, selvitys_email, status_valiselvitys, status_loppuselvitys, language, refused, refused_comment, refused_at)
select 9308, 151, null, 9324, 150, user_key, status, last_status_change_at, avustushaku, budget_total, budget_oph_share, organization_name, project_name, register_number, status_change_comment, user_oid, user_first_name, user_last_name, user_email, hakemus_type, parent_id, selvitys_email, status_valiselvitys, status_loppuselvitys, language, refused, refused_comment, refused_at from hakija.hakemukset where id = 9308 and version = 146;

commit;
```

Tämän jälkeen pitää tarkistaa viitataanko palautetussa hakemuksessa
liitetiedostoihin, jotka on myöhemmin merkitty poistetuiksi. Tälläisten
liitetiedostojen poistomerkintä pitää poistaa.

Etsi kaikki hakemuksen liitetiedostot:

``` bash
psql-jq -d va-prod -U va_hakija -h localhost -p 30022 -c "select h.id, h.version, h.version_closed, h.form_submission_id, h.form_submission_version, fs.answers from hakija.hakemukset h left join hakija.form_submissions fs on h.form_submission_id = fs.id and h.form_submission_version = fs.version where h.id = 9308 and h.version = 151" | grep -C2 -i attachment
```

Tarkista, että tietokannassa on liitetiedostot näillä kentillä ja
tiedostonimillä:

``` sql
select id, version, hakemus_id, hakemus_version, version_closed, created_at, field_id, filename, content_type, file_size from hakija.attachments where hakemus_id = 9308;
```

Palauta liitetiedostot, joihin viitataan hakemuksen vastauksista ja
jotka on merkitty poistetuiksi (`version_closed`-sarakkeessa on
päivämäärä):

``` sql
update hakija.attachments set version_closed = null where id = 6727 and version = 1 and hakemus_id = 9308;
```

Avaa hakemus va-hakijassa, tarkista ettei virheitä tule.

### Tietokannan dumpin luonti

CI tekee tuotannon tietokannasta dumpin joka yö. Dumpit ovat saatavilla
palvelimella oph-va-ci-test01 hakemistossa `/data/backups/db-dumps`.

Tietokannan dumpin luonti käsin, esimerkiksi testiympäristössä:

``` bash
ssh oph-va-app-test01
sudo -u postgres /usr/bin/pg_dump -v -Fc -d va-qa -f oph-va-app-test.customdump
```

Postgresin customdump-formaattia kannattaa käyttää, koska se säästää levytilaa gzip-pakkauksella, mutta halutessasi mahdollistaa valikoitujen tietokannan taulujen palauttamisen.

### Tietokannan dumpin palautus

Ennen palautusta varmista, että tietokannassa on postgres-niminen rooli superuser-oikeuksilla:

``` bash
psql -U postgres
postgres=# \du
```

```
                                     List of roles
   Role name   |                         Attributes                         | Member of
---------------+------------------------------------------------------------+-----------
 postgres      | Superuser, Create role, Create DB                          | {}
 va_hakija     | Superuser                                                  | {}
 va_virkailija | Superuser                                                  | {}
```

Palautus:

``` bash
dropdb va-qa
createdb -T template0 va-qa
pg_restore -v -d va-qa oph-va-app-test.customdump
```
