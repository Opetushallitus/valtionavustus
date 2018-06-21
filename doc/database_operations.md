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
select id as hakemus_id, user_key, avustushaku as avustushaku_id from hakija.hakemukset where id = 5346 and version_closed is null
```

Jos tiedät hakemuksen user_key:n:

``` sql
select id as hakemus_id, user_key, avustushaku as avustushaku_id from hakija.hakemukset where user_key = 'a4244aa43ddd6e3ef9e64bb80f4ee952f68232aa008d3da9c78e3b627e5675c8' and version_closed is null
```

### Tietyn hakemuksen kaikkien tilojen haku

Esimerkkinä hakemuksen 5806 kaikkien tilojen (status) haku,
luontijärjestyksessä:

``` sql
select created_at, status, form_submission_id, form_submission_version from hakija.hakemukset where id = 5007 order by created_at
```

### Avustushaun hakeminen lomakkeen sisällön perusteella

``` sql
select avustushaut.id as avustushaku_id, forms.id as form_id from hakija.forms join hakija.avustushaut on forms.id = avustushaut.form where forms.content::text ilike '%liiketaloudellisin perustein toimiva yhtiö%'
```

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
